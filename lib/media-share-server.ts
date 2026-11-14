import { supabaseAdmin } from './supabaseAdmin';
import { getMediaShareConfig, MediaShareConfig } from './media-share';

export async function loadMediaShareConfig(): Promise<MediaShareConfig> {
  try {
    const { data: rows } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .like('key', 'media_share_%');

    const map: Record<string, string> = {};
    if (rows) {
      for (const row of rows as Array<{ key: string; value: string }>) {
        map[row.key] = row.value;
      }
    }
    return getMediaShareConfig(map);
  } catch {
    return getMediaShareConfig(null);
  }
}
