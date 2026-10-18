import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { filterMessage } from '@/lib/services/blacklist';
import { Donation } from '@/lib/types/database';
import { readTimerConfig, calculateTimerDelta, computeRemainingSeconds } from '@/lib/timerLogic';

export async function POST(request: Request) {
  try {
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

    // 2. Determine Receiver Phone Number (DB settings > .env > default)
    let receiverPhone = process.env.TRUEMONEY_PHONE || '0649520055';
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
    const baseApi = (process.env.TRUEMONEY_API_URL || 'https://localhostvlr-wallet-api.vercel.app').replace(/\/+$/, '');
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

    // 6. Filter message
    const donorName = (name || ownerProfile.full_name || 'ผู้สนับสนุนใจดี').trim().slice(0, 50);
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
      console.error('[TrueMoney] Insert DB error:', insertError);
      return NextResponse.json(
        { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + insertError.message },
        { status: 500 }
      );
    }

    // 8. Update Subathon Timer if active
    let timerEvent: any = null;
    try {
      const { data: timerRows } = await supabaseAdmin
        .from('settings')
        .select('key, value')
        .ilike('key', 'timer_%');

      if (timerRows && timerRows.length > 0) {
        const timerSettings: Record<string, string> = {};
        timerRows.forEach(r => { timerSettings[r.key] = r.value; });
        const timerConfig = readTimerConfig(timerSettings);

        if (timerConfig.timer_enabled && timerConfig.timer_status !== 'stopped') {
          const { deltaSeconds, ruleMatched } = calculateTimerDelta(inserted.amount, timerConfig);
          if (deltaSeconds !== 0) {
            const currentSec = computeRemainingSeconds(timerConfig);
            let newSec = Math.max(0, currentSec + deltaSeconds);
            if (timerConfig.timer_max_cap_seconds > 0 && newSec > timerConfig.timer_max_cap_seconds) {
              newSec = timerConfig.timer_max_cap_seconds;
            }
            const nowIso = new Date().toISOString();
            await supabaseAdmin.from('settings').upsert([
              { key: 'timer_remaining_seconds', value: String(newSec) },
              { key: 'timer_last_updated_at', value: nowIso }
            ], { onConflict: 'key' });

            timerEvent = {
              remaining_seconds: newSec,
              status: timerConfig.timer_status,
              last_updated_at: nowIso,
              delta_seconds: deltaSeconds,
              donor_name: inserted.name,
              donor_amount: inserted.amount,
              reason: ruleMatched
            };
          }
        }
      }
    } catch (timerErr: any) {
      console.warn('[TrueMoney] Timer update warning:', timerErr.message);
    }

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
  } catch (err: any) {
    console.error('[TrueMoney] Fatal error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ TrueMoney' },
      { status: 500 }
    );
  }
}
