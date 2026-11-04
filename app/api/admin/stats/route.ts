import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkQuota } from '@/lib/services/slipok';
import { verifyAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify Admin Auth
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: totalDonations, error: totalErr } = await supabaseAdmin
      .from('donations')
      .select('name, amount, created_at')
      .eq('status', 'verified');

    if (totalErr) throw totalErr;

    const count = totalDonations ? totalDonations.length : 0;
    const totalAmount = totalDonations
      ? totalDonations.reduce((sum: number, d: any) => sum + (parseFloat(d.amount) || 0), 0)
      : 0;

    // Compute all-time top donator from verified donations
    const donatorTotals: Record<string, number> = {};
    (totalDonations || []).forEach((d: any) => {
      const donorName = (d.name || 'ผู้สนับสนุนนิรนาม').trim() || 'ผู้สนับสนุนนิรนาม';
      donatorTotals[donorName] = (donatorTotals[donorName] || 0) + (parseFloat(d.amount) || 0);
    });
    let topDonator = '-';
    let maxDonated = 0;
    for (const [donorName, sumAmt] of Object.entries(donatorTotals)) {
      if (sumAmt > maxDonated) {
        maxDonated = sumAmt;
        topDonator = `${donorName} (฿${sumAmt.toLocaleString('th-TH', { maximumFractionDigits: 2 })})`;
      }
    }

    // Today stats (using Bangkok timezone GMT+7)
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);

    const todayDonations = (totalDonations || []).filter((d: any) => {
      if (!d.created_at) return false;
      const dDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(d.created_at));
      return dDateStr === todayStr;
    });

    const todayCount = todayDonations.length;
    const todayAmount = todayDonations.reduce((sum: number, d: any) => sum + (parseFloat(d.amount) || 0), 0);

    let quotaInfo = null;
    try {
      const q = await checkQuota();
      if (q && q.data) {
        quotaInfo = q.data;
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      stats: {
        count,
        totalAmount,
        todayCount,
        todayAmount,
        topDonator
      },
      quota: quotaInfo
    });
  } catch (err: any) {
    console.error('Stats error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Error fetching stats' },
      { status: 500 }
    );
  }
}
