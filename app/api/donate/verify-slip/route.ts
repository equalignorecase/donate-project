import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifySlip } from '@/lib/services/slipok';
import { filterMessage } from '@/lib/services/blacklist';
import { Donation } from '@/lib/types/database';
import { MAX_SLIP_FILE_SIZE_BYTES } from '@/lib/constants';
import { applyDonationToTimer } from '@/lib/timerLogic';
import { parseYouTubeUrl, isMissingMediaUrlColumnError } from '@/lib/media-share';
import { loadMediaShareConfig } from '@/lib/media-share-server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// In-Flight Locks to prevent race conditions when the same slip is submitted concurrently
const inFlightSlipHashes = new Set<string>();
const inFlightTransRefs = new Set<string>();
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rate = await checkRateLimit(`slip:${clientIp}`, 6, 120000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, message: 'คุณส่งสลิปบ่อยเกินไป กรุณารอ 2 นาทีก่อนลองใหม่' },
        { status: 429 }
      );
    }
    const formData = await request.formData();
    const slipFile = formData.get('slip') as File | null;
    const rawName = (formData.get('name') || '').toString().trim();
    const amountStr = formData.get('amount') as string;
    const rawMessage = (formData.get('message') || '').toString().trim();
    const rawMediaUrl = (formData.get('media_url') || '').toString().trim();

    if (formData.get('simulate') === 'true') {
      return NextResponse.json(
        { success: false, message: 'ไม่รองรับการจำลองโดเนทผ่านหน้าสาธารณะ' },
        { status: 403 }
      );
    }

    // 1. Input Sanitization & Validation
    const name = await filterMessage(rawName ? rawName.slice(0, 50) : 'ผู้สนับสนุนนิรนาม');
    const cleanMessage = await filterMessage(rawMessage.slice(0, 200));

    const expectedAmount = parseFloat(amountStr);
    if (isNaN(expectedAmount) || expectedAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'ยอดเงินไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // 2. Check minimum donation setting
    try {
      const { data: minSet, error: minErr } = await supabaseAdmin
        .from('settings')
        .select('value')
        .eq('key', 'min_donate')
        .single();
      if (minErr) {
        console.error('[verify-slip] Failed to read min_donate setting:', minErr.message);
      }
      const parsedMin = parseFloat(minSet?.value);
      const minVal = Number.isFinite(parsedMin) && parsedMin > 0 ? parsedMin : 1;
      if (expectedAmount < minVal) {
        return NextResponse.json(
          { success: false, message: `ยอดเงินขั้นต่ำในการโดเนทคือ ${minVal} บาท` },
          { status: 400 }
        );
      }
    } catch (e: any) {
      console.error('[verify-slip] Unexpected error reading min_donate:', e?.message || e);
      if (expectedAmount < 1) {
        return NextResponse.json(
          { success: false, message: 'ยอดเงินขั้นต่ำในการโดเนทคือ 1 บาท' },
          { status: 400 }
        );
      }
    }

    let validatedMediaUrl: string | null = null;
    let mediaMinAmount = 0;
    if (rawMediaUrl) {
      const mediaConfig = await loadMediaShareConfig();
      if (!mediaConfig.enabled) {
        return NextResponse.json(
          { success: false, message: 'ขณะนี้ระบบปิดรับลิงก์คลิป YouTube ชั่วคราว' },
          { status: 400 }
        );
      }
      const parsedMedia = parseYouTubeUrl(rawMediaUrl);
      if (!parsedMedia) {
        return NextResponse.json(
          { success: false, message: 'ลิงก์ YouTube ไม่ถูกต้อง รองรับเฉพาะลิงก์ youtube.com หรือ youtu.be' },
          { status: 400 }
        );
      }
      if (expectedAmount < mediaConfig.minAmount) {
        return NextResponse.json(
          { success: false, message: `ยอดโดเนทขั้นต่ำสำหรับแนบลิงก์คลิปคือ ${mediaConfig.minAmount} บาท` },
          { status: 400 }
        );
      }
      validatedMediaUrl = parsedMedia.canonicalUrl;
      mediaMinAmount = mediaConfig.minAmount;
    }

    let verifiedData: {
      verified: boolean;
      transRef: string;
      amount: number;
      senderName: string;
      senderBank: string;
      receiverName: string;
      transDate?: string;
    };

    // 3. Require a real slip before creating a verified donation.
    if (!slipFile) {
      return NextResponse.json(
        { success: false, message: 'กรุณาอัปโหลดรูปภาพสลิป' },
        { status: 400 }
      );
    }

    // 4. File Security Checks (MIME type & Size limit)
    if (slipFile.size > MAX_SLIP_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: 'ขนาดไฟล์ภาพสลิปต้องไม่เกิน 4MB' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(slipFile.type)) {
      return NextResponse.json(
        { success: false, message: 'รูปแบบไฟล์ไม่ถูกต้อง รองรับเฉพาะ JPG, PNG, WEBP' },
        { status: 400 }
      );
    }

    const arrayBuffer = await slipFile.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const slipHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    if (inFlightSlipHashes.has(slipHash)) {
      return NextResponse.json(
        { success: false, message: 'กำลังตรวจสอบสลิปนี้อยู่ กรุณารอสักครู่' },
        { status: 409 }
      );
    }
    inFlightSlipHashes.add(slipHash);

    try {
      try {
        verifiedData = await verifySlip({
          fileBuffer,
          fileName: slipFile.name || 'slip.jpg',
          mimeType: slipFile.type || 'image/jpeg',
          expectedAmount,
          log: true
        });
      } catch (err: any) {
        const failReason = err.message || 'การตรวจสอบสลิปล้มเหลว';
        const slipTransRef =
          err.details?.data?.transRef ||
          err.details?.transRef ||
          err.details?.slipData?.transRef ||
          '';
        const uniqueFailRef = `FAIL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const displayRef = `${uniqueFailRef} | ${failReason}${slipTransRef ? ` [Ref: ${slipTransRef}]` : ''}`;

        try {
          await supabaseAdmin.from('donations').insert([
            {
              name,
              amount: expectedAmount,
              message: cleanMessage,
              transaction_ref: displayRef,
              sender_name:
                err.details?.data?.sender?.displayName ||
                err.details?.data?.sender?.name ||
                err.details?.slipData?.sender?.displayName ||
                err.details?.slipData?.sender?.name ||
                'ผู้สนับสนุนนิรนาม',
              sender_bank:
                err.details?.data?.sendingBank ||
                err.details?.slipData?.sendingBank ||
                '',
              receiver_name:
                err.details?.data?.receiver?.displayName ||
                err.details?.data?.receiver?.name ||
                err.details?.slipData?.receiver?.displayName ||
                err.details?.slipData?.receiver?.name ||
                '',
              transaction_date: new Date().toISOString(),
              status: 'failed'
            }
          ]);
        } catch (logErr: any) {
          console.warn('Could not record failed slip to database:', logErr.message);
        }

        return NextResponse.json(
          { success: false, message: failReason, code: err.code },
          { status: 400 }
        );
      }

      if (inFlightTransRefs.has(verifiedData.transRef)) {
        return NextResponse.json(
          { success: false, message: 'สลิปนี้กำลังถูกบันทึกในระบบแล้ว (สลิปซ้ำ)' },
          { status: 409 }
        );
      }
      inFlightTransRefs.add(verifiedData.transRef);

      try {
        // Double-check duplicate transRef right before insert
        const { data: dupCheck } = await supabaseAdmin
          .from('donations')
          .select('id')
          .eq('transaction_ref', verifiedData.transRef)
          .neq('status', 'failed')
          .limit(1);

        if (dupCheck && dupCheck.length > 0) {
          return NextResponse.json(
            { success: false, message: 'สลิปนี้เคยถูกส่งเข้าสู่ระบบแล้ว (สลิปซ้ำ)', code: 1012 },
            { status: 400 }
          );
        }

        // 5. Insert into Supabase donations table
        const effectiveMediaUrl = validatedMediaUrl && verifiedData.amount >= mediaMinAmount
          ? validatedMediaUrl
          : null;

        const donationRecord: Donation = {
          name,
          amount: verifiedData.amount,
          message: cleanMessage,
          ...(effectiveMediaUrl ? { media_url: effectiveMediaUrl } : {}),
          transaction_ref: verifiedData.transRef,
          sender_name: verifiedData.senderName,
          sender_bank: verifiedData.senderBank,
          receiver_name: verifiedData.receiverName,
          transaction_date: verifiedData.transDate || new Date().toISOString(),
          status: 'verified'
        };

        let { data: inserted, error: insertError } = await supabaseAdmin
          .from('donations')
          .insert([donationRecord])
          .select()
          .single();

        if (insertError && effectiveMediaUrl && isMissingMediaUrlColumnError(insertError)) {
          const { media_url: _omitted, ...fallbackRecord } = donationRecord;
          const retry = await supabaseAdmin
            .from('donations')
            .insert([fallbackRecord])
            .select()
            .single();
          inserted = retry.data;
          insertError = retry.error;
        }

        if (insertError) {
          if (insertError.code === '23505') {
            return NextResponse.json(
              { success: false, message: 'สลิปนี้เคยถูกส่งเข้าสู่ระบบแล้ว (สลิปซ้ำ)', code: 1012 },
              { status: 400 }
            );
          }
          console.error('Supabase insert error:', insertError);
          return NextResponse.json(
            { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + insertError.message },
            { status: 500 }
          );
        }

        // 6. Check and update countdown timer if enabled
        const timerEvent = await applyDonationToTimer(supabaseAdmin, {
          name: inserted.name,
          amount: inserted.amount
        });

        // 7. Broadcast event to Supabase Realtime channel for instant OBS alert
        const channel = supabaseAdmin.channel('donation-alerts');
        try {
          await channel.httpSend('donation', {
            id: inserted.id,
            name: inserted.name,
            amount: inserted.amount,
            message: inserted.message,
            ...(effectiveMediaUrl ? { media_url: effectiveMediaUrl } : {})
          });
          if (timerEvent) {
            await channel.httpSend('timer_update', timerEvent);
          }
        } catch (realtimeErr: any) {
          console.warn('Realtime broadcast warning:', realtimeErr.message);
        } finally {
          await supabaseAdmin.removeChannel(channel).catch(() => {});
        }

        return NextResponse.json({
          success: true,
          message: 'การโดเนทสำเร็จและส่งการแจ้งเตือนขึ้นจอแล้ว!',
          data: effectiveMediaUrl ? { ...inserted, media_url: inserted.media_url ?? effectiveMediaUrl } : inserted
        });
      } finally {
        inFlightTransRefs.delete(verifiedData.transRef);
      }
    } finally {
      inFlightSlipHashes.delete(slipHash);
    }
  } catch (err: any) {
    console.error('Verify slip fatal error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'เกิดข้อผิดพลาดของระบบ' },
      { status: 500 }
    );
  }
}
