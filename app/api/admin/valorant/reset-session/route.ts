import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminAuth } from '@/lib/auth';
import { parseValorantAccounts } from '@/lib/valorantSettings';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    let accountId: string | null = null;
    try {
      const body = await request.json();
      if (body && typeof body === 'object' && body.accountId) {
        accountId = String(body.accountId);
      }
    } catch (e) {}

    const resetTime = new Date().toISOString();
    const upsertRows: { key: string; value: string }[] = [
      { key: 'valorant_session_reset_at', value: resetTime },
    ];

    if (accountId) {
      const { data: row } = await supabaseAdmin
        .from('settings')
        .select('value')
        .eq('key', 'valorant_accounts')
        .maybeSingle();

      const accounts = parseValorantAccounts(row?.value);
      const target = accounts.find(a => a.id === accountId);
      if (target) {
        target.session_reset_at = resetTime;
        upsertRows.push({
          key: 'valorant_accounts',
          value: JSON.stringify(accounts),
        });
      }
    }

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert(upsertRows, { onConflict: 'key' });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'รีเซ็ตสถิติ Win/Loss เรียบร้อยแล้ว',
      reset_at: resetTime,
      accountId,
    });
  } catch (err: any) {
    console.error('Reset Valorant session error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

