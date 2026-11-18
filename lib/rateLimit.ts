import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const memoryFallbackMap = new Map<string, { count: number; resetAt: number }>();
let warnedFallback = false;

function checkMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryFallbackMap.get(key);
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    memoryFallbackMap.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt };
  }
  const nextCount = entry.count + 1;
  entry.count = nextCount;
  return {
    allowed: nextCount <= limit,
    remaining: Math.max(0, limit - nextCount),
    resetAt: entry.resetAt,
  };
}

/**
 * Extract the best-effort client IP from forwarded headers.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  return realIp || '127.0.0.1';
}

/**
 * Check and increment a rate-limit bucket in Supabase, falling back to memory if the RPC is unavailable.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_ms: windowMs,
    });

    if (error) {
      if (!warnedFallback) {
        warnedFallback = true;
        console.warn('[rateLimit] Supabase RPC unavailable, falling back to memory:', error.message);
      }
      return checkMemoryRateLimit(key, limit, windowMs);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.allowed !== 'boolean') {
      return checkMemoryRateLimit(key, limit, windowMs);
    }

    return {
      allowed: row.allowed,
      remaining: Number(row.remaining ?? 0),
      resetAt: row.reset_at ? new Date(row.reset_at).getTime() : Date.now() + windowMs,
    };
  } catch (err: any) {
    if (!warnedFallback) {
      warnedFallback = true;
      console.warn('[rateLimit] Unexpected error, falling back to memory:', err?.message || err);
    }
    return checkMemoryRateLimit(key, limit, windowMs);
  }
}
