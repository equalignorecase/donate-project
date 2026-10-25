export type PaymentMethod = 'promptpay' | 'truemoney';
export type DonationErrors = Partial<Record<'name' | 'amount' | 'message' | 'method' | 'slip' | 'voucher', string>>;

export interface DonationInput {
  name: string;
  amount: string;
  message: string;
  method: string;
  hasSlip: boolean;
  requireSlip?: boolean;
  minAmount?: number;
  voucher?: string;
}

export function validateDonation(input: DonationInput): DonationErrors {
  const errors: DonationErrors = {};
  if (!input.name.trim()) errors.name = 'กรุณาใส่ชื่อผู้สนับสนุน';
  else if (input.name.length > 50) errors.name = 'ชื่อยาวได้ไม่เกิน 50 ตัวอักษร';
  const minimum = Math.max(1, input.minAmount || 1);
  if (input.method === 'promptpay' && (!/^\d+(\.\d{1,2})?$/.test(input.amount) || !Number.isFinite(Number(input.amount)) || Number(input.amount) < minimum || Number(input.amount) > 1000000)) {
    errors.amount = `ระบุจำนวนเงิน ${minimum.toLocaleString('th-TH')}–1,000,000 บาท และทศนิยมไม่เกิน 2 ตำแหน่ง`;
  }
  if (input.message.length > 200) errors.message = 'ข้อความยาวได้ไม่เกิน 200 ตัวอักษร';
  if (!['promptpay', 'truemoney'].includes(input.method)) errors.method = 'กรุณาเลือกช่องทางสนับสนุน';
  if (input.method === 'promptpay' && input.requireSlip && !input.hasSlip) errors.slip = 'กรุณาแนบรูปสลิปหลังโอนเงิน';
  if (input.method === 'truemoney') {
    try {
      const url = new URL(input.voucher?.trim() || '');
      if (url.origin !== 'https://gift.truemoney.com' || url.username || url.password || !/^\/campaign\/?$/.test(url.pathname) || !/^[a-zA-Z0-9]+$/.test(url.searchParams.get('v') || '')) throw new Error('Invalid voucher');
    } catch {
      errors.voucher = 'กรุณาใส่ลิงก์ซองของขวัญ https://gift.truemoney.com/campaign/?v=…';
    }
  }
  return errors;
}

export function validateSlip(file: { type: string; size: number }): string | undefined {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'รองรับเฉพาะไฟล์ JPG, PNG และ WEBP';
  if (file.size === 0 || file.size > 4 * 1024 * 1024) return 'กรุณาเลือกไฟล์ขนาดมากกว่า 0 และไม่เกิน 4 MB';
  return undefined;
}
