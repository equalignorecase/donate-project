// Keep multipart requests below Vercel Functions' 4.5 MB body limit.
export const MAX_SLIP_FILE_SIZE_BYTES = 4 * 1024 * 1024;

export interface SoundPreset {
  id: string;
  label: string;
}

export const ALERT_SOUND_PRESETS: SoundPreset[] = [
  { id: '/sounds/alert.mp3', label: '🔔 กระดิ่งคลาสสิก (Classic Bell)' },
  { id: '/sounds/coin.wav', label: '🪙 เหรียญทองเรโทร (Retro 8-Bit Coin)' },
  { id: '/sounds/chime.wav', label: '✨ ระฆังแก้วชิเมะ (Soft Glass Chime)' },
  { id: '/sounds/level-up.wav', label: '🎺 แฟนตาซีเลเวลอัป (Level Up Fanfare)' },
  { id: '/sounds/arcade.wav', label: '🕹️ อาร์เคดป๊อป (Arcade Pop)' },
  { id: 'custom', label: '📁 อัปโหลดไฟล์เสียงเอง / วางลิงก์ URL' }
];

