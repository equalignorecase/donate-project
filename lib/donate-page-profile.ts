export type SocialPlatform = 'discord' | 'tiktok' | 'youtube' | 'twitch' | 'instagram' | 'x';

export interface SocialLinkItem {
  key: string;
  platform: SocialPlatform;
  label: string;
  url: string;
}

export interface DonatePageProfile {
  name: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  heroUrl: string;
  social: {
    discord: string;
    tiktok: string;
    youtube: string;
    twitch: string;
    instagramOrX: string;
  };
  socialLinks: SocialLinkItem[];
}

export const DONATE_PAGE_DEFAULTS = {
  name: 'localhostvlr',
  handle: '@localhostvlr',
  bio: 'ชื่อนัฐนะครับ ชอบเล่น VALORANT\nขอบพระคุณที่สนับสนุนครับ',
  avatarUrl: '/avatar.png',
  heroUrl: 'https://wallpapercat.com/w/full/b/2/c/5827240.jpg',
} as const;

export const DONATE_PAGE_SETTING_KEYS = {
  name: 'donate_page_name',
  handle: 'donate_page_handle',
  bio: 'donate_page_bio',
  avatarUrl: 'donate_page_avatar_url',
  heroUrl: 'donate_page_hero_url',
  socialDiscord: 'donate_page_social_discord',
  socialTiktok: 'donate_page_social_tiktok',
  socialYoutube: 'donate_page_social_youtube',
  socialTwitch: 'donate_page_social_twitch',
  socialInstagramOrX: 'donate_page_social_x_ig',
} as const;

/**
 * Validate and normalize URLs entered in the Donate Page CMS.
 * Allows http(s) URLs, and optionally app-relative paths starting with `/`.
 */
export function sanitizePublicUrl(raw: unknown, allowRelative = false): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 1000) return '';

  if (allowRelative && trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }

  return '';
}

function detectSocialFivePlatform(url: string): { platform: SocialPlatform; label: string } {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')) {
      return { platform: 'x', label: 'X (Twitter)' };
    }
  } catch {}
  return { platform: 'instagram', label: 'Instagram' };
}

export function getDonatePageProfile(
  settings?: Record<string, string | number | boolean | undefined> | null
): DonatePageProfile {
  const s = settings || {};
  const hasKey = (k: string) => Object.prototype.hasOwnProperty.call(s, k) && s[k] !== undefined;

  const rawName = hasKey(DONATE_PAGE_SETTING_KEYS.name) ? String(s[DONATE_PAGE_SETTING_KEYS.name] ?? '').trim() : '';
  const name = (rawName || DONATE_PAGE_DEFAULTS.name).slice(0, 60);

  const handle = hasKey(DONATE_PAGE_SETTING_KEYS.handle)
    ? String(s[DONATE_PAGE_SETTING_KEYS.handle] ?? '').trim().slice(0, 60)
    : DONATE_PAGE_DEFAULTS.handle;

  const bio = hasKey(DONATE_PAGE_SETTING_KEYS.bio)
    ? String(s[DONATE_PAGE_SETTING_KEYS.bio] ?? '').trim().slice(0, 300)
    : DONATE_PAGE_DEFAULTS.bio;

  const rawAvatar = hasKey(DONATE_PAGE_SETTING_KEYS.avatarUrl)
    ? sanitizePublicUrl(s[DONATE_PAGE_SETTING_KEYS.avatarUrl], true)
    : DONATE_PAGE_DEFAULTS.avatarUrl;
  const avatarUrl = rawAvatar || DONATE_PAGE_DEFAULTS.avatarUrl;

  const heroUrl = hasKey(DONATE_PAGE_SETTING_KEYS.heroUrl)
    ? sanitizePublicUrl(s[DONATE_PAGE_SETTING_KEYS.heroUrl], true)
    : DONATE_PAGE_DEFAULTS.heroUrl;

  const discord = sanitizePublicUrl(s[DONATE_PAGE_SETTING_KEYS.socialDiscord], false);
  const tiktok = sanitizePublicUrl(s[DONATE_PAGE_SETTING_KEYS.socialTiktok], false);
  const youtube = sanitizePublicUrl(s[DONATE_PAGE_SETTING_KEYS.socialYoutube], false);
  const twitch = sanitizePublicUrl(s[DONATE_PAGE_SETTING_KEYS.socialTwitch], false);
  const instagramOrX = sanitizePublicUrl(s[DONATE_PAGE_SETTING_KEYS.socialInstagramOrX], false);

  const socialLinks: SocialLinkItem[] = [];
  if (discord) socialLinks.push({ key: 'discord', platform: 'discord', label: 'Discord', url: discord });
  if (tiktok) socialLinks.push({ key: 'tiktok', platform: 'tiktok', label: 'TikTok', url: tiktok });
  if (youtube) socialLinks.push({ key: 'youtube', platform: 'youtube', label: 'YouTube', url: youtube });
  if (twitch) socialLinks.push({ key: 'twitch', platform: 'twitch', label: 'Twitch', url: twitch });
  if (instagramOrX) {
    const fifth = detectSocialFivePlatform(instagramOrX);
    socialLinks.push({ key: 'x_ig', platform: fifth.platform, label: fifth.label, url: instagramOrX });
  }

  return {
    name,
    handle,
    bio,
    avatarUrl,
    heroUrl,
    social: { discord, tiktok, youtube, twitch, instagramOrX },
    socialLinks,
  };
}
