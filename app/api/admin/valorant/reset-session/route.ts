import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resetTime = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({ key: 'valorant_session_reset_at', value: resetTime }, { onConflict: 'key' });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'รีเซ็ตสถิติ Win/Loss เรียบร้อยแล้ว',
      reset_at: resetTime,
    });
  } catch (err: any) {
    console.error('Reset Valorant session error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

