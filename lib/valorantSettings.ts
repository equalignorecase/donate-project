import { ValorantSettings } from './types/valorant';

export const valorantDefaults: ValorantSettings = {
  valorant_name: '',
  valorant_tag: '',
  valorant_region: 'ap',
  valorant_api_key: '',
  valorant_session_reset_at: '',
  valorant_show_badge: 'true',
  valorant_show_rank: 'true',
  valorant_show_rr: 'true',
  valorant_show_wl: 'true',
  valorant_show_last_match: 'true',
  valorant_last_match_label: 'เกมล่าสุด',
  valorant_theme: 'classic',
  valorant_show_bg: 'true',
  valorant_shine: 'true',
  valorant_bg_color: '#111827',
  valorant_bg_opacity: '90',
  valorant_text_color: '#ffffff',
  valorant_accent_color: '#00e599',
  valorant_border_color: '#374151',
  valorant_show_border: 'true',
  valorant_radius: '16',
  valorant_scale: '100',
  valorant_font: 'LINESeedSansTH-ExtraBold',
};

export const valorantThemes: Record<string, Partial<ValorantSettings>> = {
  classic: {
    valorant_theme: 'classic',
    valorant_bg_color: '#1e293b',
    valorant_bg_opacity: '95',
    valorant_text_color: '#ffffff',
    valorant_accent_color: '#22c55e',
    valorant_border_color: '#334155',
    valorant_show_border: 'true',
    valorant_radius: '16',
  },
  neon: {
    valorant_theme: 'neon',
    valorant_bg_color: '#050510',
    valorant_bg_opacity: '95',
    valorant_text_color: '#f8fafc',
    valorant_accent_color: '#00f2fe',
    valorant_border_color: '#ff0055',
    valorant_show_border: 'true',
    valorant_radius: '12',
  },
  glass: {
    valorant_theme: 'glass',
    valorant_bg_color: '#0f172a',
    valorant_bg_opacity: '60',
    valorant_text_color: '#ffffff',
    valorant_accent_color: '#38bdf8',
    valorant_border_color: 'rgba(255,255,255,0.2)',
    valorant_show_border: 'true',
    valorant_radius: '20',
  },
  minimal: {
    valorant_theme: 'minimal',
    valorant_bg_color: '#000000',
    valorant_bg_opacity: '85',
    valorant_text_color: '#ffffff',
    valorant_accent_color: '#4ade80',
    valorant_border_color: '#1f2937',
    valorant_show_border: 'false',
    valorant_radius: '8',
  },
};

export const regionOptions = [
  { value: 'ap', label: 'Asia Pacific (AP) - ไทย, ญี่ปุ่น, เกาหลี, SEA' },
  { value: 'na', label: 'North America (NA)' },
  { value: 'eu', label: 'Europe (EU)' },
  { value: 'kr', label: 'Korea (KR)' },
  { value: 'latam', label: 'Latin America (LATAM)' },
  { value: 'br', label: 'Brazil (BR)' },
];

export function readValorantSettings(source: Record<string, any> = {}): ValorantSettings {
  const result = { ...valorantDefaults };
  for (const key of Object.keys(valorantDefaults) as (keyof ValorantSettings)[]) {
    if (source[key] !== undefined && source[key] !== null && String(source[key]).trim() !== '') {
      result[key] = String(source[key]) as any;
    }
  }
  return result;
}

