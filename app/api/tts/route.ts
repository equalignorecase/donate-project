import { NextResponse } from 'next/server';
import axios from 'axios';
import { prepareTtsText } from '@/lib/tts-helper';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { verifyAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// In-memory audio buffer cache (keyed by text)
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 150;

function getExpectedHost(request: Request): string {
  return (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    new URL(request.url).host
  ).toLowerCase();
}

function isAllowedTtsRequest(request: Request, searchParams: URLSearchParams): boolean {
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') return false;

  const expectedHost = getExpectedHost(request);
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host.toLowerCase() !== expectedHost) return false;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get('referer');
  let refererUrl: URL | null = null;
  if (referer) {
    try {
      refererUrl = new URL(referer);
      if (refererUrl.host.toLowerCase() !== expectedHost) return false;
    } catch {
      return false;
    }
  }

  const overlayToken = process.env.OVERLAY_TOKEN?.trim();
  const isAdmin = verifyAdminAuth(request);
  if (isAdmin) return true;

  if (overlayToken) {
    const queryToken = searchParams.get('token') || request.headers.get('x-overlay-token');
    if (queryToken === overlayToken) return true;
    if (refererUrl && (refererUrl.pathname.startsWith('/admin') || refererUrl.pathname.startsWith('/customizer'))) {
      return true;
    }
    return false;
  }

  // Require browser same-origin context when no OVERLAY_TOKEN is configured
  return Boolean(origin || referer || secFetchSite === 'same-origin');
}

/**
 * Split text into chunks safe for Google Translate TTS (~160 chars max per request)
 */
function splitTextIntoChunks(text: string, maxLen = 160): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Attempt to split at a space, newline, or punctuation before maxLen
    let splitIdx = -1;
    const searchSlice = remaining.slice(0, maxLen);

    for (const delimiter of ['\n', ' ', '!', '?', ',', ':', '...']) {
      const idx = searchSlice.lastIndexOf(delimiter);
      if (idx > splitIdx && idx > maxLen * 0.3) {
        splitIdx = idx;
      }
    }

    // If no good delimiter found, hard split at maxLen
    if (splitIdx === -1) {
      splitIdx = maxLen;
    } else {
      splitIdx += 1; // include the delimiter in the chunk
    }

    const chunk = remaining.slice(0, splitIdx).trim();
    if (chunk) chunks.push(chunk);
    remaining = remaining.slice(splitIdx).trim();
  }

  return chunks;
}

/**
 * Fetch TTS audio chunk from Google Translate API
 */
async function fetchGoogleChunk(chunk: string): Promise<Buffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=th&client=tw-ob&q=${encodeURIComponent(chunk)}`;
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 5000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://translate.google.com/'
    }
  });
  return Buffer.from(res.data);
}

/**
 * Generate 100% Google Translate TTS audio, handling any length of text
 */
async function generateGoogleTts(text: string): Promise<Buffer> {
  const chunks = splitTextIntoChunks(text, 160);
  if (chunks.length === 1) {
    return await fetchGoogleChunk(chunks[0]);
  }

  // Fetch all chunks in order
  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const buf = await fetchGoogleChunk(chunk);
    if (buf && buf.length > 0) {
      buffers.push(buf);
    }
  }

  return Buffer.concat(buffers);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (!isAllowedTtsRequest(request, searchParams)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const clientIp = getClientIp(request);
    const rate = await checkRateLimit(`tts:${clientIp}`, 12, 60000);
    if (!rate.allowed) {
      return new NextResponse('คุณส่งคำขอสังเคราะห์เสียงถี่เกินไป กรุณารอสักครู่', { status: 429 });
    }

    const rawText = searchParams.get('text') || '';
    const text = prepareTtsText(rawText.trim().slice(0, 300));

    if (!text) {
      return new NextResponse('ข้อความต้องไม่ว่างเปล่า', { status: 400 });
    }

    const cacheKey = text;
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      return new NextResponse(new Uint8Array(cached), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': cached.length.toString(),
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    const audioBuffer = await generateGoogleTts(text);

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('ไม่สามารถสังเคราะห์ไฟล์เสียงจาก Google TTS ได้');
    }

    // Cache management (LRU evict oldest)
    if (audioCache.size >= MAX_CACHE_SIZE) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, audioBuffer);

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error: any) {
    console.error('Google TTS API error:', error?.message || error);
    return new NextResponse(`เกิดข้อผิดพลาดในการสังเคราะห์เสียง: ${error?.message || error}`, { status: 500 });
  }
}
