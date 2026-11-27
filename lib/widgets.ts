import { GoalAppearance, readGoalAppearance } from './goalAppearance';
import { SupporterAppearance, readSupporterAppearance } from './supporterAppearance';
import { QrCardAppearance, readQrCardAppearance } from './qrCardAppearance';
export interface Supporter { name: string; amount: number }
export type SupporterScope = 'daily' | 'monthly' | 'allTime';
export type SupporterAdjustments = Partial<Record<SupporterScope, Record<string, number>>>;

export interface WidgetData {
  goal: {
    title: string;
    target: number;
    current: number;
    rawCurrent?: number;
    offset?: number;
    appearance: GoalAppearance;
  };
  supporterAppearance: SupporterAppearance;
  qrCardAppearance: QrCardAppearance;
  recent: Supporter[];
  daily: Supporter[];
  monthly: Supporter[];
  allTime: Supporter[];
}

export function parseSupporterAdjustments(raw?: string): SupporterAdjustments {
  if (!raw || typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: SupporterAdjustments = {};
    for (const scope of ['daily', 'monthly', 'allTime'] as SupporterScope[]) {
      const group = parsed[scope];
      if (group && typeof group === 'object') {
        const cleanGroup: Record<string, number> = {};
        for (const [name, val] of Object.entries(group)) {
          const trimmed = name.trim();
          const num = Number(val);
          if (trimmed && Number.isFinite(num) && num !== 0) {
            cleanGroup[trimmed] = Math.round(num * 100) / 100;
          }
        }
        if (Object.keys(cleanGroup).length > 0) {
          out[scope] = cleanGroup;
        }
      }
    }
    return out;
  } catch {
    return {};
  }
}

export interface ManagedSupporterEntry {
  name: string;
  amount: number;
  rawAmount: number;
  offset: number;
}

export function summarizeManageTotals(
  rows: { name: string; amount: number | string; created_at: string }[],
  settings: Record<string, string>,
  now = new Date()
) {
  const dateKey = (date: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  const today = dateKey(now);
  const start = settings.goal_started_at ? Date.parse(settings.goal_started_at) : 0;
  const rawMaps = [new Map<string, number>(), new Map<string, number>(), new Map<string, number>()];
  let rawCurrent = 0;

  for (const row of rows) {
    const amount = Number(row.amount);
    const timestamp = Date.parse(row.created_at);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(timestamp)) continue;
    const name = row.name.trim() || 'ผู้สนับสนุน';
    const day = dateKey(new Date(timestamp));
    if (timestamp >= start) rawCurrent += amount;
    [day === today, day.slice(0, 7) === today.slice(0, 7), true].forEach((include, index) => {
      if (include) rawMaps[index].set(name, (rawMaps[index].get(name) || 0) + amount);
    });
  }

  const adjustments = parseSupporterAdjustments(settings.supporter_adjustments);
  const buildScopeList = (scope: SupporterScope, idx: number): ManagedSupporterEntry[] => {
    const rawMap = rawMaps[idx];
    const adjMap = adjustments[scope] || {};
    const names = new Set<string>([...Array.from(rawMap.keys()), ...Object.keys(adjMap)]);
    const list: ManagedSupporterEntry[] = [];
    for (const name of Array.from(names)) {
      const rawAmount = Math.round((rawMap.get(name) || 0) * 100) / 100;
      const offset = Math.round((adjMap[name] || 0) * 100) / 100;
      const amount = Math.max(0, Math.round((rawAmount + offset) * 100) / 100);
      if (amount > 0 || rawAmount > 0) {
        list.push({ name, amount, rawAmount, offset });
      }
    }
    return list
      .sort((a, b) => b.amount - a.amount || b.rawAmount - a.rawAmount || a.name.localeCompare(b.name, 'th'))
      .slice(0, 100);
  };

  const target = Number(settings.goal_target || 15000);
  const rawOffset = Number(settings.goal_amount_offset || 0);
  const offset = Number.isFinite(rawOffset) ? Math.round(rawOffset * 100) / 100 : 0;
  const cleanRawCurrent = Math.round(rawCurrent * 100) / 100;
  const current = Math.max(0, Math.round((cleanRawCurrent + offset) * 100) / 100);

  return {
    goal: {
      title: settings.goal_title || 'เป้าหมายโดเนท',
      target: Number.isFinite(target) && target > 0 ? target : 15000,
      current,
      rawCurrent: cleanRawCurrent,
      offset,
      startedAt: settings.goal_started_at || '',
    },
    leaderboards: {
      daily: buildScopeList('daily', 0),
      monthly: buildScopeList('monthly', 1),
      allTime: buildScopeList('allTime', 2),
    },
  };
}

export function summarizeWidgets(rows: { name: string; amount: number | string; created_at: string }[], settings: Record<string, string>, now = new Date(), limitOverride?: number): WidgetData {
  const dateKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const today = dateKey(now);
  const supporterAppearance = readSupporterAppearance(settings);
  const limit = Number.isInteger(limitOverride) && limitOverride! >= 1 && limitOverride! <= 10
    ? limitOverride! : Number(supporterAppearance.supporter_limit);
  const start = settings.goal_started_at ? Date.parse(settings.goal_started_at) : 0;
  const totals = [new Map<string, number>(), new Map<string, number>(), new Map<string, number>()];
  let rawCurrent = 0;
  const recent: Supporter[] = [];
  for (const row of rows) {
    const amount = Number(row.amount);
    const timestamp = Date.parse(row.created_at);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(timestamp)) continue;
    const name = row.name.trim() || 'ผู้สนับสนุน';
    const day = dateKey(new Date(timestamp));
    if (timestamp >= start) rawCurrent += amount;
    if (recent.length < limit) recent.push({ name, amount });
    [day === today, day.slice(0, 7) === today.slice(0, 7), true].forEach((include, index) => {
      if (include) totals[index].set(name, (totals[index].get(name) || 0) + amount);
    });
  }

  const adjustments = parseSupporterAdjustments(settings.supporter_adjustments);
  (['daily', 'monthly', 'allTime'] as SupporterScope[]).forEach((scope, idx) => {
    const scopeAdj = adjustments[scope];
    if (!scopeAdj) return;
    const map = totals[idx];
    for (const [name, delta] of Object.entries(scopeAdj)) {
      const nextVal = Math.round(((map.get(name) || 0) + delta) * 100) / 100;
      if (nextVal > 0) map.set(name, nextVal);
      else map.delete(name);
    }
  });

  const rank = (map: Map<string, number>) => Array.from(map).map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 })).filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'th')).slice(0, limit);
  const target = Number(settings.goal_target || 15000);
  const rawOffset = Number(settings.goal_amount_offset || 0);
  const offset = Number.isFinite(rawOffset) ? Math.round(rawOffset * 100) / 100 : 0;
  const cleanRawCurrent = Math.round(rawCurrent * 100) / 100;
  const current = Math.max(0, Math.round((cleanRawCurrent + offset) * 100) / 100);
  return {
    goal: {
      title: settings.goal_title || 'เป้าหมายโดเนท',
      target: Number.isFinite(target) && target > 0 ? target : 15000,
      current,
      rawCurrent: cleanRawCurrent,
      offset,
      appearance: readGoalAppearance(settings),
    },
    supporterAppearance,
    qrCardAppearance: readQrCardAppearance(settings),
    recent,
    daily: rank(totals[0]),
    monthly: rank(totals[1]),
    allTime: rank(totals[2]),
  };
}
