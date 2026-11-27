'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Target,
  Trophy,
  Plus,
  RotateCcw,
  Trash2,
  Check,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { ManagedSupporterEntry, SupporterScope } from '@/lib/widgets';

interface ManageTotalsData {
  goal: {
    title: string;
    target: number;
    current: number;
    rawCurrent: number;
    offset: number;
    startedAt: string;
  };
  leaderboards: Record<SupporterScope, ManagedSupporterEntry[]>;
}

const SCOPE_LABELS: Record<SupporterScope, string> = {
  daily: 'อันดับวันนี้ (Daily)',
  monthly: 'อันดับเดือนนี้ (Monthly)',
  allTime: 'อันดับตลอดเวลา (All-Time)',
};

export default function ManageTotalsPage() {
  const { showToast, handleUnauthorized } = useAdmin();
  const [data, setData] = useState<ManageTotalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<SupporterScope>('daily');

  // Goal inputs
  const [goalCurrentInput, setGoalCurrentInput] = useState('');
  const [goalTargetInput, setGoalTargetInput] = useState('');

  // Add/Set Supporter inputs
  const [newSupporterName, setNewSupporterName] = useState('');
  const [newSupporterAmount, setNewSupporterAmount] = useState('');
  const [applyAllScopes, setApplyAllScopes] = useState(false);

  // Per-row inline edits: key = `${scope}:${name}`
  const [rowDrafts, setRowDrafts] = useState<Record<string, string>>({});

  const applyData = useCallback((next: ManageTotalsData) => {
    setData(next);
    setGoalCurrentInput(String(next.goal.current));
    setGoalTargetInput(String(next.goal.target));
    const drafts: Record<string, string> = {};
    (['daily', 'monthly', 'allTime'] as SupporterScope[]).forEach(s => {
      next.leaderboards[s].forEach(entry => {
        drafts[`${s}:${entry.name}`] = String(entry.amount);
      });
    });
    setRowDrafts(drafts);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/manage-totals', { cache: 'no-store' });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const result = await res.json();
      if (res.ok && result.success && result.data) {
        applyData(result.data);
      }
    } catch (err) {
      console.error('Failed to load manage totals:', err);
    } finally {
      setLoading(false);
    }
  }, [applyData, handleUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  const postAction = async (payload: Record<string, unknown>) => {
    if (busy) return false;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/manage-totals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      const result = await res.json();
      if (!res.ok || !result.success) {
        alert(result.message || 'บันทึกไม่สำเร็จ');
        return false;
      }
      if (result.data) applyData(result.data);
      if (result.message) showToast(result.message);
      return true;
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err?.message || 'Unknown error'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const desired = Number(goalCurrentInput);
    const target = Number(goalTargetInput);
    if (!Number.isFinite(desired) || desired < 0) {
      alert('กรุณากรอกยอดปัจจุบันให้ถูกต้อง (ตั้งแต่ 0 ขึ้นไป)');
      return;
    }
    if (!Number.isFinite(target) || target <= 0) {
      alert('กรุณากรอกยอดเป้าหมายให้มากกว่า 0');
      return;
    }
    await postAction({
      action: 'set_goal_current',
      desiredCurrent: desired,
      target,
    });
  };

  const handleAddOrUpdateSupporter = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSupporterName.trim();
    const amount = Number(newSupporterAmount);
    if (!name) {
      alert('กรุณากรอกชื่อผู้สนับสนุน');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      alert('กรุณากรอกยอดเงินให้ถูกต้อง');
      return;
    }
    const ok = await postAction({
      action: 'set_supporter_total',
      scope,
      name,
      desiredAmount: amount,
      applyAllScopes,
    });
    if (ok) {
      setNewSupporterName('');
      setNewSupporterAmount('');
    }
  };

  const goalPercent = data
    ? Math.min(100, Math.max(0, (data.goal.current / Math.max(1, data.goal.target)) * 100))
    : 0;
  const activeEntries = data?.leaderboards[scope] || [];

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>จัดการยอดหลอดเป้าหมาย &amp; อันดับผู้โดเนท</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            ปรับยอดปัจจุบันบนหลอดเป้าหมาย และแก้ไขยอดรวมรายคนในอันดับ (ระบบ Smart Offset: เมื่อมีโดเนทใหม่เข้ามา จะบวกเพิ่มต่อจากยอดที่ตั้งไว้โดยอัตโนมัติ)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn secondary sm"
            disabled={loading || busy}
            onClick={() => void load()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            <span>รีเฟรช</span>
          </button>
          <Link
            href="/admin/widgets"
            className="btn secondary sm"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>ไปหน้าแต่งดีไซน์วิดเจ็ต</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* SECTION 1: GOAL AMOUNT MANAGER */}
      <section className="card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>1. ยอดหลอดเป้าหมาย ({data?.goal.title || 'เป้าหมายโดเนท'})</h2>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                ยอดสลิปจริง: <strong>฿{(data?.goal.rawCurrent ?? 0).toLocaleString('th-TH')}</strong>
                {' · '}
                ส่วนต่างที่ปรับแต่ง (Offset):{' '}
                <strong style={{ color: (data?.goal.offset ?? 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                  {(data?.goal.offset ?? 0) >= 0 ? `+฿${(data?.goal.offset ?? 0).toLocaleString('th-TH')}` : `-฿${Math.abs(data?.goal.offset ?? 0).toLocaleString('th-TH')}`}
                </strong>
              </span>
            </div>
          </div>

          {data && data.goal.offset !== 0 && (
            <button
              type="button"
              className="btn secondary sm"
              disabled={busy}
              onClick={() => void postAction({ action: 'reset_goal_offset' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} />
              <span>คืนค่ายอดสลิปจริง (฿{data.goal.rawCurrent.toLocaleString('th-TH')})</span>
            </button>
          )}
        </div>

        {/* Visual Progress Summary */}
        <div style={{ marginBottom: '18px', padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-subtle, rgba(15,23,42,0.04))', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800 }}>
              ฿{(data?.goal.current ?? 0).toLocaleString('th-TH')}{' '}
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>
                / ฿{(data?.goal.target ?? 15000).toLocaleString('th-TH')}
              </span>
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>
              {data ? ((data.goal.current / Math.max(1, data.goal.target)) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
          <div style={{ height: '12px', borderRadius: '999px', background: 'rgba(148,163,184,0.2)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${goalPercent}%`,
                height: '100%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #22d3ee, #6366f1, #e879f9)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Direct Edit & Quick Delta Buttons */}
        <form onSubmit={handleSaveGoal} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'end' }}>
          <label style={{ margin: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              ยอดปัจจุบันบนหลอด (บาท) — แก้เลขได้ทันที
            </span>
            <input
              type="number"
              min="0"
              max="9999999999"
              step="0.01"
              value={goalCurrentInput}
              onChange={e => setGoalCurrentInput(e.target.value)}
              disabled={loading || busy}
              required
            />
          </label>
          <label style={{ margin: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              ยอดเป้าหมาย (บาท)
            </span>
            <input
              type="number"
              min="1"
              max="9999999999"
              step="0.01"
              value={goalTargetInput}
              onChange={e => setGoalTargetInput(e.target.value)}
              disabled={loading || busy}
              required
            />
          </label>
          <div>
            <button
              type="submit"
              className="btn primary"
              disabled={loading || busy}
              style={{ width: '100%', minHeight: '42px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Check size={16} />
              <span>บันทึกยอดหลอดเป้าหมาย</span>
            </button>
          </div>
        </form>

        {/* Quick Increment/Decrement Pills */}
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginRight: '4px' }}>ปุ่มปรับด่วน:</span>
          {[100, 500, 1000, -100, -500].map(delta => (
            <button
              key={delta}
              type="button"
              className="btn secondary sm"
              disabled={loading || busy}
              onClick={() => void postAction({ action: 'adjust_goal_delta', delta })}
            >
              {delta > 0 ? `+฿${delta.toLocaleString()}` : `-฿${Math.abs(delta).toLocaleString()}`}
            </button>
          ))}
          <button
            type="button"
            className="btn secondary sm"
            disabled={loading || busy}
            onClick={() => void postAction({ action: 'set_goal_current', desiredCurrent: 0 })}
          >
            ตั้งเป็น ฿0
          </button>
        </div>
      </section>

      {/* SECTION 2: SUPPORTER LEADERBOARD MANAGER */}
      <section className="card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>2. จัดการยอดรวมรายคนในอันดับผู้โดเนท</h2>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                แก้ไขยอดรวมของแต่ละคน หรือเพิ่มชื่อคนเข้าอันดับได้ทันทีโดยไม่ต้องสร้างบิลหลอก
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn secondary sm"
            disabled={loading || busy}
            onClick={() => void postAction({ action: 'reset_supporter_adjustments', scope })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={14} />
            <span>คืนค่ายอดสลิปจริงของหมวดนี้</span>
          </button>
        </div>

        {/* Scope Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
          {(['daily', 'monthly', 'allTime'] as SupporterScope[]).map(s => (
            <button
              key={s}
              type="button"
              className={`btn sm ${scope === s ? 'primary' : 'secondary'}`}
              onClick={() => setScope(s)}
            >
              {SCOPE_LABELS[s]} ({data?.leaderboards[s].length ?? 0})
            </button>
          ))}
        </div>

        {/* Add or Set Supporter Total Form */}
        <form
          onSubmit={handleAddOrUpdateSupporter}
          style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--bg-subtle, rgba(15,23,42,0.03))',
            marginBottom: '18px',
          }}
        >
          <div style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '10px' }}>
            + เพิ่มคนเข้าอันดับ หรือ ตั้งยอดรวมใหม่ ({SCOPE_LABELS[scope]})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' }}>
            <label style={{ margin: 0 }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ชื่อผู้สนับสนุน</span>
              <input
                placeholder="เช่น Somchai TopDonator"
                value={newSupporterName}
                onChange={e => setNewSupporterName(e.target.value)}
                maxLength={60}
                disabled={loading || busy}
                required
              />
            </label>
            <label style={{ margin: 0 }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ยอดรวมที่ต้องการแสดง (บาท)</span>
              <input
                type="number"
                min="0"
                max="9999999999"
                step="0.01"
                placeholder="เช่น 2500"
                value={newSupporterAmount}
                onChange={e => setNewSupporterAmount(e.target.value)}
                disabled={loading || busy}
                required
              />
            </label>
            <div>
              <button
                type="submit"
                className="btn primary"
                disabled={loading || busy}
                style={{ width: '100%', minHeight: '42px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Plus size={16} />
                <span>ตั้งยอดผู้สนับสนุน</span>
              </button>
            </div>
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '12.5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={applyAllScopes}
              onChange={e => setApplyAllScopes(e.target.checked)}
              disabled={loading || busy}
            />
            <span>ตั้งยอดนี้พร้อมกันทั้ง 3 หมวด (วันนี้ + เดือนนี้ + ตลอดเวลา)</span>
          </label>
        </form>

        {/* Supporter Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px', width: '64px' }}>อันดับ</th>
                <th style={{ padding: '10px 8px' }}>ชื่อผู้สนับสนุน</th>
                <th style={{ padding: '10px 8px' }}>ยอดสลิปจริง</th>
                <th style={{ padding: '10px 8px' }}>ส่วนต่างปรับแต่ง</th>
                <th style={{ padding: '10px 8px', minWidth: '220px' }}>ยอดรวมที่แสดงบน OBS (บาท)</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {activeEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    ยังไม่มีรายชื่อในหมวดนี้ — สามารถเพิ่มชื่อด้านบนได้เลย
                  </td>
                </tr>
              ) : (
                activeEntries.map((item, idx) => {
                  const draftKey = `${scope}:${item.name}`;
                  const draftVal = rowDrafts[draftKey] ?? String(item.amount);
                  const isDirty = Number(draftVal) !== item.amount;

                  return (
                    <tr key={item.name} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 700 }}>#{idx + 1}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                        ฿{item.rawAmount.toLocaleString('th-TH')}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {item.offset === 0 ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                        ) : (
                          <span style={{ color: item.offset > 0 ? '#10b981' : '#f43f5e', fontWeight: 600, fontSize: '12.5px' }}>
                            {item.offset > 0 ? `+฿${item.offset.toLocaleString('th-TH')}` : `-฿${Math.abs(item.offset).toLocaleString('th-TH')}`}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            min="0"
                            max="9999999999"
                            step="0.01"
                            value={draftVal}
                            onChange={e =>
                              setRowDrafts(prev => ({
                                ...prev,
                                [draftKey]: e.target.value,
                              }))
                            }
                            style={{ width: '130px', padding: '6px 10px' }}
                            disabled={busy}
                          />
                          <button
                            type="button"
                            className={`btn sm ${isDirty ? 'primary' : 'secondary'}`}
                            disabled={busy}
                            onClick={() =>
                              void postAction({
                                action: 'set_supporter_total',
                                scope,
                                name: item.name,
                                desiredAmount: Number(draftVal),
                              })
                            }
                            title="บันทึกยอดใหม่"
                          >
                            บันทึก
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {item.offset !== 0 && (
                            <button
                              type="button"
                              className="btn secondary sm"
                              disabled={busy}
                              onClick={() =>
                                void postAction({
                                  action: 'set_supporter_total',
                                  scope,
                                  name: item.name,
                                  desiredAmount: item.rawAmount,
                                })
                              }
                              title="คืนค่ายอดสลิปจริง"
                            >
                              <RotateCcw size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn secondary sm"
                            disabled={busy}
                            onClick={() =>
                              void postAction({
                                action: 'set_supporter_total',
                                scope,
                                name: item.name,
                                desiredAmount: 0,
                              })
                            }
                            title="นำออกจากอันดับนี้ (ตั้งยอดแสดงผลเป็น 0)"
                            style={{ color: '#f43f5e' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
