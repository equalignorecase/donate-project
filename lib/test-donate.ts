import { parseYouTubeUrl } from './media-share';

export const TEST_DONATE_MAX_AMOUNT = 1_000_000;
export const TEST_DONATE_DEFAULT_NAME = 'ผู้ชมทดสอบ';
export const TEST_DONATE_DEFAULT_MESSAGE = 'นี่คือการทดสอบระบบ Alert ขึ้นจอ OBS ผ่าน Supabase Realtime!';

export interface TestDonationRawInput {
  name?: unknown;
  amount?: unknown;
  message?: unknown;
  media_url?: unknown;
}

export interface NormalizedTestDonationInput {
  name: string;
  amount: number;
  message: string;
  mediaUrl?: string;
}

export type TestDonationValidationResult =
  | { ok: true; data: NormalizedTestDonationInput }
  | { ok: false; error: string };

/**
 * Validate and normalize payload for `/api/admin/test-alert` without persisting anything to DB.
 */
export function validateAndBuildTestDonationInput(
  raw: TestDonationRawInput | null | undefined
): TestDonationValidationResult {
  const input = raw || {};

  const numericAmount =
    input.amount === undefined
      ? 50
      : typeof input.amount === 'number'
        ? input.amount
        : Number(String(input.amount).trim());

  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > TEST_DONATE_MAX_AMOUNT) {
    return {
      ok: false,
      error: `กรุณาระบุจำนวนเงินทดสอบระหว่าง 1 – ${TEST_DONATE_MAX_AMOUNT.toLocaleString('th-TH')} บาท`,
    };
  }

  const roundedAmount = Math.round(numericAmount * 100) / 100;
  if (roundedAmount <= 0) {
    return {
      ok: false,
      error: `กรุณาระบุจำนวนเงินทดสอบระหว่าง 1 – ${TEST_DONATE_MAX_AMOUNT.toLocaleString('th-TH')} บาท`,
    };
  }

  const rawName = typeof input.name === 'string' ? input.name.trim() : '';
  const name = (rawName || TEST_DONATE_DEFAULT_NAME).slice(0, 50);

  const hasMessageProp = Object.prototype.hasOwnProperty.call(input, 'message') && typeof input.message === 'string';
  const rawMessage = hasMessageProp ? String(input.message).trim() : TEST_DONATE_DEFAULT_MESSAGE;
  const message = rawMessage.slice(0, 200);

  const rawMedia = typeof input.media_url === 'string' ? input.media_url.trim() : '';
  let mediaUrl: string | undefined;
  if (rawMedia) {
    const parsedMedia = parseYouTubeUrl(rawMedia);
    if (!parsedMedia) {
      return {
        ok: false,
        error: 'ลิงก์ YouTube สำหรับ Media Share ไม่ถูกต้อง (รองรับ youtube.com/watch?v=... หรือ youtu.be/...)',
      };
    }
    mediaUrl = parsedMedia.canonicalUrl;
  }

  return {
    ok: true,
    data: {
      name,
      amount: roundedAmount,
      message,
      ...(mediaUrl ? { mediaUrl } : {}),
    },
  };
}
