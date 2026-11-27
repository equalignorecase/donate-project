import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminAuth } from '@/lib/auth';
import { GoalAppearance, goalAppearanceDefaults, validGoalAppearance } from '@/lib/goalAppearance';
import { SupporterAppearance, supporterDefaults, validSupporterAppearance } from '@/lib/supporterAppearance';
import { QrCardAppearance, qrCardDefaults, validQrCardAppearance } from '@/lib/qrCardAppearance';
import { DONATE_PAGE_SETTING_KEYS, sanitizePublicUrl } from '@/lib/donate-page-profile';

export const dynamic = 'force-dynamic';

function publicSettings(settings: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(settings).filter(([key]) =>
    key.startsWith('alert_') ||
    key.startsWith('tts_') ||
    key.startsWith('media_share_') ||
    key.startsWith('donate_page_') ||
    ['receiver_name', 'min_donate', 'tts_enabled', 'tts_min_amount', 'stream_studio_layout'].includes(key)
  ));
}

export async function GET(request: Request) {
  try {
    const isAdmin = verifyAdminAuth(request);

    const { data: rows, error } = await supabaseAdmin
      .from('settings')
      .select('key, value');

    if (error) throw error;

    const settings: Record<string, string> = {};
    if (rows) {
      rows.forEach((r: any) => {
        // Mask secret keys for non-admin requests
        if (!isAdmin && (r.key === 'slipok_api_key' || r.key === 'admin_secret' || r.key === 'valorant_api_key')) {
          settings[r.key] = r.value ? '********' : '';
        } else {
          settings[r.key] = r.value;
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        settings: isAdmin ? settings : publicSettings(settings)
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (err: any) {
    console.error('Get settings error:', err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const newSettings = await request.json();
    if (!newSettings || typeof newSettings !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    if (('goal_target' in newSettings && (!Number.isFinite(Number(newSettings.goal_target)) || Number(newSettings.goal_target) <= 0 || Number(newSettings.goal_target) > 9999999999)) ||
        ('goal_amount_offset' in newSettings && newSettings.goal_amount_offset !== '' && (!Number.isFinite(Number(newSettings.goal_amount_offset)) || Math.abs(Number(newSettings.goal_amount_offset)) > 9999999999)) ||
        ('goal_title' in newSettings && (typeof newSettings.goal_title !== 'string' || !newSettings.goal_title.trim() || newSettings.goal_title.length > 160)) ||
        ('goal_started_at' in newSettings && newSettings.goal_started_at !== '' && !Number.isFinite(Date.parse(newSettings.goal_started_at))) ||
        ('media_share_min_amount' in newSettings && newSettings.media_share_min_amount !== '' && (!Number.isFinite(Number(newSettings.media_share_min_amount)) || Number(newSettings.media_share_min_amount) < 1 || Number(newSettings.media_share_min_amount) > 1000000)) ||
        ('media_share_max_duration' in newSettings && newSettings.media_share_max_duration !== '' && (!Number.isFinite(Number(newSettings.media_share_max_duration)) || Number(newSettings.media_share_max_duration) < 5 || Number(newSettings.media_share_max_duration) > 600)) ||
        ('media_share_volume' in newSettings && newSettings.media_share_volume !== '' && (!Number.isFinite(Number(newSettings.media_share_volume)) || Number(newSettings.media_share_volume) < 0 || Number(newSettings.media_share_volume) > 100))) {
      return NextResponse.json({ success: false, message: 'การตั้งค่าบางรายการไม่ถูกต้อง (ตรวจสอบช่วงตัวเลขอีกครั้ง)' }, { status: 400 });
    }

    if (
      (DONATE_PAGE_SETTING_KEYS.name in newSettings && String(newSettings[DONATE_PAGE_SETTING_KEYS.name] ?? '').trim().length > 60) ||
      (DONATE_PAGE_SETTING_KEYS.handle in newSettings && String(newSettings[DONATE_PAGE_SETTING_KEYS.handle] ?? '').trim().length > 60) ||
      (DONATE_PAGE_SETTING_KEYS.bio in newSettings && String(newSettings[DONATE_PAGE_SETTING_KEYS.bio] ?? '').trim().length > 300)
    ) {
      return NextResponse.json({ success: false, message: 'ชื่อ @handle หรือ Bio ยาวเกินกำหนด' }, { status: 400 });
    }

    const relativeAllowedUrlKeys = [DONATE_PAGE_SETTING_KEYS.avatarUrl, DONATE_PAGE_SETTING_KEYS.heroUrl];
    for (const key of relativeAllowedUrlKeys) {
      if (key in newSettings && String(newSettings[key] ?? '').trim() !== '' && !sanitizePublicUrl(newSettings[key], true)) {
        return NextResponse.json({ success: false, message: `URL รูปภาพไม่ถูกต้อง: ${key}` }, { status: 400 });
      }
    }

    const externalOnlyUrlKeys = [
      DONATE_PAGE_SETTING_KEYS.socialDiscord,
      DONATE_PAGE_SETTING_KEYS.socialTiktok,
      DONATE_PAGE_SETTING_KEYS.socialYoutube,
      DONATE_PAGE_SETTING_KEYS.socialTwitch,
      DONATE_PAGE_SETTING_KEYS.socialInstagramOrX,
    ];
    for (const key of externalOnlyUrlKeys) {
      if (key in newSettings && String(newSettings[key] ?? '').trim() !== '' && !sanitizePublicUrl(newSettings[key], false)) {
        return NextResponse.json({ success: false, message: 'ลิงก์โซเชียลต้องขึ้นต้นด้วย https:// หรือ http://' }, { status: 400 });
      }
    }

    // Upsert into Supabase settings table
    for (const key of Object.keys(goalAppearanceDefaults) as (keyof GoalAppearance)[]) {
      if (key in newSettings && !validGoalAppearance(key, newSettings[key])) {
        return NextResponse.json({ success: false, message: `ค่ารูปแบบเป้าหมายไม่ถูกต้อง: ${key}` }, { status: 400 });
      }
    }
    for (const key of Object.keys(supporterDefaults) as (keyof SupporterAppearance)[]) {
      if (key in newSettings && !validSupporterAppearance(key, newSettings[key])) {
        return NextResponse.json({ success: false, message: `ค่ารูปแบบอันดับไม่ถูกต้อง: ${key}` }, { status: 400 });
      }
    }
    for (const key of Object.keys(qrCardDefaults) as (keyof QrCardAppearance)[]) {
      if (key in newSettings && !validQrCardAppearance(key, newSettings[key])) {
        return NextResponse.json({ success: false, message: `ค่ารูปแบบการ์ดรูป/QR ไม่ถูกต้อง: ${key}` }, { status: 400 });
      }
    }
    const upsertRows = Object.entries(newSettings).map(([key, value]) => ({
      key,
      value: String(value ?? '')
    }));

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert(upsertRows, { onConflict: 'key' });

    if (error) throw error;

    // Fetch updated complete settings to broadcast
    const { data: allRows } = await supabaseAdmin
      .from('settings')
      .select('key, value');

    const updatedSettings: Record<string, string> = {};
    if (allRows) {
      allRows.forEach((r: any) => {
        updatedSettings[r.key] = r.value;
      });
    }

    // Broadcast live to OBS overlay
    const channel = supabaseAdmin.channel('donation-alerts');
    try {
      await channel.httpSend('settings_updated', publicSettings(updatedSettings));
    } catch (realtimeErr: any) {
      console.warn('Realtime broadcast error:', realtimeErr.message);
    } finally {
      await supabaseAdmin.removeChannel(channel).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าและอัปเดตไปยัง OBS เรียบร้อยแล้ว',
      settings: updatedSettings
    });
  } catch (err: any) {
    console.error('Update settings error:', err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
