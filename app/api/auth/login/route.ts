import { NextResponse } from 'next/server';
import { authenticateUser, SESSION_MAX_AGE_SECONDS } from '@/lib/services/userService';

export const dynamic = 'force-dynamic';

// In-Memory Login Rate Limiter (จำกัดพยายามเข้าสู่ระบบผิดพลาดสูงสุด 8 ครั้งต่อ 5 นาทีต่อ IP)
const loginAttemptMap = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;

function isLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttemptMap.get(ip);
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = loginAttemptMap.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttemptMap.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export async function POST(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const clientIp = forwardedFor.split(',')[0].trim();

  if (isLoginRateLimited(clientIp)) {
    return NextResponse.json(
      { success: false, message: 'คุณพยายามเข้าสู่ระบบผิดเกินจำนวนครั้งที่กำหนด กรุณารอ 5 นาทีแล้วลองใหม่' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' },
        { status: 400 }
      );
    }

    const { user, token } = await authenticateUser(username, password);
    loginAttemptMap.delete(clientIp);

    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role
      },
      token
    });

    // Set HTTP-only session cookie (valid for 1 hour)
    const isProduction = process.env.NODE_ENV === 'production';
    const maxAge = SESSION_MAX_AGE_SECONDS; // 1 hour (3600 seconds)

    response.cookies.set('admin_session', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge
    });

    return response;
  } catch (error: any) {
    recordFailedLogin(clientIp);
    return NextResponse.json(
      { success: false, message: error.message || 'การเข้าสู่ระบบล้มเหลว' },
      { status: 401 }
    );
  }
}
