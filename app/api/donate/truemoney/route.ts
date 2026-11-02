import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { filterMessage } from '@/lib/services/blacklist';
import { Donation } from '@/lib/types/database';
import { applyDonationToTimer } from '@/lib/timerLogic';

// In-Flight Voucher Lock to prevent concurrent redemption of the same voucher link
const inFlightVouchers = new Set<string>();

// In-Memory IP Rate Limiter (จำกัด 6 ครั้งต่อ 2 นาทีต่อหนึ่ง IP)
const truemoneyRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkTruemoneyRateLimit(ip: string, limit = 6, windowMs = 120000): boolean {
  const now = Date.now();
  const entry = truemoneyRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    truemoneyRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

function isValidTrueMoneyVoucher(input: string): boolean {
  if (/^[a-zA-Z0-9_-]{10,64}$/.test(input)) return true;
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'gift.truemoney.com') {
      return false;
    }
    const v = parsed.searchParams.get('v') || '';
    return /^[a-zA-Z0-9_-]{10,64}$/.test(v) || parsed.pathname.includes('/campaign');
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const clientIp = forwardedFor.split(',')[0].trim();
    if (!checkTruemoneyRateLimit(clientIp, 6, 120000)) {
      return NextResponse.json(
        { success: false, message: 'คุณส่งลิงก์ซองของขวัญบ่อยเกินไป กรุณารอ 2 นาทีก่อนลองใหม่' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, message, voucher_url } = body;

    // 1. Validation
    if (!voucher_url || typeof voucher_url !== 'string' || voucher_url.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกลิงก์ซองของขวัญ TrueMoney' },
        { status: 400 }
      );
    }

    const cleanVoucher = voucher_url.trim();
    if (!isValidTrueMoneyVoucher(cleanVoucher)) {
      return NextResponse.json(
        { success: false, message: 'รูปแบบลิงก์ซองของขวัญ TrueMoney ไม่ถูกต้อง (ต้องเป็น https://gift.truemoney.com/campaign/?v=...)' },
        { status: 400 }
      );
    }

    if (inFlightVouchers.has(cleanVoucher)) {
      return NextResponse.json(
        { success: false, message: 'กำลังตรวจสอบซองของขวัญนี้อยู่ กรุณารอสักครู่' },
        { status: 409 }
      );
    }
    inFlightVouchers.add(cleanVoucher);

    try {
      // 2. Determine Receiver Phone Number (DB settings > .env)
      let receiverPhone = process.env.TRUEMONEY_PHONE || '';
      try {
        const { data: phoneRow } = await supabaseAdmin
          .from('settings')
          .select('value')
          .eq('key', 'truemoney_phone')
          .single();
        if (phoneRow?.value && phoneRow.value.trim() !== '') {
          receiverPhone = phoneRow.value.trim();
        }
      } catch {}

      receiverPhone = receiverPhone.replace(/[^0-9]/g, '');
      if (!receiverPhone) {
        return NextResponse.json(
          { success: false, message: 'ระบบยังไม่ได้ตั้งค่าเบอร์ TrueMoney สำหรับรับเงิน กรุณาแจ้งผู้ดูแล' },
          { status: 500 }
        );
      }

      // 3. Call TrueMoney Redeem API
      const baseApi = process.env.TRUEMONEY_API_URL?.replace(/\/+$/, '');
      if (!baseApi) {
        return NextResponse.json(
          { success: false, message: 'ระบบ TrueMoney ยังไม่ได้กำหนดค่า TRUEMONEY_API_URL ที่ปลอดภัย' },
          { status: 500 }
        );
      }
      const redeemEndpoint = `${baseApi}/redeem`;

      console.log(`[TrueMoney] Calling API: ${redeemEndpoint} for mobile: ${receiverPhone}`);

      const apiRes = await fetch(redeemEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          mobile: receiverPhone,
          voucher_url: cleanVoucher
        }),
        cache: 'no-store'
      });

      const apiData = await apiRes.json().catch(() => null);

      if (!apiRes.ok || !apiData) {
        const errorMsg = apiData?.data?.status?.message_th || apiData?.detail || 'ไม่สามารถรับเงินจากซองของขวัญได้ กรุณาตรวจสอบลิงก์';
        console.warn('[TrueMoney] API error response:', apiData);
        return NextResponse.json(
          { success: false, message: errorMsg },
          { status: 400 }
        );
      }

      const statusObj = apiData?.data?.status || {};
      if (statusObj.code !== 'SUCCESS' && apiData?.http_code !== 200) {
        return NextResponse.json(
          { success: false, message: statusObj.message_th || statusObj.message || 'ซองของขวัญไม่ถูกต้องหรือถูกรับไปแล้ว' },
          { status: 400 }
        );
      }

      // 4. Extract Voucher details
      const voucher = apiData?.data?.data?.voucher || {};
      const ownerProfile = apiData?.data?.data?.owner_profile || {};
      const myTicket = apiData?.data?.data?.my_ticket || {};

      const voucherId = String(voucher.voucher_id || cleanVoucher);
      const amountNum = parseFloat(String(myTicket.amount_baht || voucher.amount_baht || 0));

      if (isNaN(amountNum) || amountNum <= 0) {
        return NextResponse.json(
          { success: false, message: 'ยอดเงินในซองไม่ถูกต้อง หรือซองถูกใช้งานไปแล้ว' },
          { status: 400 }
        );
      }

      // 5. Check duplicate voucher_id in database
      const { data: existingDonation } = await supabaseAdmin
        .from('donations')
        .select('id')
        .eq('transaction_ref', voucherId)
        .limit(1);

      if (existingDonation && existingDonation.length > 0) {
        return NextResponse.json(
          { success: false, message: 'ซองของขวัญนี้ถูกใช้งานในระบบไปแล้ว' },
          { status: 400 }
        );
      }

      // 6. Filter name & message
      const donorName = await filterMessage((name || ownerProfile.full_name || 'ผู้สนับสนุนใจดี').trim().slice(0, 50));
      const rawMessage = (message || '').trim().slice(0, 200);
      const cleanMsg = await filterMessage(rawMessage);

      // 7. Insert into donations table
      const donationRecord: Donation = {
        name: donorName,
        amount: amountNum,
        message: cleanMsg,
        transaction_ref: voucherId,
        sender_name: ownerProfile.full_name || 'TrueMoney User',
        sender_bank: 'TRUEMONEY',
        receiver_name: receiverPhone,
        transaction_date: new Date().toISOString(),
        status: 'verified'
      };

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('donations')
        .insert([donationRecord])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json(
            { success: false, message: 'ซองของขวัญนี้ถูกใช้งานในระบบไปแล้ว' },
            { status: 400 }
          );
        }
        console.error('[TrueMoney] Insert DB error:', insertError);
        return NextResponse.json(
          { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + insertError.message },
          { status: 500 }
        );
      }

      // 8. Update Subathon Timer if active
      const timerEvent = await applyDonationToTimer(supabaseAdmin, {
        name: inserted.name,
        amount: inserted.amount
      });

      // 9. Broadcast to Supabase Realtime channel for instant OBS alert
      const channel = supabaseAdmin.channel('donation-alerts');
      try {
        await channel.httpSend('donation', {
          id: inserted.id,
          name: inserted.name,
          amount: inserted.amount,
          message: inserted.message,
          sender_bank: 'TRUEMONEY'
        });
        if (timerEvent) {
          await channel.httpSend('timer_update', timerEvent);
        }
      } catch (realtimeErr: any) {
        console.warn('[TrueMoney] Realtime broadcast warning:', realtimeErr.message);
      } finally {
        await supabaseAdmin.removeChannel(channel).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: 'รับซอง TrueMoney สำเร็จ ยอดเงินเข้าบัญชีเรียบร้อยแล้ว!',
        data: inserted
      });
    } finally {
      inFlightVouchers.delete(cleanVoucher);
    }
  } catch (err: any) {
    console.error('[TrueMoney] Fatal error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ TrueMoney' },
      { status: 500 }
    );
  }
}
