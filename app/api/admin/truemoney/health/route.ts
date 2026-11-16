import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { checkTrueMoneyHealth } from '@/lib/truemoney-health';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const result = await checkTrueMoneyHealth(process.env.TRUEMONEY_API_URL);

  return NextResponse.json(result, {
    status: result.success ? 200 : 503,
  });
}
