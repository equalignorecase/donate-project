export const goalFontOptions = [
  { value: 'LINESeedSansTH', label: 'LINE Seed Sans TH (Regular ปกติ)' },
  { value: 'LINESeedSansTH-ExtraBold', label: 'LINE Seed Sans TH (ExtraBold หนาพิเศษ)' },
];

export const goalPatternOptions = [
  { value: 'none', label: 'เรียบเนียน (Clean Smooth)' },
  { value: 'micro-dots', label: 'ไมโครดอท (Micro Dot Matrix)' },
  { value: 'hairline', label: 'เส้นแฮร์ไลน์ (Hairline Slits)' },
  { value: 'segmented', label: 'สเกลมาตรวัด (Segmented Scale)' },
  { value: 'frosted', label: 'กระจกฝ้าซาติน (Frosted Satin)' },
  { value: 'carbon', label: 'คาร์บอนไฟเบอร์ (Carbon Fiber)' },
  { value: 'hexagon', label: 'ไซเบอร์รังผึ้ง (Cyber Hexagon)' },
  { value: 'circuit', label: 'แผงวงจรนีออน (Neon Circuit)' },
  { value: 'hologram', label: 'คลื่นโฮโลแกรม (Hologram Wave)' },
  { value: 'stripes', label: 'สปอร์ต 3D (Sport Stripes V2)' },
  { value: 'hazard', label: 'บั้งเตือนภัย (Cyber Hazard)' },
] as const;

export type GoalBarPattern = typeof goalPatternOptions[number]['value'];

export const goalAppearanceDefaults = {
  goal_show_border: 'false',
  goal_bar_style: 'minimal',
  goal_bar_pattern: 'none',
  goal_bar_pattern_opacity: '80',
  goal_bar_animated: 'false',
  goal_bar_shine: 'false',
  goal_font: 'LINESeedSansTH-ExtraBold',
  goal_bg_color: '#000000',
  goal_text_color: '#ffffff',
  goal_accent_color: '#67e8f9',
  goal_bar_color: '#0038ff',
  goal_bar_end_color: '#0038ff',
  goal_track_color: '#000000',
  goal_track_opacity: '45',
  goal_track_blur: '12',
  goal_border_color: '#64748b',
  goal_opacity: '0',
  goal_width: '620',
  goal_padding: '0',
  goal_radius: '20',
  goal_bar_radius: '50',
  goal_title_size: '26',
  goal_amount_size: '20',
  goal_bar_height: '48',
  goal_show_percent: 'false',
  goal_show_amount: 'false',
  goal_text_inside: 'true',
  goal_gradient: 'false',
  goal_show_duration: 'true',
  goal_end_date: '',
  goal_duration_text: 'สิ้นสุดใน',
  goal_duration_style: 'glass',
  goal_duration_position: 'top',
  goal_duration_color: '#e0f2fe',
  goal_duration_bg_color: '#0f172a',
  goal_duration_bg_opacity: '70',
  goal_duration_border_color: '#3b82f6',
  goal_duration_size: '13',
  goal_duration_radius: '9999',
  goal_duration_show_icon: 'true',
};

export type GoalAppearance = typeof goalAppearanceDefaults;

export function formatGoalDuration(endDateStr?: string, prefix = 'สิ้นสุดใน'): string {
  if (!endDateStr) return `${prefix || 'สิ้นสุดใน'} 30 วัน`;
  const end = new Date(endDateStr.includes('T') ? endDateStr : `${endDateStr}T23:59:59`).getTime();
  if (isNaN(end)) return `${prefix || 'สิ้นสุดใน'} 30 วัน`;
  const now = Date.now();
  const diffMs = end - now;
  if (diffMs <= 0) return 'สิ้นสุดระยะเวลาแล้ว';
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays >= 1) return `${prefix || 'สิ้นสุดใน'} ${diffDays} วัน`;
  const diffHours = Math.max(1, Math.round(diffMs / 3600000));
  return `${prefix || 'สิ้นสุดใน'} ${diffHours} ชั่วโมง`;
}

export const goalAppearanceRanges: Partial<Record<keyof GoalAppearance, [number, number]>> = {
  goal_opacity: [0, 100],
  goal_track_opacity: [0, 100],
  goal_track_blur: [0, 40],
  goal_width: [240, 1600],
  goal_padding: [0, 80],
  goal_radius: [0, 80],
  goal_bar_radius: [0, 50],
  goal_bar_pattern_opacity: [0, 100],
  goal_title_size: [12, 64],
  goal_amount_size: [12, 64],
  goal_bar_height: [8, 80],
  goal_duration_size: [10, 32],
  goal_duration_bg_opacity: [0, 100],
};

export function validGoalAppearance(key: keyof GoalAppearance, value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (key === 'goal_bar_style') return ['glass', 'neon', 'striped', 'minimal'].includes(value);
  if (key === 'goal_bar_pattern') return goalPatternOptions.some(p => p.value === value);
  if (key === 'goal_font') return goalFontOptions.some(font => font.value === value);
  if (key.endsWith('_color')) return /^#[0-9a-f]{6}$/i.test(value);
  if (key === 'goal_duration_style') return ['glass', 'solid', 'outline', 'clean', 'glow'].includes(value);
  if (key === 'goal_duration_position') return ['top', 'bottom', 'inline'].includes(value);
  if (key === 'goal_duration_radius') return ['9999', '8', '4'].includes(value);
  if (key === 'goal_end_date') return value === '' || !isNaN(Date.parse(value));
  if (key === 'goal_duration_text') return value.length <= 60;
  const range = goalAppearanceRanges[key];
  if (range) return value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= range[0] && Number(value) <= range[1];
  return value === 'true' || value === 'false';
}

export function readGoalAppearance(settings: Record<string, string>): GoalAppearance {
  const appearance = { ...goalAppearanceDefaults };
  (Object.keys(appearance) as (keyof GoalAppearance)[]).forEach(key => {
    if (validGoalAppearance(key, settings[key])) appearance[key] = settings[key];
  });
  if (settings.goal_bar_style === 'striped' && !settings.goal_bar_pattern) {
    appearance.goal_bar_pattern = 'stripes';
  }
  return appearance;
}
