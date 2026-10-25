import type { GoalAppearance } from './goalAppearance';

export type GoalPresetId = 'slim' | 'capsule' | 'segmented' | 'hud' | 'milestone' | 'floating';
export interface GoalPreset {
  id: GoalPresetId;
  label: string;
  description: string;
  settings: Partial<GoalAppearance>;
}
const common: Partial<GoalAppearance> = {
  goal_opacity: '0', goal_padding: '0', goal_show_border: 'false',
  goal_bar_pattern: 'none', goal_bar_animated: 'false',
  goal_show_amount: 'true', goal_show_percent: 'true', goal_title_size: '20',
};
export const goalPresets: GoalPreset[] = [
  { id: 'slim', label: 'Slim', description: 'หลอดบาง ยอดและเปอร์เซ็นต์อยู่ด้านล่าง', settings: {
    ...common, goal_bar_style: 'slim', goal_bar_height: '12', goal_bar_radius: '6',
    goal_text_inside: 'false', goal_amount_size: '18', goal_bar_shine: 'false',
  } },
  { id: 'capsule', label: 'Capsule', description: 'หลอดมน แสดงยอดด้านใน พร้อมแสง Shine', settings: {
    ...common, goal_bar_style: 'glass', goal_bar_height: '36', goal_bar_radius: '50',
    goal_text_inside: 'true', goal_amount_size: '16', goal_bar_shine: 'true',
  } },
  { id: 'segmented', label: 'Segmented', description: 'หลอดแบ่งช่อง คล้ายมาตรวัดพลัง', settings: {
    ...common, goal_bar_style: 'segmented', goal_bar_height: '20', goal_bar_radius: '4', goal_track_blur: '0',
    goal_text_inside: 'false', goal_amount_size: '18', goal_bar_shine: 'false',
  } },
  { id: 'hud', label: 'HUD', description: 'กรอบตัดมุมสองชั้น พร้อมแสงขอบเบา ๆ', settings: {
    ...common, goal_bar_style: 'hud', goal_bar_height: '28', goal_bar_radius: '0',
    goal_text_inside: 'false', goal_amount_size: '18', goal_bar_shine: 'true',
  } },
  { id: 'milestone', label: 'Milestone', description: 'แสดงจุดหมาย 25 / 50 / 75 / 100%', settings: {
    ...common, goal_bar_style: 'milestone', goal_bar_height: '12', goal_bar_radius: '6',
    goal_text_inside: 'false', goal_amount_size: '18', goal_bar_shine: 'false',
  } },
  { id: 'floating', label: 'Floating Label', description: 'ป้ายยอดเงินเลื่อนตามปลายหลอด', settings: {
    ...common, goal_bar_style: 'floating', goal_bar_height: '10', goal_bar_radius: '5',
    goal_text_inside: 'false', goal_amount_size: '18', goal_bar_shine: 'false',
  } },
];

export function applyGoalPreset(value: GoalAppearance, id: GoalPresetId): GoalAppearance {
  const preset = goalPresets.find((item) => item.id === id);
  if (!preset) throw new Error('Unknown goal preset');
  return { ...value, ...preset.settings };
}
