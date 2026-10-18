import { NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import axios from 'axios';

export const dynamic = 'force-dynamic';

// In-memory audio buffer cache (keyed by voice:rate:pitch:text)
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 120;

// Default to Thai Premwadee Neural voice
const DEFAULT_VOICE = 'th-TH-PremwadeeNeural';

async function generateEdgeTts(text: string, voice: string, rate: string, pitch: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  // If cute variant requested, bump pitch
  let targetPitch = pitch;
  let targetRate = rate;
  if (voice === 'th-TH-PremwadeeNeural-cute') {
    voice = 'th-TH-PremwadeeNeural';
    if (pitch === '+0Hz') targetPitch = '+18Hz';
    if (rate === '+0%') targetRate = '+5%';
  }

  const { audioStream } = tts.toStream(text, { pitch: targetPitch, rate: targetRate });

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      audioStream.destroy();
      reject(new Error('Edge TTS stream timeout (>6s)'));
    }, 6000);

    audioStream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    audioStream.on('end', () => {
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks));
    });
    audioStream.on('error', err => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function generateGoogleTts(text: string): Promise<Buffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=th&client=tw-ob&q=${encodeURIComponent(text.slice(0, 200))}`;
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 4000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  return Buffer.from(res.data);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawText = searchParams.get('text') || '';
    const text = rawText.trim().slice(0, 500);

    if (!text) {
      return new NextResponse('ข้อความต้องไม่ว่างเปล่า', { status: 400 });
    }

    const requestedVoice = searchParams.get('voice') || DEFAULT_VOICE;
    const voice = (requestedVoice.startsWith('th-TH-')) ? requestedVoice : DEFAULT_VOICE;
    const rate = searchParams.get('rate') || '+0%';
    const pitch = searchParams.get('pitch') || '+0Hz';

    const cacheKey = `${voice}:${rate}:${pitch}:${text}`;
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

    let audioBuffer: Buffer;
    try {
      audioBuffer = await generateEdgeTts(text, voice, rate, pitch);
    } catch (edgeErr: any) {
      console.warn('Edge TTS failed, switching to Google TTS fallback:', edgeErr.message || edgeErr);
      audioBuffer = await generateGoogleTts(text);
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('ไม่สามารถสังเคราะห์ไฟล์เสียงได้');
    }

    // Cache management
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
    console.error('TTS API error:', error);
    return new NextResponse(`เกิดข้อผิดพลาดในการสร้างเสียง: ${error.message}`, { status: 500 });
  }
}
