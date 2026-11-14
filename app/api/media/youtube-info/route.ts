import { NextResponse } from 'next/server';
import { parseYouTubeUrl } from '@/lib/media-share';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url') || '';
  const parsed = parseYouTubeUrl(rawUrl);

  if (!parsed) {
    return NextResponse.json(
      { success: false, message: 'ลิงก์ YouTube ไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  let title = `YouTube (${parsed.videoId})`;
  let authorName = 'YouTube';

  try {
    const watchUrl = `https://www.youtube.com/watch?v=${parsed.videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
    const res = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(4500),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && typeof data.title === 'string' && data.title.trim()) {
        title = data.title.trim();
      }
      if (data && typeof data.author_name === 'string' && data.author_name.trim()) {
        authorName = data.author_name.trim();
      }
    }
  } catch {
    // Non-fatal: still return parsed thumbnail & canonical metadata
  }

  return NextResponse.json({
    success: true,
    data: {
      videoId: parsed.videoId,
      startSeconds: parsed.startSeconds,
      canonicalUrl: parsed.canonicalUrl,
      thumbnailUrl: parsed.thumbnailUrl,
      title,
      authorName,
    },
  });
}
