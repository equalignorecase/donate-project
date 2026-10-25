/**
 * Helper to prepare text for TTS synthesis in Thai context
 * Fixes unpronounceable consonant clusters, abbreviations, and sound onomatopoeias
 */
export function prepareTtsText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    // 1. Repeating identical letters 3+ times (e.g. Zzzz, xxx, kkkk) -> space out so TTS spells them
    .replace(/\b([a-zA-Z])\1{2,}\b/gi, (match) => match.split('').join(' '))
    // 2. English words with 3+ consonants without any vowels (e.g. zzz, wtf) -> space out
    .replace(/\b([b-df-hj-np-tv-z]{3,})\b/gi, (match) => match.split('').join(' '));
}
