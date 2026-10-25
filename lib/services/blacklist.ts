import { supabaseAdmin } from '../supabaseAdmin';
import { maskProfanity, containsProfanity } from '../profanity';

/**
 * Filter and mask vulgar / prohibited words from text (names or messages)
 * Uses both built-in standard dictionary and database blacklist
 * @param message Input message or name
 * @returns Filtered text with vulgarities replaced by asterisks
 */
export async function filterMessage(message: string): Promise<string> {
  if (!message || typeof message !== 'string') return '';

  let customWords: string[] = [];
  try {
    const { data: words } = await supabaseAdmin
      .from('blacklist')
      .select('word');

    if (words && words.length > 0) {
      customWords = words.map((w: { word: string }) => w.word).filter(Boolean);
    }
  } catch (err: any) {
    console.warn('Error fetching blacklist words:', err.message);
  }

  return maskProfanity(message, customWords);
}

/**
 * Checks whether text contains any profanity (built-in or custom)
 */
export async function checkContainsProfanity(text: string): Promise<boolean> {
  if (!text || typeof text !== 'string') return false;

  let customWords: string[] = [];
  try {
    const { data: words } = await supabaseAdmin
      .from('blacklist')
      .select('word');

    if (words && words.length > 0) {
      customWords = words.map((w: { word: string }) => w.word).filter(Boolean);
    }
  } catch (err: any) {
    console.warn('Error fetching blacklist words:', err.message);
  }

  return containsProfanity(text, customWords);
}
