export interface TrueMoneyHealthSuccess {
  success: true;
  status: 'online';
  statusCode: number;
  latencyMs: number;
  apiUrl: string;
  data: Record<string, unknown>;
}

export interface TrueMoneyHealthFailure {
  success: false;
  status: 'offline';
  statusCode?: number;
  latencyMs?: number;
  apiUrl?: string;
  message: string;
}

export type TrueMoneyHealthResult = TrueMoneyHealthSuccess | TrueMoneyHealthFailure;

/**
 * Perform a health check on the TrueMoney API service by calling GET /health
 */
export async function checkTrueMoneyHealth(
  rawBaseUrl: string | undefined,
  fetchFn: typeof fetch = fetch
): Promise<TrueMoneyHealthResult> {
  const baseApi = rawBaseUrl?.trim().replace(/\/+$/, '');
  if (!baseApi) {
    return {
      success: false,
      status: 'offline',
      message: 'ระบบ TrueMoney ยังไม่ได้กำหนดค่า TRUEMONEY_API_URL ในไฟล์ Environment (.env)',
    };
  }

  let healthUrl: string;
  try {
    const parsed = new URL(baseApi);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Invalid protocol');
    }
    healthUrl = `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}/health`;
  } catch {
    return {
      success: false,
      status: 'offline',
      message: 'รูปแบบ TRUEMONEY_API_URL ไม่ถูกต้อง กรุณาตรวจสอบ URL',
    };
  }

  const startTime = performance.now();
  try {
    const res = await fetchFn(healthUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        status: 'offline',
        statusCode: res.status,
        latencyMs,
        apiUrl: healthUrl,
        message: `API ตอบกลับด้วยรหัสข้อผิดพลาด HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      status: 'online',
      statusCode: res.status,
      latencyMs,
      apiUrl: healthUrl,
      data: (data && typeof data === 'object') ? data : {},
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    const isTimeout = (err as { name?: string })?.name === 'TimeoutError' || (err as { name?: string })?.name === 'AbortError';
    return {
      success: false,
      status: 'offline',
      latencyMs,
      apiUrl: healthUrl,
      message: isTimeout
        ? 'การเชื่อมต่อไปยัง TrueMoney API หมดเวลา (Timeout เกิน 6 วินาที)'
        : (err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อกับ TrueMoney API ได้'),
    };
  }
}
