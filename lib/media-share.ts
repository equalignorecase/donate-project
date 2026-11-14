export interface ParsedYouTubeUrl {
  videoId: string;
  startSeconds: number;
  canonicalUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
}

export interface MediaShareConfig {
  enabled: boolean;
  minAmount: number;
  maxDuration: number;
  volume: number;
}

export const DEFAULT_MEDIA_SHARE_MIN_AMOUNT = 20;
export const DEFAULT_MEDIA_SHARE_MAX_DURATION = 60;
export const DEFAULT_MEDIA_SHARE_VOLUME = 70;

const ALLOWED_YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

/**
 * Parse YouTube `t` or `start` parameter (supports `"90"`, `"90s"`, `"1m30s"`, `"1h2m3s"`).
 */
export function parseYouTubeTimeParam(raw: string | null | undefined): number {
  if (!raw) return 0;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return 0;

  if (/^\d+$/.test(trimmed)) {
    return clampInt(Number(trimmed), 0, 43200);
  }
  if (/^\d+s$/.test(trimmed)) {
    return clampInt(Number(trimmed.slice(0, -1)), 0, 43200);
  }

  const hms = trimmed.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!hms || (!hms[1] && !hms[2] && !hms[3])) return 0;

  const hours = Number(hms[1] || 0);
  const mins = Number(hms[2] || 0);
  const secs = Number(hms[3] || 0);
  return clampInt(hours * 3600 + mins * 60 + secs, 0, 43200);
}

/**
 * Validate and normalize a YouTube URL (watch, youtu.be, shorts, live, embed).
 * Rejects non-HTTP(S) schemes and any non-YouTube hostnames.
 */
export function parseYouTubeUrl(input: string | null | undefined): ParsedYouTubeUrl | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 500) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  let videoId = '';
  const pathSegments = parsed.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    videoId = pathSegments[0] || '';
  } else if (parsed.pathname === '/watch') {
    videoId = parsed.searchParams.get('v') || '';
  } else if (
    pathSegments.length >= 2 &&
    (pathSegments[0] === 'shorts' || pathSegments[0] === 'live' || pathSegments[0] === 'embed' || pathSegments[0] === 'v')
  ) {
    videoId = pathSegments[1] || '';
  } else if (parsed.searchParams.get('v')) {
    videoId = parsed.searchParams.get('v') || '';
  }

  if (!VIDEO_ID_REGEX.test(videoId)) {
    return null;
  }

  const startSeconds = parseYouTubeTimeParam(
    parsed.searchParams.get('t') || parsed.searchParams.get('start')
  );

  const canonicalUrl = startSeconds > 0
    ? `https://www.youtube.com/watch?v=${videoId}&t=${startSeconds}s`
    : `https://www.youtube.com/watch?v=${videoId}`;

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1${startSeconds > 0 ? `&start=${startSeconds}` : ''}`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return {
    videoId,
    startSeconds,
    canonicalUrl,
    embedUrl,
    thumbnailUrl,
  };
}

export interface YouTubeEmbedPlayerUrlOptions {
  videoId: string;
  startSeconds?: number;
  origin?: string;
  muted?: boolean;
}

/**
 * Build an iframe embed URL ready for YouTube IFrame API (`enablejsapi=1`) and browser autoplay.
 */
export function buildYouTubeEmbedPlayerUrl({
  videoId,
  startSeconds = 0,
  origin,
  muted = false,
}: YouTubeEmbedPlayerUrlOptions): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: muted ? '1' : '0',
    enablejsapi: '1',
    controls: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
  });

  if (Number.isFinite(startSeconds) && startSeconds > 0) {
    params.set('start', String(Math.floor(startSeconds)));
  }
  if (origin && /^https?:\/\//i.test(origin)) {
    params.set('origin', origin);
  }

  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

export interface RawMediaShareSettings {
  media_share_enabled?: string | boolean;
  media_share_min_amount?: number | string;
  media_share_max_duration?: number | string;
  media_share_volume?: number | string;
}

export function getMediaShareConfig(
  settings?: RawMediaShareSettings | Record<string, string | number | boolean | undefined> | null
): MediaShareConfig {
  const enabled = settings?.media_share_enabled === 'true' || settings?.media_share_enabled === true;
  const rawMin = Number(settings?.media_share_min_amount);
  const rawMaxDur = Number(settings?.media_share_max_duration);
  const rawVol = Number(settings?.media_share_volume);

  return {
    enabled,
    minAmount: Number.isFinite(rawMin) && rawMin >= 1 ? Math.min(1000000, Math.round(rawMin * 100) / 100) : DEFAULT_MEDIA_SHARE_MIN_AMOUNT,
    maxDuration: Number.isFinite(rawMaxDur) && rawMaxDur >= 5 ? clampInt(Math.round(rawMaxDur), 5, 600) : DEFAULT_MEDIA_SHARE_MAX_DURATION,
    volume: Number.isFinite(rawVol) ? clampInt(Math.round(rawVol), 0, 100) : DEFAULT_MEDIA_SHARE_VOLUME,
  };
}

export function isMissingMediaUrlColumnError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = String(error.message || '').toLowerCase();
  return error.code === '42703' || error.code === 'PGRST204' || (msg.includes('media_url') && (msg.includes('column') || msg.includes('schema cache')));
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
