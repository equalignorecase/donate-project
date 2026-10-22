'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Sparkles,
  Zap,
  Check,
  Sliders,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Palette,
  Tv,
  Send,
  SlidersHorizontal,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { supabase } from '@/lib/supabaseClient';
import {
  computeRemainingSeconds,
  formatDeltaDisplay,
  formatTimerDisplay
} from '@/lib/timerLogic';
import {
  defaultTimerAppearance,
  defaultTimerConfig,
  TimerAction,
  TimerAppearance,
  TimerConfig,
  TimerEventPayload,
  TimerRule,
  TimerStatus,
  TimerTheme
} from '@/lib/timerTypes';
import TimerCard from '@/app/overlay/timer/TimerCard';
import '@/app/overlay/timer/timer.css';
import './timer-admin.css';

type TabType = 'control' | 'rules' | 'design' | 'obs';

export default function TimerAdminPage() {
  const { showToast, handleUnauthorized } = useAdmin();

  const [config, setConfig] = useState<TimerConfig>(defaultTimerConfig);
  const [liveSeconds, setLiveSeconds] = useState<number>(3600);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>('');
  const [previewKey, setPreviewKey] = useState<number>(0);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('control');

  // Preview stage background switcher
  const [previewBg, setPreviewBg] = useState<'checker' | 'game' | 'bright'>('checker');

  // Copied indicator state for OBS links
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // New tier rule form state
  const [newRuleAmount, setNewRuleAmount] = useState<string>('50');
  const [newRuleAction, setNewRuleAction] = useState<TimerAction>('subtract');
  const [newRuleMinutes, setNewRuleMinutes] = useState<string>('10');
  const [newRuleLabel, setNewRuleLabel] = useState<string>('');

  // Simulation test state
  const [simAmount, setSimAmount] = useState<string>('5');
  const [simDonor, setSimDonor] = useState<string>('ผู้ชมใจดี');
  const [simulating, setSimulating] = useState<boolean>(false);

  // Ref for timer loop
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Set window origin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Fetch initial config
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/timer');
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        const current = computeRemainingSeconds(data.config);
        setLiveSeconds(current);
      } else {
        showToast(data.message || 'ไม่สามารถโหลดข้อมูลตัวจับเวลาได้');
      }
    } catch (err: any) {
      console.error('Fetch timer config error:', err);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, showToast]);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  // Realtime subscription for timer updates
  useEffect(() => {
    const channel = supabase.channel('donation-alerts');

    channel
      .on('broadcast', { event: 'timer_update' }, (payload: any) => {
        const data = payload.payload as TimerEventPayload;
        if (!data) return;

        setConfig(prev => {
          const updated = {
            ...prev,
            timer_status: data.status || prev.timer_status,
            timer_remaining_seconds: typeof data.remaining_seconds === 'number' ? data.remaining_seconds : prev.timer_remaining_seconds,
            timer_last_updated_at: data.last_updated_at || prev.timer_last_updated_at
          };
          return updated;
        });

        if (typeof data.remaining_seconds === 'number') {
          setLiveSeconds(data.remaining_seconds);
        }

        if (data.delta_seconds) {
          const msg = data.donor_name
            ? `⏱️ ${data.donor_name}: ${formatDeltaDisplay(data.delta_seconds)} (${data.reason || ''})`
            : `⏱️ ปรับเวลา ${formatDeltaDisplay(data.delta_seconds)}`;
          showToast(msg);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showToast]);

  // Live countdown loop
  useEffect(() => {
    const interval = setInterval(() => {
      const cur = configRef.current;
      const computed = computeRemainingSeconds({
        timer_status: cur.timer_status,
        timer_remaining_seconds: cur.timer_remaining_seconds,
        timer_last_updated_at: cur.timer_last_updated_at,
        timer_max_cap_seconds: cur.timer_max_cap_seconds
      });
      setLiveSeconds(computed);
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Timer Command Action (Start, Pause, Resume, Reset, Stop)
  const handleCommand = async (command: 'start' | 'pause' | 'resume' | 'reset' | 'stop') => {
    try {
      const res = await fetch('/api/admin/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        setLiveSeconds(data.liveRemaining);
        const actionLabels: Record<string, string> = {
          start: 'เริ่มนับเวลาแล้ว',
          resume: 'นับเวลาต่อแล้ว',
          pause: 'หยุดเวลาชั่วคราวแล้ว',
          reset: 'รีเซ็ตเวลากลับค่าเริ่มต้นแล้ว',
          stop: 'หยุดการจับเวลาแล้ว'
        };
        showToast(actionLabels[command] || 'ดำเนินการสำเร็จ');
      } else {
        showToast(data.message || 'ดำเนินการไม่สำเร็จ');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการส่งคำสั่ง');
    }
  };

  // Quick Adjust (e.g. +300s, -300s)
  const handleQuickAdjust = async (deltaSeconds: number) => {
    try {
      const res = await fetch('/api/admin/timer/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deltaSeconds })
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
      } else {
        showToast(data.message || 'ปรับเวลาไม่สำเร็จ');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการปรับเวลา');
    }
  };

  // Simulate donation test
  const handleSimulate = async () => {
    const amt = parseFloat(simAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('กรุณาระบุยอดเงินจำลองที่ถูกต้อง');
      return;
    }
    setSimulating(true);
    try {
      const res = await fetch('/api/admin/timer/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulate: true,
          amount: amt,
          name: simDonor.trim() || 'ผู้ชมทดสอบ'
        })
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 ${data.message}`);
        setPreviewKey(k => k + 1);
      } else {
        showToast(data.message || 'การจำลองล้มเหลว');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการจำลอง');
    } finally {
      setSimulating(false);
    }
  };

  // Save Config Settings
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        showToast('บันทึกการตั้งค่าระบบจับเวลาเรียบร้อยแล้ว');
        setPreviewKey(k => k + 1);
      } else {
        showToast(data.message || 'บันทึกไม่สำเร็จ');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  // Add custom tier rule
  const handleAddTierRule = () => {
    const amt = parseFloat(newRuleAmount);
    const mins = parseFloat(newRuleMinutes);
    if (isNaN(amt) || amt <= 0 || isNaN(mins) || mins <= 0) {
      showToast('กรุณากรอกยอดเงินและจำนวนนาทีที่ถูกต้อง');
      return;
    }
    const newRule: TimerRule = {
      id: 'rule-' + Date.now(),
      amount: amt,
      action: newRuleAction,
      seconds: Math.round(mins * 60),
      label: newRuleLabel.trim() || `ยอด ${amt} บาท = ${newRuleAction === 'add' ? '+' : '-'}${mins} นาที`
    };

    setConfig(prev => ({
      ...prev,
      timer_tier_rules: [...prev.timer_tier_rules, newRule]
    }));

    setNewRuleLabel('');
    showToast(`เพิ่มกฎยอด ฿${amt} แล้ว อย่าลืมกดบันทึกการตั้งค่า`);
  };

  // Delete custom tier rule
  const handleDeleteTierRule = (id: string) => {
    setConfig(prev => ({
      ...prev,
      timer_tier_rules: prev.timer_tier_rules.filter(r => r.id !== id)
    }));
    showToast('ลบกฎแล้ว อย่าลืมกดบันทึกการตั้งค่า');
  };

  // Copy OBS link with visual feedback
  const copyObsLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
      showToast('คัดลอกลิงก์ OBS เรียบร้อยแล้ว');
    } catch {
      showToast('ไม่สามารถคัดลอกได้ กรุณาเลือกและคัดลอกในช่อง');
    }
  };

  const { formatted } = formatTimerDisplay(liveSeconds);

  return (
    <div className="timer-admin-container">
      {/* Top Header Bar */}
      <div className="timer-admin-header">
        <div className="timer-admin-title">
          <h1>
            <Clock size={28} style={{ color: '#0284c7' }} />
            ระบบจับเวลานับถอยหลัง & Subathon (Timer)
          </h1>
          <p>แผงควบคุมระบบนับเวลาแบบเรียลไทม์ พร้อมกฎการคิดเวลาและสตูดิโอปรับแต่ง Widget บน OBS</p>
        </div>

        <button
          type="button"
          onClick={() => void handleSaveConfig()}
          disabled={saving || loading}
          className="timer-btn timer-btn-primary"
        >
          {saving ? (
            'กำลังบันทึก…'
          ) : (
            <>
              <Check size={16} /> บันทึกการตั้งค่าทั้งหมด
            </>
          )}
        </button>
      </div>

      {/* =========================================================================
          PERSISTENT STREAMER HERO BOARD (LIVE DISPLAY & CONTROLS)
          ========================================================================= */}
      <div className="timer-control-card">
        <div className="timer-live-status">
          {config.timer_status === 'running' && (
            <span className="timer-status-badge status-badge-running">● กำลังนับถอยหลัง (RUNNING)</span>
          )}
          {config.timer_status === 'paused' && (
            <span className="timer-status-badge status-badge-paused">⏸ หยุดชั่วคราว (PAUSED)</span>
          )}
          {config.timer_status === 'stopped' && (
            <span className="timer-status-badge status-badge-ended">⏹ หมดเวลา / หยุดแล้ว (STOPPED)</span>
          )}
        </div>

        <div className="timer-live-digits">{formatted}</div>

        <div className="timer-actions-row">
          {config.timer_status !== 'running' ? (
            <button
              type="button"
              onClick={() => handleCommand(config.timer_status === 'paused' && liveSeconds > 0 ? 'resume' : 'start')}
              className="timer-btn timer-btn-success"
              disabled={loading}
            >
              <Play size={18} />
              {config.timer_status === 'paused' && liveSeconds > 0 ? 'นับเวลาต่อ (Resume)' : 'เริ่มนับถอยหลัง (Start)'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleCommand('pause')}
              className="timer-btn timer-btn-warning"
              disabled={loading}
            >
              <Pause size={18} />
              หยุดชั่วคราว (Pause)
            </button>
          )}

          <button
            type="button"
            onClick={() => handleCommand('reset')}
            className="timer-btn timer-btn-secondary"
            disabled={loading}
            title="รีเซ็ตเวลากลับไปเป็นค่าเริ่มต้น"
          >
            <RotateCcw size={18} />
            รีเซ็ตเวลา (Reset)
          </button>
        </div>
      </div>

      {/* Quick Adjust Buttons Bar */}
      <div className="timer-quick-adjust-card">
        <h2>
          <Zap size={18} style={{ color: '#0284c7' }} />
          ปรับเวลาด่วน (Quick Adjust) - ส่งผลไปยัง OBS ทันที
        </h2>
        <div className="quick-adjust-buttons">
          <div className="quick-adjust-group add-group">
            <button type="button" className="btn-adjust-add" onClick={() => handleQuickAdjust(60)}>+1 นาที</button>
            <button type="button" className="btn-adjust-add" onClick={() => handleQuickAdjust(300)}>+5 นาที</button>
            <button type="button" className="btn-adjust-add" onClick={() => handleQuickAdjust(900)}>+15 นาที</button>
            <button type="button" className="btn-adjust-add" onClick={() => handleQuickAdjust(1800)}>+30 นาที</button>
            <button type="button" className="btn-adjust-add" onClick={() => handleQuickAdjust(3600)}>+1 ชั่วโมง</button>
          </div>
          <span className="quick-adjust-divider" />
          <div className="quick-adjust-group sub-group">
            <button type="button" className="btn-adjust-sub" onClick={() => handleQuickAdjust(-60)}>-1 นาที</button>
            <button type="button" className="btn-adjust-sub" onClick={() => handleQuickAdjust(-300)}>-5 นาที</button>
            <button type="button" className="btn-adjust-sub" onClick={() => handleQuickAdjust(-900)}>-15 นาที</button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CAPSULE TABS NAVIGATION
          ========================================================================= */}
      <nav className="timer-tabs-nav" aria-label="Timer sections">
        <button
          type="button"
          className={`timer-tab-btn ${activeTab === 'control' ? 'active' : ''}`}
          onClick={() => setActiveTab('control')}
        >
          <SlidersHorizontal size={16} />
          ขอบเขต & จำลอง
        </button>

        <button
          type="button"
          className={`timer-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Zap size={16} />
          กฎเพิ่ม/ลดเวลา
        </button>

        <button
          type="button"
          className={`timer-tab-btn ${activeTab === 'design' ? 'active' : ''}`}
          onClick={() => setActiveTab('design')}
        >
          <Palette size={16} />
          ดีไซน์ & พรีวิวสด
        </button>

        <button
          type="button"
          className={`timer-tab-btn ${activeTab === 'obs' ? 'active' : ''}`}
          onClick={() => setActiveTab('obs')}
        >
          <Tv size={16} />
          ลิงก์ OBS Overlay
        </button>
      </nav>

      {/* =========================================================================
          TAB 1: CONTROL (ขอบเขตเวลา & ทดสอบจำลอง)
          ========================================================================= */}
      {activeTab === 'control' && (
        <div className="timer-grid-2">
          {/* Limits & Initial boundary */}
          <div className="timer-card">
            <h2>
              <ShieldAlert size={20} style={{ color: '#0284c7' }} />
              ขอบเขตเวลา & เวลาเริ่มต้น
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              กำหนดเวลาเริ่มต้นเมื่อกดเริ่มนับถอยหลัง และเพดานเวลาสูงสุดของกิจกรรม Subathon
            </p>

            <div className="timer-form-row">
              <div className="timer-form-group" style={{ flex: 1 }}>
                <label>เวลาเริ่มต้นนับถอยหลัง (นาที)</label>
                <input
                  type="number"
                  min="1"
                  value={Math.round(config.timer_initial_seconds / 60)}
                  onChange={e => {
                    const mins = Math.max(1, parseInt(e.target.value) || 60);
                    setConfig(prev => ({ ...prev, timer_initial_seconds: mins * 60 }));
                  }}
                />
              </div>
              <div className="timer-form-group" style={{ flex: 1 }}>
                <label>เพดานเวลาสูงสุด (Max Cap นาที, 0 = ไม่จำกัด)</label>
                <input
                  type="number"
                  min="0"
                  value={Math.round(config.timer_max_cap_seconds / 60)}
                  onChange={e => {
                    const mins = Math.max(0, parseInt(e.target.value) || 0);
                    setConfig(prev => ({ ...prev, timer_max_cap_seconds: mins * 60 }));
                  }}
                />
              </div>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '4px' }}>
              <span>
                เวลาเริ่มต้น: <strong>{Math.round(config.timer_initial_seconds / 60)} นาที</strong> ({Math.round(config.timer_initial_seconds / 3600)} ชม.)
              </span>
              <span>
                เพดานสูงสุด: <strong>{config.timer_max_cap_seconds > 0 ? `${Math.round(config.timer_max_cap_seconds / 3600)} ชม.` : 'ไม่จำกัด'}</strong>
              </span>
            </div>
          </div>

          {/* Simulation Test */}
          <div className="timer-card">
            <h2>
              <Send size={20} style={{ color: '#16a34a' }} />
              ทดสอบจำลองโดเนท (Simulate Test)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              ทดสอบว่ากฎคำนวณและแอนิเมชันป้ายลอยบนจอ OBS ทำงานถูกต้องโดยไม่ต้องโอนเงินจริง
            </p>

            <div className="timer-form-row">
              <div className="timer-form-group" style={{ flex: 1 }}>
                <label>ยอดเงินจำลอง (บาท)</label>
                <input
                  type="number"
                  min="1"
                  value={simAmount}
                  onChange={e => setSimAmount(e.target.value)}
                />
              </div>
              <div className="timer-form-group" style={{ flex: 1 }}>
                <label>ชื่อผู้บริจาค</label>
                <input
                  type="text"
                  value={simDonor}
                  onChange={e => setSimDonor(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="timer-btn timer-btn-success"
              onClick={handleSimulate}
              disabled={simulating}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {simulating ? 'กำลังทดสอบ…' : (
                <>
                  <Send size={16} /> ส่งยอดทดสอบขึ้นจอ OBS
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: RULES (กฎอัตราส่วน & กฎเฉพาะยอด Tier Rules)
          ========================================================================= */}
      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Base Rate Rule */}
          <div className="timer-card">
            <h2>
              <Sliders size={20} style={{ color: '#0284c7' }} />
              อัตราส่วนพื้นฐาน (Default Rate)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              คำนวณเวลาสำหรับยอดโดเนททั่วไปที่ไม่ได้เข้าเกณฑ์กฎพิเศษเฉพาะยอดเงิน
            </p>

            <div className="timer-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={config.timer_base_rate_enabled}
                  onChange={e => setConfig(prev => ({ ...prev, timer_base_rate_enabled: e.target.checked }))}
                />
                เปิดใช้งานการคำนวณตามอัตราส่วนพื้นฐาน
              </label>
            </div>

            {config.timer_base_rate_enabled && (
              <div className="timer-form-row">
                <div className="timer-form-group" style={{ flex: 1 }}>
                  <label>ทุก ๆ ยอดเงิน (บาท)</label>
                  <input
                    type="number"
                    min="1"
                    value={config.timer_base_rate_amount}
                    onChange={e => setConfig(prev => ({ ...prev, timer_base_rate_amount: Math.max(1, parseFloat(e.target.value) || 1) }))}
                  />
                </div>
                <div className="timer-form-group" style={{ flex: 1 }}>
                  <label>การกระทำ</label>
                  <select
                    value={config.timer_base_rate_action}
                    onChange={e => setConfig(prev => ({ ...prev, timer_base_rate_action: e.target.value as TimerAction }))}
                  >
                    <option value="add">➕ เพิ่มเวลา</option>
                    <option value="subtract">➖ ลบเวลา</option>
                  </select>
                </div>
                <div className="timer-form-group" style={{ flex: 1 }}>
                  <label>เวลา (วินาที)</label>
                  <input
                    type="number"
                    min="1"
                    value={config.timer_base_rate_seconds}
                    onChange={e => setConfig(prev => ({ ...prev, timer_base_rate_seconds: Math.max(1, parseInt(e.target.value) || 60) }))}
                  />
                </div>
              </div>
            )}
            <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
              สูตรปัจจุบัน: ทุก <strong>{config.timer_base_rate_amount}</strong> บาท จะ{config.timer_base_rate_action === 'add' ? 'เพิ่ม' : 'ลบ'}เวลา <strong>{Math.round(config.timer_base_rate_seconds / 60)}</strong> นาที ({config.timer_base_rate_seconds} วินาที)
            </div>
          </div>

          {/* Custom Tier Rules */}
          <div className="timer-card">
            <h2>
              <Zap size={20} style={{ color: '#d97706' }} />
              กฎพิเศษเฉพาะยอดเงิน (Custom Tier Rules)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              กำหนดยอดเงินเจาะจงให้มีผลตามต้องการ เช่น 50 บาท = ลบ 10 นาที (ระบบจะตรวจสอบกฎนี้ก่อนอัตราส่วนพื้นฐาน)
            </p>

            {config.timer_tier_rules.length > 0 ? (
              <div className="timer-table-wrapper">
                <table className="tier-rules-table">
                  <thead>
                    <tr>
                      <th>ยอดเงิน (฿)</th>
                      <th>การกระทำ</th>
                      <th>ระยะเวลา</th>
                      <th>คำอธิบาย</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.timer_tier_rules.map(rule => (
                      <tr key={rule.id}>
                        <td><strong>฿{rule.amount}</strong></td>
                        <td>
                          {rule.action === 'add' ? (
                            <span className="tier-badge-add" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ArrowUpRight size={14} /> เพิ่มเวลา
                            </span>
                          ) : (
                            <span className="tier-badge-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ArrowDownRight size={14} /> ลบเวลา
                            </span>
                          )}
                        </td>
                        <td>{Math.round(rule.seconds / 60)} นาที</td>
                        <td style={{ color: 'var(--text-muted, #64748b)' }}>{rule.label || '-'}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-rule-delete"
                            onClick={() => handleDeleteTierRule(rule.id)}
                            title="ลบกฎนี้"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: '4px 0' }}>
                ยังไม่มีกฎพิเศษเฉพาะยอดเงิน
              </p>
            )}

            {/* Add new rule form */}
            <div className="timer-subcard">
              <div className="timer-subcard-title">+ เพิ่มกฎพิเศษใหม่</div>
              <div className="timer-form-row">
                <div className="timer-form-group" style={{ flex: 1 }}>
                  <label>ยอดเงิน (฿)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="เช่น 50"
                    value={newRuleAmount}
                    onChange={e => setNewRuleAmount(e.target.value)}
                  />
                </div>
                <div className="timer-form-group" style={{ flex: 1 }}>
                  <label>การกระทำ</label>
                  <select
                    value={newRuleAction}
                    onChange={e => setNewRuleAction(e.target.value as TimerAction)}
                  >
                    <option value="subtract">➖ ลบเวลา</option>
                    <option value="add">➕ เพิ่มเวลา</option>
                  </select>
                </div>
                <div className="timer-form-group" style={{ flex: 1 }}>
                  <label>เวลา (นาที)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="เช่น 10"
                    value={newRuleMinutes}
                    onChange={e => setNewRuleMinutes(e.target.value)}
                  />
                </div>
              </div>
              <div className="timer-form-group" style={{ marginTop: '8px' }}>
                <label>ป้ายข้อความกำกับ (ไม่บังคับ)</label>
                <input
                  type="text"
                  placeholder="เช่น โดเนทแกล้งลบเวลา"
                  value={newRuleLabel}
                  onChange={e => setNewRuleLabel(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleAddTierRule}
                className="timer-btn timer-btn-secondary"
                style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
              >
                <Plus size={16} /> เพิ่มกฎนี้ลงในรายการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DESIGN STUDIO (หน้าตา ธีม & พรีวิวสด SIDE-BY-SIDE)
          ========================================================================= */}
      {activeTab === 'design' && (
        <div className="timer-design-layout">
          {/* Left Column: Design Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="timer-card">
              <h2>
                <Palette size={20} style={{ color: '#0284c7' }} />
                ธีม & รูปแบบการแสดงผล
              </h2>

              {/* Theme Picker */}
              <div className="timer-form-group">
                <label>เลือกธีมสำเร็จรูป</label>
                <div className="theme-picker-grid">
                  {[
                    { id: 'glass', name: 'Glassmorphism', desc: 'กระจกใสโมเดิร์น สไตล์หรูหรา' },
                    { id: 'neon', name: 'Neon Cyberpunk', desc: 'ขอบนีออนเรืองแสง ดิจิทัลล้ำยุค' },
                    { id: 'minimal', name: 'Minimal Clean', desc: 'เรียบง่าย ชัดเจน สบายตา' },
                    { id: 'retro', name: 'Retro Digital', desc: 'นาฬิกาไฟ LED ดิจิทัล' },
                  ].map(t => (
                    <div
                      key={t.id}
                      className={`theme-card ${config.timer_appearance.theme === t.id ? 'active' : ''}`}
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        timer_appearance: { ...prev.timer_appearance, theme: t.id as TimerTheme }
                      }))}
                    >
                      <div className="theme-card-title">{t.name}</div>
                      <div className="theme-card-desc">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Background Style Toggle */}
              <div className="timer-form-group">
                <label>การแสดงผลพื้นหลัง (Widget Background)</label>
                <div className="bg-toggle-grid">
                  <button
                    type="button"
                    className={`bg-toggle-btn ${config.timer_appearance.show_background !== false ? 'active' : ''}`}
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      timer_appearance: { ...prev.timer_appearance, show_background: true }
                    }))}
                  >
                    <span className="bg-toggle-icon">🖼️</span>
                    <div>
                      <div className="bg-toggle-title">มีพื้นหลังกล่อง (Card)</div>
                      <div className="bg-toggle-desc">แสดงสไตล์การ์ด มีสีพื้นหลัง กรอบ และเงาตามธีม</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`bg-toggle-btn ${config.timer_appearance.show_background === false ? 'active' : ''}`}
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      timer_appearance: { ...prev.timer_appearance, show_background: false }
                    }))}
                  >
                    <span className="bg-toggle-icon">✨</span>
                    <div>
                      <div className="bg-toggle-title">โปร่งใส ไร้พื้นหลัง (Transparent)</div>
                      <div className="bg-toggle-desc">ไม่มีกรอบกล่อง ตัวเลขลอยเด่น ไม่บังฉากเกมใน OBS</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Elements Visibility Toggles */}
              <div className="timer-form-row" style={{ gap: '16px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main, #334155)' }}>
                  <input
                    type="checkbox"
                    checked={config.timer_appearance.show_title !== false}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      timer_appearance: { ...prev.timer_appearance, show_title: e.target.checked }
                    }))}
                  />
                  แสดงหัวข้อไตเติล
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main, #334155)' }}>
                  <input
                    type="checkbox"
                    checked={config.timer_appearance.show_donor_badge !== false}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      timer_appearance: { ...prev.timer_appearance, show_donor_badge: e.target.checked }
                    }))}
                  />
                  แสดงแถบผู้บริจาคล่าสุด
                </label>
              </div>

              {/* Title Text */}
              <div className="timer-form-group">
                <label>ข้อความไตเติล (Title Text)</label>
                <input
                  type="text"
                  value={config.timer_appearance.title}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    timer_appearance: { ...prev.timer_appearance, title: e.target.value }
                  }))}
                />
              </div>

              {/* Font Family */}
              <div className="timer-form-group">
                <label>ฟอนต์ตัวอักษรและตัวเลข (Font Family)</label>
                <select
                  value={config.timer_appearance.font || 'LINESeedSansTH'}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    timer_appearance: { ...prev.timer_appearance, font: e.target.value }
                  }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border, #cbd5e1)',
                    fontSize: '13.5px',
                    background: 'var(--bg-panel, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontFamily: `'${config.timer_appearance.font || 'LINESeedSansTH'}', sans-serif`,
                    cursor: 'pointer'
                  }}
                >
                  <option value="LINESeedSansTH" style={{ fontFamily: 'LINESeedSansTH, sans-serif' }}>LINE Seed Sans TH (ปกติ)</option>
                  <option value="LINESeedSansTH-ExtraBold" style={{ fontFamily: 'LINESeedSansTH-ExtraBold, sans-serif' }}>LINE Seed Sans TH (หนาพิเศษ ExtraBold)</option>
                  <option value="Chakra Petch" style={{ fontFamily: 'Chakra Petch, sans-serif' }}>Chakra Petch (ไซไฟ / ดิจิทัลเกมมิ่ง)</option>
                  <option value="JetBrains Mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>JetBrains Mono (โมโนสเปซ / ดิจิทัลคลีน)</option>
                  <option value="Kanit" style={{ fontFamily: 'Kanit, sans-serif' }}>Kanit (คณิต - คมชัด ยอดนิยม)</option>
                  <option value="Prompt" style={{ fontFamily: 'Prompt, sans-serif' }}>Prompt (พร้อมท์ - เรียบหรู ทันสมัย)</option>
                  <option value="Mitr" style={{ fontFamily: 'Mitr, sans-serif' }}>Mitr (มิตร - โค้งมน สบายตา)</option>
                  <option value="Outfit" style={{ fontFamily: 'Outfit, sans-serif' }}>Outfit (เอาต์ฟิต - เรขาคณิต โมเดิร์น)</option>
                  <option value="Inter" style={{ fontFamily: 'Inter, sans-serif' }}>Inter (อินเตอร์ - มินิมอลสากล)</option>
                </select>
              </div>

              {/* Colors */}
              <div className="timer-form-row timer-form-row-colors">
                <div className="timer-form-group" style={{ flex: 1, opacity: config.timer_appearance.show_background === false ? 0.6 : 1 }}>
                  <label>สีพื้นหลัง {config.timer_appearance.show_background === false && '(ปิดอยู่)'}</label>
                  <input
                    type="color"
                    value={config.timer_appearance.bg_color}
                    disabled={config.timer_appearance.show_background === false}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      timer_appearance: { ...prev.timer_appearance, bg_color: e.target.value }
                    }))}
                    style={{ height: '38px', padding: '2px', cursor: config.timer_appearance.show_background === false ? 'not-allowed' : 'pointer' }}
                  />
                </div>
                <div className="timer-form-group" style={{ flex: 1 }}>
                  <label>สีตัวเลขเวลา</label>
                  <input
                    type="color"
                    value={config.timer_appearance.text_color}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      timer_appearance: { ...prev.timer_appearance, text_color: e.target.value }
                    }))}
                    style={{ height: '38px', padding: '2px', cursor: 'pointer' }}
                  />
                </div>
                <div className="timer-form-group" style={{ flex: 1 }}>
                  <label>สีไฮไลต์ (Accent)</label>
                  <input
                    type="color"
                    value={config.timer_appearance.accent_color}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      timer_appearance: { ...prev.timer_appearance, accent_color: e.target.value }
                    }))}
                    style={{ height: '38px', padding: '2px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Sliders: Digits Size & Box Opacity */}
              <div className="timer-form-row">
                <div className="timer-form-group" style={{ flex: 1 }}>
                  <label>ขนาดตัวเลขเวลา ({config.timer_appearance.digits_size}px)</label>
                  <input
                    type="range"
                    min="32"
                    max="96"
                    value={config.timer_appearance.digits_size}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      timer_appearance: { ...prev.timer_appearance, digits_size: parseInt(e.target.value) || 54 }
                    }))}
                  />
                </div>
                <div className="timer-form-group" style={{ flex: 1, opacity: config.timer_appearance.show_background === false ? 0.6 : 1 }}>
                  <label>ความโปร่งใสกล่อง {config.timer_appearance.show_background === false ? '(ปิดอยู่)' : `(${config.timer_appearance.opacity}%)`}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    disabled={config.timer_appearance.show_background === false}
                    value={config.timer_appearance.opacity}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      timer_appearance: { ...prev.timer_appearance, opacity: parseInt(e.target.value) || 90 }
                    }))}
                  />
                </div>
              </div>

              {/* Digits Text Shadow Sub-section */}
              <div className="timer-sub-section">
                <div className="timer-sub-section-title">
                  เงาของตัวเลขนับเวลา (Digits Text Shadow)
                </div>

                <div className="stroke-toggle-grid">
                  <button
                    type="button"
                    className={`stroke-toggle-btn ${config.timer_appearance.show_digits_shadow === false ? 'active' : ''}`}
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      timer_appearance: { ...prev.timer_appearance, show_digits_shadow: false }
                    }))}
                  >
                    ปิดเงาตัวเลข
                  </button>
                  <button
                    type="button"
                    className={`stroke-toggle-btn ${config.timer_appearance.show_digits_shadow !== false ? 'active' : ''}`}
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      timer_appearance: {
                        ...prev.timer_appearance,
                        show_digits_shadow: true,
                        digits_shadow_color: prev.timer_appearance.digits_shadow_color || '#000000',
                        digits_shadow_blur: prev.timer_appearance.digits_shadow_blur ?? 8,
                        digits_shadow_x: prev.timer_appearance.digits_shadow_x ?? 0,
                        digits_shadow_y: prev.timer_appearance.digits_shadow_y ?? 2
                      }
                    }))}
                  >
                    เปิดเงาตัวเลข
                  </button>
                </div>

                {config.timer_appearance.show_digits_shadow !== false && (
                  <div className="timer-subcard" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px' }}>
                    <div className="timer-form-group">
                      <label style={{ fontSize: '12.5px', color: 'var(--text-muted, #475569)' }}>พรีเซ็ตเงายอดนิยม</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setConfig(prev => ({
                            ...prev,
                            timer_appearance: {
                              ...prev.timer_appearance,
                              digits_shadow_x: 0,
                              digits_shadow_y: 3,
                              digits_shadow_blur: 8,
                              digits_shadow_color: '#000000'
                            }
                          }))}
                        >
                          เงาตกกระทบ (Drop)
                        </button>
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setConfig(prev => ({
                            ...prev,
                            timer_appearance: {
                              ...prev.timer_appearance,
                              digits_shadow_x: 0,
                              digits_shadow_y: 2,
                              digits_shadow_blur: 2,
                              digits_shadow_color: '#000000'
                            }
                          }))}
                        >
                          เงาคมชัด (Sharp)
                        </button>
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setConfig(prev => ({
                            ...prev,
                            timer_appearance: {
                              ...prev.timer_appearance,
                              digits_shadow_x: 0,
                              digits_shadow_y: 0,
                              digits_shadow_blur: 16,
                              digits_shadow_color: prev.timer_appearance.accent_color || '#38bdf8'
                            }
                          }))}
                        >
                          นีออนโกลว์ (Neon)
                        </button>
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setConfig(prev => ({
                            ...prev,
                            timer_appearance: {
                              ...prev.timer_appearance,
                              digits_shadow_x: 0,
                              digits_shadow_y: 0,
                              digits_shadow_blur: 25,
                              digits_shadow_color: prev.timer_appearance.accent_color || '#38bdf8'
                            }
                          }))}
                        >
                          เรืองแสงนุ่ม (Soft)
                        </button>
                      </div>
                    </div>

                    <div className="timer-form-group">
                      <label>กำหนดสีของเงา (Shadow Color)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <input
                          type="color"
                          value={config.timer_appearance.digits_shadow_color?.startsWith('#') ? config.timer_appearance.digits_shadow_color : '#000000'}
                          onChange={e => setConfig(prev => ({
                            ...prev,
                            timer_appearance: { ...prev.timer_appearance, digits_shadow_color: e.target.value }
                          }))}
                          style={{ width: '44px', height: '36px', padding: '2px', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={config.timer_appearance.digits_shadow_color || '#000000'}
                          onChange={e => setConfig(prev => ({
                            ...prev,
                            timer_appearance: { ...prev.timer_appearance, digits_shadow_color: e.target.value }
                          }))}
                          style={{ width: '110px', fontSize: '13px' }}
                        />
                        <div className="preset-colors-row">
                          {[
                            { color: '#000000', label: 'ดำ' },
                            { color: '#ffffff', label: 'ขาว' },
                            { color: config.timer_appearance.accent_color || '#38bdf8', label: 'สีธีม (Accent)' },
                            { color: '#ef4444', label: 'แดง' },
                            { color: '#eab308', label: 'ทอง' },
                            { color: '#22c55e', label: 'เขียว' },
                          ].map(c => (
                            <button
                              key={c.color + c.label}
                              type="button"
                              className={`preset-color-chip ${config.timer_appearance.digits_shadow_color === c.color ? 'active' : ''}`}
                              style={{ backgroundColor: c.color }}
                              onClick={() => setConfig(prev => ({
                                ...prev,
                                timer_appearance: { ...prev.timer_appearance, digits_shadow_color: c.color }
                              }))}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="timer-form-row">
                      <div className="timer-form-group" style={{ flex: 1 }}>
                        <label>ความฟุ้งเบลอ ({config.timer_appearance.digits_shadow_blur ?? 8}px)</label>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={config.timer_appearance.digits_shadow_blur ?? 8}
                          onChange={e => setConfig(prev => ({
                            ...prev,
                            timer_appearance: { ...prev.timer_appearance, digits_shadow_blur: parseInt(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                      <div className="timer-form-group" style={{ flex: 1 }}>
                        <label>ระยะห่างแนวตั้ง Y ({config.timer_appearance.digits_shadow_y ?? 2}px)</label>
                        <input
                          type="range"
                          min="-10"
                          max="20"
                          value={config.timer_appearance.digits_shadow_y ?? 2}
                          onChange={e => setConfig(prev => ({
                            ...prev,
                            timer_appearance: { ...prev.timer_appearance, digits_shadow_y: parseInt(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                      <div className="timer-form-group" style={{ flex: 1 }}>
                        <label>ระยะห่างแนวนอน X ({config.timer_appearance.digits_shadow_x ?? 0}px)</label>
                        <input
                          type="range"
                          min="-10"
                          max="10"
                          value={config.timer_appearance.digits_shadow_x ?? 0}
                          onChange={e => setConfig(prev => ({
                            ...prev,
                            timer_appearance: { ...prev.timer_appearance, digits_shadow_x: parseInt(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Beam & Digits Shine Sweep Sub-section */}
              <div className="timer-sub-section">
                <div className="timer-sub-section-title">
                  ลำแสงวิ่งกวาดการ์ดและตัวเลข (Beam & Shine Sweep)
                </div>

                <div className="timer-form-row" style={{ marginBottom: '12px' }}>
                  <div className="timer-form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px' }}>ลำแสงกวาดผ่านการ์ด</label>
                    <div className="stroke-toggle-grid">
                      <button
                        type="button"
                        className={`stroke-toggle-btn ${config.timer_appearance.timer_card_beam === false ? 'active' : ''}`}
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          timer_appearance: { ...prev.timer_appearance, timer_card_beam: false }
                        }))}
                      >
                        ปิดแสงการ์ด
                      </button>
                      <button
                        type="button"
                        className={`stroke-toggle-btn ${config.timer_appearance.timer_card_beam !== false ? 'active' : ''}`}
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          timer_appearance: { ...prev.timer_appearance, timer_card_beam: true }
                        }))}
                      >
                        เปิดแสงการ์ด
                      </button>
                    </div>
                  </div>

                  <div className="timer-form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px' }}>ลำแสงวิ่งผ่านตัวเลข</label>
                    <div className="stroke-toggle-grid">
                      <button
                        type="button"
                        className={`stroke-toggle-btn ${config.timer_appearance.timer_shine_sweep === false ? 'active' : ''}`}
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          timer_appearance: { ...prev.timer_appearance, timer_shine_sweep: false }
                        }))}
                      >
                        ปิดแสงตัวเลข
                      </button>
                      <button
                        type="button"
                        className={`stroke-toggle-btn ${config.timer_appearance.timer_shine_sweep !== false ? 'active' : ''}`}
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          timer_appearance: { ...prev.timer_appearance, timer_shine_sweep: true }
                        }))}
                      >
                        เปิดแสงตัวเลข
                      </button>
                    </div>
                  </div>
                </div>

                {config.timer_appearance.timer_shine_sweep !== false && (
                  <div className="timer-form-group" style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '12px' }}>โทนสีประกายแสงวิ่งตัวเลข</label>
                    <select
                      value={config.timer_appearance.timer_shine_theme || 'cyan'}
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        timer_appearance: {
                          ...prev.timer_appearance,
                          timer_shine_theme: e.target.value as 'crystal' | 'gold' | 'cyan'
                        }
                      }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid var(--border, #cbd5e1)', fontSize: '13px' }}
                    >
                      <option value="cyan">⚡ นีออนไซแอน (Cyber Cyan - แนะนำสำหรับ Timer)</option>
                      <option value="crystal">💎 คริสตัลประกายเพชร (Crystal Diamond)</option>
                      <option value="gold">🏆 ประกายทองพรีเมียม (Golden Glow)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Live Preview Studio */}
          <div className="timer-sticky-preview">
            <div className="timer-preview-card">
              <div className="timer-preview-card-header">
                <div className="timer-preview-card-title">
                  <Eye size={18} style={{ color: '#0284c7' }} />
                  พรีวิวสด (Live Studio Preview)
                </div>

                {/* Background Switcher for Preview */}
                <div className="timer-preview-bg-switcher">
                  <button
                    type="button"
                    className={`preview-bg-btn ${previewBg === 'checker' ? 'active' : ''}`}
                    onClick={() => setPreviewBg('checker')}
                    title="พื้นหลังลายหมากรุก (สำหรับดูความโปร่งใส)"
                  >
                    ลายหมากรุก
                  </button>
                  <button
                    type="button"
                    className={`preview-bg-btn ${previewBg === 'game' ? 'active' : ''}`}
                    onClick={() => setPreviewBg('game')}
                    title="พื้นหลังเกมมิ่งมืด (Dark Game)"
                  >
                    ฉากมืด
                  </button>
                  <button
                    type="button"
                    className={`preview-bg-btn ${previewBg === 'bright' ? 'active' : ''}`}
                    onClick={() => setPreviewBg('bright')}
                    title="พื้นหลังสว่าง (Bright Light)"
                  >
                    ฉากสว่าง
                  </button>
                </div>
              </div>

              {/* Preview Stage with Live Component */}
              <div className={`timer-preview-stage bg-${previewBg}`}>
                <div className="timer-card-wrapper">
                  <TimerCard
                    appearance={config.timer_appearance}
                    status={config.timer_status}
                    displaySeconds={liveSeconds}
                    latestDonor={{
                      name: simDonor.trim() || 'ผู้ชมใจดี',
                      delta: 300,
                      amount: parseFloat(simAmount) || 50
                    }}
                  />
                </div>
              </div>

              <div className="timer-preview-hint">
                ✨ พรีวิวเรนเดอร์แบบ 0ms เรียลไทม์ ตรงตามที่แสดงบน OBS 100%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: OBS OVERLAY SOURCE (ลิงก์เบราว์เซอร์ซอร์ส & คำแนะนำ)
          ========================================================================= */}
      {activeTab === 'obs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="timer-card">
            <h2>
              <Tv size={20} style={{ color: '#0284c7' }} />
              ลิงก์สำหรับ OBS Browser Source
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              คัดลอก URL ด้านล่างไปใส่ใน OBS Studio ผ่านการเพิ่ม Source แบบ <strong>Browser</strong>
            </p>

            {/* Standard Saved Link */}
            <div className="timer-form-group">
              <label>ลิงก์หลักตามค่าที่บันทึกไว้ ({config.timer_appearance.show_background !== false ? 'โหมดมีพื้นหลัง' : 'โหมดโปร่งใสไร้พื้นหลัง'})</label>
              <div className="timer-source-box">
                <input
                  readOnly
                  value={`${origin}/overlay/timer`}
                  onFocus={e => e.target.select()}
                />
                <button
                  type="button"
                  className="timer-btn timer-btn-secondary"
                  onClick={() => copyObsLink(`${origin}/overlay/timer`)}
                >
                  {copiedUrl === `${origin}/overlay/timer` ? (
                    <>
                      <CheckCircle2 size={16} style={{ color: '#16a34a' }} /> คัดลอกแล้ว
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> คัดลอก
                    </>
                  )}
                </button>
                <a
                  href="/overlay/timer"
                  target="_blank"
                  rel="noreferrer"
                  className="timer-btn timer-btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={16} /> เปิด
                </a>
              </div>
            </div>

            {/* Force Transparent Link */}
            <div className="timer-form-group" style={{ marginTop: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                ลิงก์บังคับโปร่งใสไร้พื้นหลังโดยเฉพาะ (ต่อท้าย <code className="timer-code-badge">?bg=0</code> ไม่บังหน้าจอเกม):
              </label>
              <div className="timer-source-box">
                <input
                  readOnly
                  value={`${origin}/overlay/timer?bg=0`}
                  onFocus={e => e.target.select()}
                />
                <button
                  type="button"
                  className="timer-btn timer-btn-secondary"
                  onClick={() => copyObsLink(`${origin}/overlay/timer?bg=0`)}
                >
                  {copiedUrl === `${origin}/overlay/timer?bg=0` ? (
                    <>
                      <CheckCircle2 size={16} style={{ color: '#16a34a' }} /> คัดลอกแล้ว
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> คัดลอก
                    </>
                  )}
                </button>
                <a
                  href="/overlay/timer?bg=0"
                  target="_blank"
                  rel="noreferrer"
                  className="timer-btn timer-btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={16} /> เปิด
                </a>
              </div>
            </div>
          </div>

          {/* OBS Setup Best Practices Guide */}
          <div className="timer-card">
            <h2>
              <Layers size={20} style={{ color: '#0284c7' }} />
              คำแนะนำการตั้งค่าใน OBS Studio
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '4px' }}>
              <div className="timer-subcard">
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', marginBottom: '4px' }}>ความกว้าง (Width)</div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>520 px</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                  ครอบคลุมตัวเลขเวลาและป้ายผู้บริจาค
                </div>
              </div>

              <div className="timer-subcard">
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', marginBottom: '4px' }}>ความสูง (Height)</div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>180 px</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
                  ความสูงมาตรฐาน ไม่กินพื้นที่ฉาก
                </div>
              </div>

              <div className="timer-subcard">
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', marginBottom: '4px' }}>Custom CSS</div>
                <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#64748b', marginTop: '4px' }}>
                  body &#123; background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; &#125;
                </div>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', marginTop: '12px', lineHeight: 1.6 }}>
              💡 <strong>ข้อแนะนำ:</strong> ติ๊กเลือก <em>"Shutdown source when not visible"</em> (ปิดใช้งานเมื่อมองไม่เห็น) เพื่อช่วยประหยัด CPU ของคอมพิวเตอร์ขณะสตรีมเกม
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
