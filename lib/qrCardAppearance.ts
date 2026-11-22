import { goalFontOptions } from './goalAppearance';
import { sanitizePublicUrl } from './donate-page-profile';

export const qrCardDefaults = {
  qr_card_mode: 'qr',
  qr_card_qr_url: '',
  qr_card_image_url: '',
  qr_card_badge_text: 'SCAN TO DONATE',
  qr_card_title: 'สแกนเพื่อโดเนทสนับสนุน',
  qr_card_subtitle: 'PromptPay / TrueMoney ขึ้นจอทันที',
  qr_card_show_badge: 'true',
  qr_card_show_title: 'true',
  qr_card_show_subtitle: 'true',
  qr_card_layout: 'vertical',
  qr_card_text_align: 'center',
  qr_card_font: 'LINESeedSansTH-ExtraBold',
  qr_card_width: '320',
  qr_card_padding: '20',
  qr_card_gap: '14',
  qr_card_text_gap: '6',
  qr_card_media_size: '180',
  qr_card_media_radius: '16',
  qr_card_media_padding: '10',
  qr_card_radius: '24',
  qr_card_title_size: '22',
  qr_card_subtitle_size: '14',
  qr_card_bg_color: '#0f172a',
  qr_card_opacity: '90',
  qr_card_show_bg: 'true',
  qr_card_border_color: '#38bdf8',
  qr_card_show_border: 'true',
  qr_card_rainbow_border: 'false',
  qr_card_title_color: '#ffffff',
  qr_card_subtitle_color: '#cbd5e1',
  qr_card_badge_bg_color: '#2563eb',
  qr_card_badge_text_color: '#ffffff',
  qr_card_qr_fg_color: '#0f172a',
  qr_card_qr_bg_color: '#ffffff',
};

export type QrCardAppearance = typeof qrCardDefaults;

export const qrCardRanges: Partial<Record<keyof QrCardAppearance, [number, number]>> = {
  qr_card_width: [160, 1200],
  qr_card_padding: [0, 80],
  qr_card_gap: [0, 80],
  qr_card_text_gap: [0, 48],
  qr_card_media_size: [60, 520],
  qr_card_media_radius: [0, 260],
  qr_card_media_padding: [0, 40],
  qr_card_radius: [0, 80],
  qr_card_title_size: [12, 64],
  qr_card_subtitle_size: [10, 48],
  qr_card_opacity: [0, 100],
};

export function validQrCardAppearance(key: keyof QrCardAppearance, value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (key === 'qr_card_mode') return ['qr', 'image'].includes(value);
  if (key === 'qr_card_layout') return ['vertical', 'horizontal'].includes(value);
  if (key === 'qr_card_text_align') return ['left', 'center', 'right'].includes(value);
  if (key === 'qr_card_font') return goalFontOptions.some(font => font.value === value);
  if (key === 'qr_card_badge_text') return value.length <= 60;
  if (key === 'qr_card_title') return value.length <= 160;
  if (key === 'qr_card_subtitle') return value.length <= 240;
  if (key === 'qr_card_qr_url') {
    if (value.trim() === '') return true;
    return Boolean(sanitizePublicUrl(value, false));
  }
  if (key === 'qr_card_image_url') {
    if (value.trim() === '') return true;
    return Boolean(sanitizePublicUrl(value, true));
  }
  if (key.endsWith('_color')) return /^#[0-9a-f]{6}$/i.test(value);
  const range = qrCardRanges[key];
  if (range) {
    return (
      value.trim() !== '' &&
      Number.isFinite(Number(value)) &&
      Number(value) >= range[0] &&
      Number(value) <= range[1]
    );
  }
  return value === 'true' || value === 'false';
}

export function readQrCardAppearance(settings: Record<string, string>): QrCardAppearance {
  const appearance = { ...qrCardDefaults };
  (Object.keys(appearance) as (keyof QrCardAppearance)[]).forEach(key => {
    if (validQrCardAppearance(key, settings[key])) {
      appearance[key] = settings[key];
    }
  });
  return appearance;
}
