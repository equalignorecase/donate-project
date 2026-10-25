/**
 * Profanity and vulgar words filtering for names and donation messages
 */

// Core vulgar and abusive terms in Thai and English
export const DEFAULT_PROFANITY_WORDS: readonly string[] = [
  // Curses & swear words (ควย, สัส, เหี้ย, ห่า, สัตว์, เวร)
  'ควย',
  'ควยเอ้ย',
  'ไอ้ควย',
  'อีควย',
  'หัวควย',
  'หน้าควย',
  'ไข่ควย',
  'ควยแม่ง',
  'ควยเถอะ',
  'ควยไร',
  'ควยยย',
  'ดูดควย',
  'อมควย',
  'เหี้ย',
  'ไอ้เหี้ย',
  'อีเหี้ย',
  'หน้าเหี้ย',
  'เหี้ยไร',
  'เฮี้ย',
  'เหิ้ย',
  'เหรี้ย',
  'เชี่ย',
  'สัส',
  'สัด',
  'ไอ้สัส',
  'อีสัส',
  'สัสไร',
  'สัสดี',
  'สาส',
  'สาด',
  'สัx',
  'สัxว์',
  'ไอ้สัตว์',
  'อีสัตว์',
  'สัตว์นรก',
  'ไอ้สัตว์นรก',
  'สัตว์เดรัจฉาน',
  'สัตว์เอ้ย',
  'ห่า',
  'ไอ้ห่า',
  'ห่าเอ้ย',
  'ไปตายห่า',
  'ตายห่า',
  'ไอ้เวร',
  'อีเวร',
  'ไอ้บ้า',
  'อีบ้า',
  'ไอ้หมา',
  'อีหมา',
  'ชาติหมา',
  'สมองหมา',
  'สมองหมู',
  'ไอ้เปรต',
  'อีเปรต',

  // Pronouns & aggressive slang
  'มึง',
  'กู',
  'กรู',
  'เมิง',
  'มรึง',
  'แม่ง',
  'แม่ม',
  'แม่งเอ้ย',
  'พ่อง',
  'พ่อมึง',
  'แม่มึง',
  'พ่อมึงตาย',
  'แม่มึงตาย',
  'ไปตายซะ',

  // Insults & deprecations
  'กาก',
  'กระจอก',
  'ควาย',
  'ไอ้ควาย',
  'โง่',
  'โง่ชิบหาย',
  'โง่สัส',
  'ไอ้โง่',
  'อีโง่',
  'ปัญญาอ่อน',
  'ตอแหล',
  'โกหกตอแหล',
  'หน้าด้าน',
  'สันดาน',
  'สันดานเสีย',
  'ชาติชั่ว',
  'ระยำ',
  'สถุล',
  'จัญไร',
  'จังไร',
  'ชิบหาย',
  'ฉิบหาย',
  'ชิบเป๋ง',
  'เลว',
  'ไอ้เลว',
  'อีเลว',
  'นรก',
  'ส้นตีน',
  'หน้าส้นตีน',
  'ตีนเหอะ',
  'คอวอโย',

  // Sexual, anatomy & vulgarities
  'หี',
  'หน้าหี',
  'ไอ้หน้าหี',
  'เลียหี',
  'แตด',
  'เย็ด',
  'เย็ดแม่',
  'เย็ดเข้',
  'เย็ดเป็ด',
  'เย็ดกัน',
  'เยด',
  'ยัดแม่',
  'ช้างเย็ด',
  'เยสแม่',
  'เยสเข้',
  'เยสเป็ด',
  'เยสกัน',
  'ดอกทอง',
  'อีดอก',
  'อีดอกทอง',
  'กะหรี่',
  'กระหรี่',
  'กรี่',
  'ร่าน',
  'แรด',
  'เงี่ยน',
  'หื่น',
  'ชักว่าว',
  'จู๋',
  'จิ๋ม',
  'จิ๊มิ',
  'หำ',
  'น้ำเงี่ยน',
  'น้ำแตก',
  'แตกใน',
  'เอากัน',
  'เอาไหม',
  'ฟัค',
  'ฟักยู',

  // Common English profanities
  'fuck',
  'f*ck',
  'fck',
  'fuk',
  'fucking',
  'fucker',
  'shit',
  'bitch',
  'cunt',
  'dick',
  'pussy',
  'asshole',
  'bastard',
  'motherfucker',
  'slut',
  'whore',
  'retard',
  'nigger',
  'nigga',
];

