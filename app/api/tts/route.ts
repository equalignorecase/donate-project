import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

// Simple memory cache for synthesized phrases (keyed by voice + rate + pitch + text)
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 100;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawText = searchParams.get('text') || '';
    const text = rawText.trim().slice(0, 500);

    if (!text) {
      return new NextResponse('ข้อความต้องไม่ว่างเปล่า', { status: 400 });
    }

    const requestedVoice = searchParams.get('voice') || 'th-TH-PremwadeeNeural';
    // Normalize voice (Achara is unsupported by Edge TTS, fallback to Premwadee)
    const voice = (requestedVoice === 'th-TH-AcharaNeural' || (!requestedVoice.startsWith('th-TH-') && requestedVoice !== 'browser_default'))
      ? 'th-TH-PremwadeeNeural'
      : requestedVoice;
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

    const scriptPath = path.join(process.cwd(), 'lib', 'scripts', 'edge_tts_stream.py');

    const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
      const py = spawn('python', [scriptPath, text, voice, rate, pitch]);
      const chunks: Buffer[] = [];
      let errLog = '';

      py.stdout.on('data', chunk => chunks.push(chunk));
      py.stderr.on('data', data => { errLog += data.toString(); });

      py.on('close', code => {
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(errLog || `Python process exited with code ${code}`));
        }
      });

      py.on('error', err => reject(err));
    });

    // Store in cache
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
