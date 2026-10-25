import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const PUBLIC_KEYS = ['min_donate', 'receiver_name', 'promptpay_id'];

export async function GET() {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .in('key', PUBLIC_KEYS);

    if (error) throw error;

    const settings: Record<string, string> = {};
    if (rows) {
      rows.forEach((r: { key: string; value: string }) => {
        settings[r.key] = r.value;
      });
    }

    return NextResponse.json(
      {
        success: true,
        settings
      },
      {
        headers: {
          'Cache-Control': 'no-store'
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
