import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const PUBLIC_KEYS = new Set(['min_donate', 'receiver_name', 'stream_studio_layout']);

function isPublicSettingKey(key: string): boolean {
  return PUBLIC_KEYS.has(key) || key.startsWith('alert_') || key.startsWith('tts_');
}

export async function GET() {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('settings')
      .select('key, value');

    if (error) throw error;

    const settings: Record<string, string> = {};
    if (rows) {
      rows.forEach((r: { key: string; value: string }) => {
        if (!isPublicSettingKey(r.key)) return;
        settings[r.key] = r.value;
      });
    }

    let blacklist: string[] = [];
    try {
      const { data: blacklistRows } = await supabaseAdmin
        .from('blacklist')
        .select('word');
      if (blacklistRows) {
        blacklist = blacklistRows
          .map((r: { word: string }) => r.word)
          .filter((w: string) => typeof w === 'string' && w.trim());
      }
    } catch (e: any) {
      console.warn('Could not load custom blacklist:', e.message);
    }

    return NextResponse.json(
      {
        success: true,
        settings,
        blacklist
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
    console.error('Get public settings error:', err);
    return NextResponse.json(
      { success: false, message: 'โหลดการตั้งค่าไม่สำเร็จ' },
      { status: 500 }
    );
  }
}