// Patterns for evasive spellings (e.g. spaced out, leetspeak, dots/dashes, acronyms)
const EVASIVE_PATTERNS: readonly RegExp[] = [
  /ค[\s._\-\*]*ว[\s._\-\*]*ย/gi,
  /ค[\s._\-\*]+ย/gi,
  /ส[\s._\-\*]*ั[\s._\-\*]*[สดส์x]/gi,
  /[เเ][\s._\-\*]*[หช][\s._\-\*]*ี้?[\s._\-\*]*ย/gi,
  /ย[\s._\-\*]*็?[\s._\-\*]*[ดต]/gi,
  /ห[\s._\-\*]*ี/gi,
  /แ[\s._\-\*]*ต[\s._\-\*]*ด/gi,
  /ด[\s._\-\*]*อ[\s._\-\*]*ก[\s._\-\*]*ท[\s._\-\*]*อ[\s._\-\*]*ง/gi,
  /ก[\s._\-\*]*ะ?[\s._\-\*]*ห[\s._\-\*]*รี่/gi,
  /(?:^|[\s.,!?])(อห|อส)(?:$|[\s.,!?])/gi,
  /(?<!(สวน|รัก|หมอ))สัตว์(?!เลี้ยง|แพทย์|จรจัด|ป่า|น้ำ|บก|ประหลาด|สงเคราะห์|โลก|ประเสริฐ)/gi,
  /\bf[\s._\-\*@]*u[\s._\-\*]*c[\s._\-\*]*k\b/gi,
  /\bs[\s._\-\*$]*h[\s._\-\*]*i[\s._\-\*!]*t\b/gi,
  /\bb[\s._\-\*]*i[\s._\-\*!]*t[\s._\-\*]*c[\s._\-\*]*h\b/gi,
  /\ba[\s._\-\*@]*s[\s._\-\*$]*s[\s._\-\*$]*h[\s._\-\*0]*o[\s._\-\*]*l[\s._\-\*]*e\b/gi,
  /\bd[\s._\-\*]*i[\s._\-\*!]*c[\s._\-\*]*k\b/gi,
  /\bp[\s._\-\*]*u[\s._\-\*]*s[\s._\-\*$]*s[\s._\-\*]*y\b/gi,
  /\bc[\s._\-\*]*u[\s._\-\*]*n[\s._\-\*]*t\b/gi,
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalizes text to catch spaced-out or zero-width evasions while preserving consistent Unicode NFC/NFKC form
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .normalize('NFKC');
}

/**
 * Checks if a string contains profanity or vulgar terms
 * @param text The input text to check
 * @param customWords Optional list of custom forbidden words from database
 */
export function containsProfanity(text: string, customWords?: readonly string[]): boolean {
  if (!text || typeof text !== 'string') return false;

  const normalized = normalizeText(text.trim());
  if (!normalized) return false;

  // 1. Check evasive regex patterns
  for (let p = 0; p < EVASIVE_PATTERNS.length; p++) {
    const pattern = EVASIVE_PATTERNS[p];
    pattern.lastIndex = 0;
    if (pattern.test(normalized)) return true;
  }

  // 2. Combine default words and custom blacklist (all normalized)
  const allWords = new Set<string>();
  for (let d = 0; d < DEFAULT_PROFANITY_WORDS.length; d++) {
    const w = DEFAULT_PROFANITY_WORDS[d];
    if (w && w.trim()) {
      allWords.add(normalizeText(w.trim().toLowerCase()));
    }
  }
  if (customWords && Array.isArray(customWords)) {
    for (let c = 0; c < customWords.length; c++) {
      const w = customWords[c];
      if (w && typeof w === 'string' && w.trim()) {
        allWords.add(normalizeText(w.trim().toLowerCase()));
      }
    }
  }

  const lower = normalized.toLowerCase();
  const wordsList = Array.from(allWords);

  for (let i = 0; i < wordsList.length; i++) {
    const word = wordsList[i];
    if (!word) continue;
    // For purely ascii words, enforce word boundary so "classic" doesn't trigger "ass"
    if (/^[a-z0-9]+$/i.test(word)) {
      const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
      if (regex.test(lower)) return true;
    } else {
      // For Thai words, check substring
      if (lower.includes(word)) return true;
    }
  }

  return false;
}

/**
 * Masks vulgar words with asterisks (***)
 * @param text The input text
 * @param customWords Optional custom blacklist
 */
export function maskProfanity(text: string, customWords?: readonly string[]): string {
  if (!text || typeof text !== 'string') return '';

  let masked = normalizeText(text);

  // 1. Mask evasive patterns
  for (let p = 0; p < EVASIVE_PATTERNS.length; p++) {
    const pattern = EVASIVE_PATTERNS[p];
    pattern.lastIndex = 0;
    masked = masked.replace(pattern, (match) => '*'.repeat(Math.max(3, match.length)));
  }

  // 2. Mask word list
  const allWords = new Set<string>();
  for (let d = 0; d < DEFAULT_PROFANITY_WORDS.length; d++) {
    const w = DEFAULT_PROFANITY_WORDS[d];
    if (w && w.trim()) {
      allWords.add(normalizeText(w.trim()));
    }
  }
  if (customWords && Array.isArray(customWords)) {
    for (let c = 0; c < customWords.length; c++) {
      const w = customWords[c];
      if (w && typeof w === 'string' && w.trim()) {
        allWords.add(normalizeText(w.trim()));
      }
    }
  }

  const maskList = Array.from(allWords);
  for (let m = 0; m < maskList.length; m++) {
    const word = maskList[m];
    if (!word) continue;
    if (/^[a-z0-9]+$/i.test(word)) {
      const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
      masked = masked.replace(regex, (match) => '*'.repeat(Math.max(3, match.length)));
    } else {
      const regex = new RegExp(escapeRegex(word), 'gi');
      masked = masked.replace(regex, (match) => '*'.repeat(Math.max(3, match.length)));
    }
  }

  return masked;
}
