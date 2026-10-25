export type DonationTheme = 'light' | 'dark';
type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function readDonationTheme(storage?: ThemeStorage): DonationTheme | null {
  try {
    const saved = (storage ?? window.localStorage).getItem('streamlove-theme');
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    // Storage may be blocked; the page can still follow the system theme.
  }
  return null;
}

export function saveDonationTheme(theme: DonationTheme, storage?: ThemeStorage): void {
  try {
    (storage ?? window.localStorage).setItem('streamlove-theme', theme);
  } catch {
    // Keep the in-memory selection when browser storage is unavailable.
  }
}
