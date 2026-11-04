import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const VALID_ACTIONS = new Set(['skip_alert', 'pause_queue', 'resume_queue']);

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || 'skip_alert');

    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json({ success: false, message: 'คำสั่งควบคุมไม่ถูกต้อง' }, { status: 400 });
    }

    const channel = supabaseAdmin.channel('donation-alerts');
    try {
      await channel.httpSend(action, { timestamp: Date.now() });
    } finally {
      await supabaseAdmin.removeChannel(channel).catch(() => {});
    }

    const msgMap: Record<string, string> = {
      skip_alert: 'สั่งข้าม Alert และหยุดเสียง TTS บนจอ OBS แล้ว',
      pause_queue: 'พักคิวการแจ้งเตือนบนจอ OBS ชั่วคราวแล้ว',
      resume_queue: 'เปิดเล่นคิวการแจ้งเตือนบนจอ OBS ต่อแล้ว'
    };

    return NextResponse.json({
      success: true,
      action,
      message: msgMap[action] || 'ส่งคำสั่งควบคุมสำเร็จ'
    });
  } catch (err: any) {
    console.error('Alert control error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'เกิดข้อผิดพลาดในการส่งคำสั่ง' },
      { status: 500 }
    );
  }
}

