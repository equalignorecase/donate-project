import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { readValorantSettings, getActiveAccount } from '@/lib/valorantSettings';
import { ValorantRankData, ValorantMatchHistoryItem, ValorantSettings, ValorantAccountProfile } from '@/lib/types/valorant';

export const dynamic = 'force-dynamic';

interface CacheEntry {
  timestamp: number;
  data: ValorantRankData;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isTest = searchParams.get('test') === 'true';
    const testName = searchParams.get('name');
    const testTag = searchParams.get('tag');
    const testRegion = searchParams.get('region');
    const testApiKey = searchParams.get('apiKey');
    const accountId = searchParams.get('accountId');

    // 1. Fetch settings from database
    const { data: rows } = await supabaseAdmin
      .from('settings')
      .select('key, value');

    const dbSettings: Record<string, string> = {};
    if (rows) {
      rows.forEach((r: any) => {
        dbSettings[r.key] = r.value;
      });
    }

    const valorantConfig = readValorantSettings(dbSettings);
    const targetAccount: ValorantAccountProfile = getActiveAccount(valorantConfig, accountId);

    const name = (isTest && testName ? testName : targetAccount.name).trim();
    const tag = (isTest && testTag ? testTag : targetAccount.tag).trim();
    const region = (isTest && testRegion ? testRegion : targetAccount.region).trim() || 'ap';
    const apiKey = (isTest && testApiKey ? testApiKey : valorantConfig.valorant_api_key).trim();

    if (!name || !tag || !apiKey) {
      return NextResponse.json({
        success: false,
        notConfigured: true,
        message: 'ยังไม่ได้ตั้งค่า Riot Name, Tag หรือ HenrikDev API Key',
        account: targetAccount,
        settings: sanitizePublicSettings(valorantConfig),
      });
    }

    const cacheKey = `${region.toLowerCase()}:${name.toLowerCase()}:${tag.toLowerCase()}`;
    const now = Date.now();

    // 2. Return cache if still valid and not a test
    if (!isTest) {
      const cached = memoryCache.get(cacheKey);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json({
          success: true,
          cached: true,
          data: cached.data,
          settings: sanitizePublicSettings(valorantConfig),
        });
      }
    }

    // 3. Fetch HenrikDev MMR
    const headers: Record<string, string> = {
      'Authorization': apiKey,
      'User-Agent': 'ValorantRankOverlay/1.0',
    };

    const mmrUrl = `https://api.henrikdev.xyz/valorant/v1/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
    const historyUrl = `https://api.henrikdev.xyz/valorant/v1/mmr-history/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;

    const [mmrRes, historyRes] = await Promise.all([
      fetch(mmrUrl, { headers, cache: 'no-store' }),
      fetch(historyUrl, { headers, cache: 'no-store' }).catch(() => null),
    ]);

    if (!mmrRes.ok) {
      const errJson = await mmrRes.json().catch(() => ({}));
      const errMsg = errJson?.message || errJson?.errors?.[0]?.message || `HenrikDev API Error (${mmrRes.status})`;
      return NextResponse.json({
        success: false,
        status: mmrRes.status,
        message: errMsg,
        settings: sanitizePublicSettings(valorantConfig),
      }, { status: mmrRes.status >= 500 ? 502 : mmrRes.status });
    }

    const mmrJson = await mmrRes.json();
    const mmrData = mmrJson.data || {};

    let historyData: ValorantMatchHistoryItem[] = [];
    if (historyRes && historyRes.ok) {
      const histJson = await historyRes.json().catch(() => ({}));
      if (Array.isArray(histJson.data)) {
        historyData = histJson.data;
      }
    }

    // 4. Calculate Win / Loss
    let wins = 0;
    let losses = 0;
    const effectiveReset = targetAccount.session_reset_at || valorantConfig.valorant_session_reset_at;
    const sessionResetTimestamp = effectiveReset 
      ? Date.parse(effectiveReset) 
      : 0;

    const todayBangkok = new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Asia/Bangkok', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(new Date());

    for (const match of historyData) {
      const matchTimestamp = Date.parse(match.date);
      if (!Number.isFinite(matchTimestamp)) continue;

      // Filter condition:
      // If session reset is active and match is after reset:
      // Or if no reset: match was played today in Bangkok timezone
      let include = false;
      if (sessionResetTimestamp > 0) {
        include = matchTimestamp >= sessionResetTimestamp;
      } else {
        const matchDayBangkok = new Intl.DateTimeFormat('en-CA', { 
          timeZone: 'Asia/Bangkok', 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        }).format(new Date(matchTimestamp));
        include = matchDayBangkok === todayBangkok;
      }

      if (include) {
        if (match.mmr_change_to_last_game > 0) {
          wins++;
        } else if (match.mmr_change_to_last_game < 0) {
          losses++;
        }
      }
    }

    const lastMatchChange = historyData.length > 0 
      ? historyData[0].mmr_change_to_last_game 
      : 0;

    const rankPayload: ValorantRankData = {
      name: mmrData.name || name,
      tag: mmrData.tag || tag,
      currenttierpatched: mmrData.currenttierpatched || 'Unranked',
      currenttier: mmrData.currenttier ?? 0,
      ranking_in_tier: mmrData.ranking_in_tier ?? 0,
      elo: mmrData.elo ?? 0,
      images: {
        small: mmrData.images?.small || 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png',
        large: mmrData.images?.large || 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png',
        triangle_down: mmrData.images?.triangle_down,
        triangle_up: mmrData.images?.triangle_up,
      },
      wins,
      losses,
      last_match_change: lastMatchChange,
      updated_at: new Date().toISOString(),
    };

    if (!isTest) {
      memoryCache.set(cacheKey, { timestamp: now, data: rankPayload });
    }

    return NextResponse.json({
      success: true,
      data: rankPayload,
      account: targetAccount,
      settings: sanitizePublicSettings(valorantConfig),
    });
  } catch (error: any) {
    console.error('Valorant API Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error',
    }, { status: 500 });
  }
}

function sanitizePublicSettings(settings: ValorantSettings): Partial<ValorantSettings> {
  const safe = { ...settings };
  delete (safe as any).valorant_api_key;
  return safe;
}
