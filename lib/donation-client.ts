import type { PromptPayResult } from './services/promptpay';
import type { Donation } from './types/database';
import type { WidgetData } from './widgets';

type Request = typeof fetch;
async function readResult<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success || !result.data) {
    throw new Error(result?.message || 'ไม่สามารถยืนยันผลรายการได้ กรุณาตรวจสอบสถานะก่อนทำรายการซ้ำ');
  }
  return result.data;
}

function confirmedDonation(data: Donation): Donation {
  if (!data.id || data.status !== 'verified' || !Number.isFinite(data.amount) || data.amount <= 0) {
    throw new Error('ยังไม่สามารถยืนยันรายการได้ กรุณาติดต่อผู้ดูแลก่อนทำรายการซ้ำ');
  }
  return data;
}

export async function createDonationQr(amount: number, request: Request = fetch): Promise<PromptPayResult> {
  const response = await request('/api/donate/generate-qr', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount }),
  });
  const data = await readResult<PromptPayResult>(response);
  if (data.amount !== amount || !data.promptpayId || !(data.qrImage || data.qrDataUrl)) throw new Error('ข้อมูล QR Code ไม่ครบถ้วน กรุณาลองสร้างใหม่');
  return data;
}
export async function verifyDonation(input: { name: string; message: string; amount: string; slip: File; mediaUrl?: string }, request: Request = fetch): Promise<Donation> {
  const body = new FormData();
  body.append('name', input.name.trim());
  body.append('message', input.message.trim());
  body.append('amount', input.amount);
  body.append('slip', input.slip);
  if (input.mediaUrl && input.mediaUrl.trim()) {
    body.append('media_url', input.mediaUrl.trim());
  }
  return confirmedDonation(await readResult<Donation>(await request('/api/donate/verify-slip', { method: 'POST', body })));
}
export async function redeemDonation(input: { name: string; message: string; voucher: string; mediaUrl?: string }, request: Request = fetch): Promise<Donation> {
  const payload: Record<string, string> = {
    name: input.name.trim(),
    message: input.message.trim(),
    voucher_url: input.voucher.trim(),
  };
  if (input.mediaUrl && input.mediaUrl.trim()) {
    payload.media_url = input.mediaUrl.trim();
  }
  const response = await request('/api/donate/truemoney', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return confirmedDonation(await readResult<Donation>(response));
}

export async function loadDonationWidgets(signal: AbortSignal, request: Request = fetch): Promise<WidgetData> {
  const response = await request('/api/widgets?limit=3', { cache: 'no-store', signal });
  const result = await response.json().catch(() => null);
  const data = result?.data;
  if (!response.ok || !result?.success || !data?.goal ||
      typeof data.goal.title !== 'string' || !Number.isFinite(data.goal.current) || data.goal.current < 0 ||
      !Number.isFinite(data.goal.target) || data.goal.target <= 0 || !Array.isArray(data.allTime) ||
      data.allTime.some((donor: { name: string; amount: number }) => !donor || typeof donor.name !== 'string' || !Number.isFinite(donor.amount) || donor.amount <= 0)) {
    throw new Error('โหลดข้อมูลเป้าหมายและอันดับไม่สำเร็จ');
  }
  return data;
}
