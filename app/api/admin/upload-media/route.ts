import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminAuth } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Max file size: 25MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'image/gif',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'video/webm',
  'video/mp4',
  'video/quicktime'
]);

const ALLOWED_EXTENSIONS = new Set([
  'mp3', 'wav', 'ogg', 'gif', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'webm', 'mp4', 'mov'
]);

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'ไม่พบไฟล์ที่ต้องการอัปโหลด' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'ขนาดไฟล์เกินกำหนด (สูงสุด 25MB)' },
        { status: 400 }
      );
    }

    const originalName = file.name || 'sound';
    const ext = originalName.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_MIME_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { success: false, message: 'ประเภทไฟล์ไม่รองรับ รองรับเฉพาะ .mp3, .wav, .ogg, .gif, .webm, .mp4, .png' },
        { status: 400 }
      );
    }

    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : 'mp3';
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 9);
    const sanitizedBase = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const fileName = `${timestamp}_${randomHex}_${sanitizedBase}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    let publicUrl = '';

    // 1. Try Supabase Storage (Bucket: alert-media)
    try {
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('alert-media')
        .upload(fileName, fileBuffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: true
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabaseAdmin.storage
          .from('alert-media')
          .getPublicUrl(fileName);
        if (urlData?.publicUrl) {
          publicUrl = urlData.publicUrl;
        }
      }
    } catch (storageErr: any) {
      console.warn('Supabase storage alert-media notice:', storageErr?.message);
    }

    // 2. Local fallback if Supabase bucket unconfigured
    if (!publicUrl) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'alert-media');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, fileBuffer);
      publicUrl = `/uploads/alert-media/${fileName}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type
    });
  } catch (err: any) {
    console.error('Upload media error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'เกิดข้อผิดพลาดในการอัปโหลด' },
      { status: 500 }
    );
  }
}
