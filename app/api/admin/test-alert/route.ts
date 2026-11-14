import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { filterMessage } from '@/lib/services/blacklist';
import { verifyAdminAuth } from '@/lib/auth';
import { Donation } from '@/lib/types/database';
import { validateAndBuildTestDonationInput } from '@/lib/test-donate';

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const validated = validateAndBuildTestDonationInput(body);
    if (!validated.ok) {
      return NextResponse.json(
        { success: false, message: 'error' in validated ? validated.error : 'ข้อมูลทดสอบไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const { name: rawName, amount, message: rawMessage, mediaUrl } = validated.data;
    const [filteredName, filteredMsg] = await Promise.all([
      filterMessage(rawName),
      rawMessage ? filterMessage(rawMessage) : Promise.resolve(''),
    ]);

    const profanityMasked = filteredName !== rawName || filteredMsg !== rawMessage;

    const testData: Donation = {
      id: 'test-' + Date.now(),
      name: (filteredName || rawName).slice(0, 50),
      amount,
      message: filteredMsg.slice(0, 200),
      ...(mediaUrl ? { media_url: mediaUrl } : {}),
      sender_bank: 'TEST',
      created_at: new Date().toLocaleTimeString('th-TH'),
      isTest: true,
    };

    // Broadcast through Supabase Realtime channel only (never insert into DB/Goal/Timer)
    const channel = supabaseAdmin.channel('donation-alerts');
    try {
      await channel.httpSend('donation', testData);
    } finally {
      await supabaseAdmin.removeChannel(channel).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'ส่ง Test Alert ขึ้นหน้าจอ OBS เรียบร้อยแล้ว!',
      profanityMasked,
      data: testData,
    });
  } catch (err: any) {
    console.error('Test alert error:', err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
