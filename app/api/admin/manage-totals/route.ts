import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminAuth } from '@/lib/auth';
import {
  parseSupporterAdjustments,
  summarizeManageTotals,
  SupporterScope,
} from '@/lib/widgets';

export const dynamic = 'force-dynamic';

const SETTINGS_KEYS = [
  'goal_title',
  'goal_target',
  'goal_started_at',
  'goal_amount_offset',
  'supporter_adjustments',
];

async function loadState() {
  const [{ data: settingsRows, error: settingsErr }, { data: donationRows, error: donErr }] =
    await Promise.all([
      supabaseAdmin.from('settings').select('key, value').in('key', SETTINGS_KEYS),
      supabaseAdmin
        .from('donations')
        .select('name, amount, created_at')
        .eq('status', 'verified')
        .order('created_at', { ascending: false })
        .limit(5000),
    ]);

  if (settingsErr) throw settingsErr;
  if (donErr) throw donErr;

  const settings = Object.fromEntries((settingsRows || []).map(r => [r.key, r.value]));
  const rows = donationRows || [];
  return { settings, rows, summary: summarizeManageTotals(rows, settings) };
}

async function broadcastUpdate() {
  const channel = supabaseAdmin.channel('donation-alerts');
  try {
    await channel.httpSend('settings_updated', { updatedAt: Date.now() });
  } catch {
    // ignore realtime broadcast failure
  } finally {
    await supabaseAdmin.removeChannel(channel).catch(() => {});
  }
}

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { summary } = await loadState();
    return NextResponse.json(
      { success: true, data: summary },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('Manage totals GET error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'โหลดข้อมูลไม่สำเร็จ' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body?.action;
    const { settings, rows, summary } = await loadState();

    if (action === 'set_goal_current') {
      const desired = Number(body.desiredCurrent);
      if (!Number.isFinite(desired) || desired < 0 || desired > 9999999999) {
        return NextResponse.json({ success: false, message: 'ยอดปัจจุบันไม่ถูกต้อง' }, { status: 400 });
      }
      const newOffset = Math.round((desired - summary.goal.rawCurrent) * 100) / 100;
      const upserts: { key: string; value: string }[] = [
        { key: 'goal_amount_offset', value: String(newOffset) },
      ];
      settings.goal_amount_offset = String(newOffset);

      if (body.target !== undefined) {
        const tgt = Number(body.target);
        if (Number.isFinite(tgt) && tgt > 0 && tgt <= 9999999999) {
          upserts.push({ key: 'goal_target', value: String(tgt) });
          settings.goal_target = String(tgt);
        }
      }
      if (typeof body.title === 'string' && body.title.trim()) {
        upserts.push({ key: 'goal_title', value: body.title.trim().slice(0, 160) });
        settings.goal_title = body.title.trim().slice(0, 160);
      }

      const { error } = await supabaseAdmin.from('settings').upsert(upserts, { onConflict: 'key' });
      if (error) throw error;
      await broadcastUpdate();

      return NextResponse.json({
        success: true,
        message: `ตั้งยอดหลอดเป้าหมายเป็น ฿${desired.toLocaleString('th-TH')} แล้ว`,
        data: summarizeManageTotals(rows, settings),
      });
    }

    if (action === 'adjust_goal_delta') {
      const delta = Number(body.delta);
      if (!Number.isFinite(delta) || Math.abs(delta) > 9999999999) {
        return NextResponse.json({ success: false, message: 'ค่าปรับยอดไม่ถูกต้อง' }, { status: 400 });
      }
      const nextCurrent = Math.max(0, Math.round((summary.goal.current + delta) * 100) / 100);
      const newOffset = Math.round((nextCurrent - summary.goal.rawCurrent) * 100) / 100;
      settings.goal_amount_offset = String(newOffset);

      const { error } = await supabaseAdmin
        .from('settings')
        .upsert([{ key: 'goal_amount_offset', value: String(newOffset) }], { onConflict: 'key' });
      if (error) throw error;
      await broadcastUpdate();

      return NextResponse.json({
        success: true,
        message: `ปรับยอดหลอดเป้าหมายเป็น ฿${nextCurrent.toLocaleString('th-TH')} แล้ว`,
        data: summarizeManageTotals(rows, settings),
      });
    }

    if (action === 'reset_goal_offset') {
      settings.goal_amount_offset = '0';
      const { error } = await supabaseAdmin
        .from('settings')
        .upsert([{ key: 'goal_amount_offset', value: '0' }], { onConflict: 'key' });
      if (error) throw error;
      await broadcastUpdate();

      return NextResponse.json({
        success: true,
        message: 'คืนค่ายอดหลอดเป้าหมายตามสลิปจริงแล้ว',
        data: summarizeManageTotals(rows, settings),
      });
    }

    if (action === 'set_supporter_total') {
      const name = String(body.name || '').trim().slice(0, 60);
      const desired = Number(body.desiredAmount);
      const scope = body.scope as SupporterScope;
      const applyAllScopes = Boolean(body.applyAllScopes);

      if (!name) {
        return NextResponse.json({ success: false, message: 'กรุณาระบุชื่อผู้สนับสนุน' }, { status: 400 });
      }
      if (!Number.isFinite(desired) || desired < 0 || desired > 9999999999) {
        return NextResponse.json({ success: false, message: 'ยอดเงินไม่ถูกต้อง' }, { status: 400 });
      }
      if (!['daily', 'monthly', 'allTime'].includes(scope)) {
        return NextResponse.json({ success: false, message: 'โหมดอันดับไม่ถูกต้อง' }, { status: 400 });
      }

      const adjustments = parseSupporterAdjustments(settings.supporter_adjustments);
      const targetScopes: SupporterScope[] = applyAllScopes
        ? ['daily', 'monthly', 'allTime']
        : [scope];

      for (const s of targetScopes) {
        const existing = summary.leaderboards[s].find(item => item.name === name);
        const rawAmount = existing ? existing.rawAmount : 0;
        const newOffset = Math.round((desired - rawAmount) * 100) / 100;
        if (!adjustments[s]) adjustments[s] = {};
        if (newOffset === 0) {
          delete adjustments[s]![name];
        } else {
          adjustments[s]![name] = newOffset;
        }
      }

      const jsonStr = JSON.stringify(adjustments);
      settings.supporter_adjustments = jsonStr;
      const { error } = await supabaseAdmin
        .from('settings')
        .upsert([{ key: 'supporter_adjustments', value: jsonStr }], { onConflict: 'key' });
      if (error) throw error;
      await broadcastUpdate();

      return NextResponse.json({
        success: true,
        message:
          desired === 0
            ? `นำ "${name}" ออกจากอันดับแล้ว`
            : `ตั้งยอดรวมของ "${name}" เป็น ฿${desired.toLocaleString('th-TH')} แล้ว`,
        data: summarizeManageTotals(rows, settings),
      });
    }

    if (action === 'reset_supporter_adjustments') {
      const scope = body.scope as SupporterScope | 'all';
      const adjustments = parseSupporterAdjustments(settings.supporter_adjustments);
      if (scope === 'all' || !scope) {
        delete adjustments.daily;
        delete adjustments.monthly;
        delete adjustments.allTime;
      } else if (['daily', 'monthly', 'allTime'].includes(scope)) {
        delete adjustments[scope];
      }

      const jsonStr = JSON.stringify(adjustments);
      settings.supporter_adjustments = jsonStr;
      const { error } = await supabaseAdmin
        .from('settings')
        .upsert([{ key: 'supporter_adjustments', value: jsonStr }], { onConflict: 'key' });
      if (error) throw error;
      await broadcastUpdate();

      return NextResponse.json({
        success: true,
        message: 'คืนค่ายอดอันดับตามสลิปจริงเรียบร้อยแล้ว',
        data: summarizeManageTotals(rows, settings),
      });
    }

    return NextResponse.json({ success: false, message: 'ไม่รู้จักคำสั่ง' }, { status: 400 });
  } catch (err: any) {
    console.error('Manage totals POST error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'บันทึกข้อมูลไม่สำเร็จ' },
      { status: 500 }
    );
  }
}
