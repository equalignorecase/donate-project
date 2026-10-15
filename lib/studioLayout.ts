export interface WidgetPosition {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  visible: boolean;
  scale?: number; // scale multiplier e.g. 1
}

export interface StudioSceneLayout {
  alert: WidgetPosition;
  goal: WidgetPosition;
  supporters: WidgetPosition;
  timer: WidgetPosition;
}

export const defaultSceneLayout: StudioSceneLayout = {
  alert: { x: 50, y: 15, visible: true, scale: 1 },
  goal: { x: 50, y: 88, visible: true, scale: 1 },
  supporters: { x: 82, y: 40, visible: true, scale: 1 },
  timer: { x: 18, y: 14, visible: true, scale: 1 },
};

export const STORAGE_KEY = 'stream_studio_layout';

export function getStoredLayout(): StudioSceneLayout {
  if (typeof window === 'undefined') return defaultSceneLayout;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSceneLayout;
    const parsed = JSON.parse(raw);
    return {
      alert: { ...defaultSceneLayout.alert, ...(parsed.alert || {}) },
      goal: { ...defaultSceneLayout.goal, ...(parsed.goal || {}) },
      supporters: { ...defaultSceneLayout.supporters, ...(parsed.supporters || {}) },
      timer: { ...defaultSceneLayout.timer, ...(parsed.timer || {}) },
    };
  } catch {
    return defaultSceneLayout;
  }
}

export function saveStoredLayout(layout: StudioSceneLayout) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch (e) {
    console.warn('Failed to save studio layout to localStorage:', e);
  }
}

export const SNAP_PRESETS: { label: string; x: number; y: number }[] = [
  { label: 'บนซ้าย (Top Left)', x: 16, y: 14 },
  { label: 'บนกลาง (Top Center)', x: 50, y: 14 },
  { label: 'บนขวา (Top Right)', x: 84, y: 14 },
  { label: 'กลางจอ (Center)', x: 50, y: 50 },
  { label: 'ล่างซ้าย (Bottom Left)', x: 16, y: 86 },
  { label: 'ล่างกลาง (Bottom Center)', x: 50, y: 88 },
  { label: 'ล่างขวา (Bottom Right)', x: 84, y: 86 },
];
