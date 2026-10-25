import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { summarizeWidgets } from '@/lib/widgets';
import { goalAppearanceDefaults } from '@/lib/goalAppearance';
import { supporterDefaults } from '@/lib/supporterAppearance';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { data: settingsRows, error } = await supabaseAdmin.from('settings').select('key, value').in('key', ['goal_title', 'goal_target', 'goal_started_at', ...Object.keys(goalAppearanceDefaults), ...Object.keys(supporterDefaults)]);
    if (error) throw error;
    const settings = Object.fromEntries((settingsRows || []).map(row => [row.key, row.value]));
    // ดึงข้อมูลแบบมีเพดานกำกับ (Bounded Query) สูงสุดไม่เกิน 300 แถวล่าสุดสำหรับคำนวณ Widget
    let query = supabaseAdmin
      .from('donations')
      .select('name, amount, created_at')
      .eq('status', 'verified')
      .order('created_at', { ascending: false });

    // หากมีการระบุวันเริ่มต้นเป้าหมาย ให้กรองเฉพาะช่วงที่เกี่ยวข้อง
    if (settings.goal_started_at) {
      query = query.gte('created_at', settings.goal_started_at);
    }
    const { data: rowsData, error: donationError } = await query.limit(300);
    if (donationError) throw donationError;
    const rows = rowsData || [];
    const requestedLimit = new URL(request.url).searchParams.get('limit');
    return NextResponse.json({ success: true, data: summarizeWidgets(rows, settings, new Date(), requestedLimit ? Number(requestedLimit) : undefined) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Widget data error:', error);
    return NextResponse.json({ success: false, message: 'โหลดข้อมูลวิดเจ็ตไม่สำเร็จ' }, { status: 500 });
  }
}
