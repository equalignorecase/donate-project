import { supabaseAdmin } from './supabaseAdmin';
import { DonatePageProfile, getDonatePageProfile } from './donate-page-profile';

export async function loadDonatePageProfile(): Promise<DonatePageProfile> {
  try {
    const { data: rows } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .like('key', 'donate_page_%');

    const map: Record<string, string> = {};
    if (rows) {
      for (const row of rows as Array<{ key: string; value: string }>) {
        map[row.key] = row.value;
      }
    }
    return getDonatePageProfile(map);
  } catch {
    return getDonatePageProfile(null);
  }
}
