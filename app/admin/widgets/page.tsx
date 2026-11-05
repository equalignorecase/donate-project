'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, Trophy, ExternalLink, Eye, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { GoalAppearance, goalAppearanceDefaults, readGoalAppearance } from '@/lib/goalAppearance';
import { SupporterAppearance, supporterDefaults, readSupporterAppearance, SupporterMode, supporterModes } from '@/lib/supporterAppearance';
import GoalAppearanceEditor from './GoalAppearanceEditor';
import SupporterAppearanceEditor from './SupporterAppearanceEditor';
import GoalWidget from '@/app/overlay/goal/GoalWidget';
import SupporterWidget from '@/app/overlay/supporters/SupporterWidget';
import { WidgetData } from '@/lib/widgets';
import { playGoalFanfare } from '@/lib/goalAudio';
import { supabase } from '@/lib/supabaseClient';
import '@/app/overlay/widgets.css';
import './widgets-admin.css';

export default function WidgetsAdmin() {
  const { showToast, handleUnauthorized } = useAdmin();
  const [section, setSection] = useState<'goal' | 'supporters'>('goal');
  const [title, setTitle] = useState('เป้าหมายโดเนท');
  const [target, setTarget] = useState('15000');
  const [startedAt, setStartedAt] = useState('');
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState<'goal' | 'supporters' | null>(null);
  const [errors, setErrors] = useState({ goal: '', supporters: '' });
  const [appearance, setAppearance] = useState<GoalAppearance>({ ...goalAppearanceDefaults });
  const [supporters, setSupporters] = useState<SupporterAppearance>({ ...supporterDefaults });
  const [savedGoal, setSavedGoal] = useState<GoalAppearance>({ ...goalAppearanceDefaults });
  const [savedSupporters, setSavedSupporters] = useState<SupporterAppearance>({ ...supporterDefaults });
  const [widgetData, setWidgetData] = useState<WidgetData | null>(null);
  const [previewBg, setPreviewBg] = useState<'checker' | 'game' | 'bright'>('checker');
  const [previewPercentOverride, setPreviewPercentOverride] = useState<number | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    let active = true;
    fetch('/api/admin/settings').then(async response => {
      if (response.status === 401) { handleUnauthorized(); throw new Error('กรุณาเข้าสู่ระบบ'); }
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error('โหลดการตั้งค่าไม่สำเร็จ');
      if (active) {
        const goal = readGoalAppearance(result.settings);
        const supporter = readSupporterAppearance(result.settings);
        setAppearance(goal); setSavedGoal(goal); setSupporters(supporter); setSavedSupporters(supporter);
        setTitle(result.settings.goal_title || 'เป้าหมายโดเนท');
        setTarget(result.settings.goal_target || '15000');
        setStartedAt(result.settings.goal_started_at || '');
      }
    }).catch(error => { if (active) setLoadError(error.message); }).finally(() => { if (active) setLoading(false); });

    fetch('/api/widgets', { cache: 'no-store' })
      .then(res => res.json())
      .then(res => { if (active && res.success) setWidgetData(res.data); })
      .catch(err => console.warn('Widget data load error:', err));

    return () => { active = false; };
  }, [handleUnauthorized]);

  const save = async (event: React.FormEvent, kind: 'goal' | 'supporters') => {
    event.preventDefault();
    if (loading || loadError || saving) return;
    setSaving(kind); setErrors(previous => ({ ...previous, [kind]: '' }));
    const payload = kind === 'goal' ? { goal_title: title.trim(), goal_target: target, goal_started_at: startedAt, ...appearance } : { ...supporters };
    try {
      const response = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (response.status === 401) { handleUnauthorized(); return; }
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'บันทึกไม่สำเร็จ');
      if (kind === 'goal') setSavedGoal(readGoalAppearance(result.settings));
      else setSavedSupporters(readSupporterAppearance(result.settings));
      showToast(kind === 'goal' ? 'บันทึกเป้าหมายโดเนทแล้ว' : 'บันทึกอันดับผู้โดเนทแล้ว');
      fetch('/api/widgets', { cache: 'no-store' })
        .then(res => res.json())
        .then(res => { if (res.success) setWidgetData(res.data); })
        .catch(() => {});
    } catch (error) { setErrors(previous => ({ ...previous, [kind]: error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ' })); }
    finally { setSaving(null); }
  };

  const getStartOfMonthIso = () => {
    const now = new Date();
    const bkkStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit'
    }).format(now);
    const [year, month] = bkkStr.split('-');
    return new Date(`${year}-${month}-01T00:00:00+07:00`).toISOString();
  };

  const disabled = loading || !!loadError || saving !== null;
  const supporterHeight = Number(savedSupporters.supporter_padding) * 2 + (savedSupporters.supporter_show_title === 'true' ? Number(savedSupporters.supporter_title_size) * 2 : 0) + Number(savedSupporters.supporter_limit) * (Math.max(Number(savedSupporters.supporter_name_size), Number(savedSupporters.supporter_amount_size), 30) * 2 + 28 + Number(savedSupporters.supporter_row_gap)) + 40;

  const goalTargetNumber = Number(target) > 0 ? Number(target) : 15000;
  const realCurrent = widgetData?.goal.current ?? 0;
  const isGoalSample = realCurrent <= 0 && previewPercentOverride === null;
  const goalCurrentDisplay = previewPercentOverride !== null
    ? Math.round((goalTargetNumber * previewPercentOverride) / 100)
    : (isGoalSample ? Math.round(goalTargetNumber * 0.5) : realCurrent);

  const triggerLivePreviewBlast = () => {
    if (appearance.goal_overcharge_sound !== 'false') {
      playGoalFanfare();
    }
    try {
      supabase.channel('goal-overcharge-events').send({
        type: 'broadcast',
        event: 'test_burst',
        payload: { timestamp: Date.now() }
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const activeMode: SupporterMode = (supporters.supporter_mode === 'recent' || supporters.supporter_mode === 'daily' || supporters.supporter_mode === 'monthly' || supporters.supporter_mode === 'allTime') ? supporters.supporter_mode : 'allTime';
  const realDonors = widgetData ? (widgetData[activeMode] || []) : [];
  const hasRealDonors = realDonors.length > 0;
  const sampleDonors = [
    { name: 'Somchai TopDonator', amount: 2500 },
    { name: 'Somsri Supporter', amount: 1200 },
    { name: 'Anon StreamLover', amount: 500 },
    { name: 'Kittisak Fan', amount: 300 },
    { name: 'Nicha Gamer', amount: 150 }
  ];
  const displayDonors = hasRealDonors ? realDonors : sampleDonors;

  const renderSidebarLink = (label: string, path: string) => (
    <div className="widget-source-card-item" key={path}>
      <div className="widget-source-card-label">
        <span>{label}</span>
        <a href={path} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
          <span>เปิด</span>
          <ExternalLink size={11} />
        </a>
      </div>
      <div className="widget-source-card-row">
        <input
          aria-label={`ลิงก์ ${label}`}
          value={`${origin}${path}`}
          readOnly
          onFocus={event => event.target.select()}
        />
        <button
          className="widget-button widget-button-copy"
          type="button"
          style={{ minHeight: '34px', padding: '6px 18px', fontSize: '12.5px', borderRadius: '9999px', whiteSpace: 'nowrap', flexShrink: 0 }}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`${origin}${path}`);
              showToast(`คัดลอกลิงก์ ${label} แล้ว`);
            } catch {
              showToast('กรุณาเลือกและคัดลอกลิงก์ในช่อง');
            }
          }}
        >
          คัดลอก
        </button>
      </div>
    </div>
  );

  return (
    <div className="widgets-admin">
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>วิดเจ็ต OBS</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            ปรับแต่งดีไซน์เป้าหมายและอันดับผู้โดเนท พร้อมรับลิงก์สำหรับใส่ใน OBS Studio
          </p>
        </div>

        <div className="widget-tabs" role="tablist" aria-label="เลือกวิดเจ็ต" style={{ margin: 0 }}>
          <Link
            href="/admin/widgets/templates"
            className="widget-tab"
            style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(168, 85, 247, 0.15))',
              borderColor: 'var(--primary)',
              color: 'var(--text-main)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="เปิดคลังดีไซน์กว่า 17+ แบบ"
          >
            <Sparkles size={16} color="var(--accent)" />
            <span>คลังเทมเพลตดีไซน์</span>
            <span style={{ fontSize: '10px', background: 'var(--primary)', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>17+</span>
          </Link>
          <button
            id="goal-tab"
            role="tab"
            type="button"
            aria-selected={section === 'goal'}
            aria-controls="goal-panel"
            className={`widget-tab${section === 'goal' ? ' active' : ''}`}
            onClick={() => setSection('goal')}
          >
            <Target size={18} aria-hidden="true" />
            <span>เป้าหมายโดเนท</span>
          </button>
          <button
            id="supporters-tab"
            role="tab"
            type="button"
            aria-selected={section === 'supporters'}
            aria-controls="supporters-panel"
            className={`widget-tab${section === 'supporters' ? ' active' : ''}`}
            onClick={() => setSection('supporters')}
          >
            <Trophy size={18} aria-hidden="true" />
            <span>อันดับผู้โดเนท</span>
          </button>
        </div>
      </div>

      {loadError && <p role="alert" className="widget-error">{loadError}</p>}

      {/* ================= SECTION 1: GOAL ================= */}
      <section id="goal-panel" role="tabpanel" aria-labelledby="goal-tab" hidden={section !== 'goal'}>
        <div className="widgets-layout-grid">
          {/* Left Column: Form & Design Editor */}
          <div className="widgets-main-col">
            <form id="goal-form" onSubmit={event => void save(event, 'goal')}>
              {errors.goal && <p role="alert" className="widget-error">{errors.goal}</p>}

              <div className="widget-settings" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>ข้อมูลเป้าหมาย</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <label style={{ margin: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>ชื่อเป้าหมาย</span>
                    <input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} required disabled={disabled} />
                  </label>
                  <label style={{ margin: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>ยอดเป้าหมาย (บาท)</span>
                    <input type="number" min="0.01" max="9999999999" step="0.01" value={target} onChange={event => setTarget(event.target.value)} required disabled={disabled} />
                  </label>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    {startedAt ? `กำลังนับยอดตั้งแต่: ${new Date(startedAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}` : 'สถานะ: นับยอดบริจาคที่ตรวจสอบแล้วทั้งหมด'}
                  </div>
                  <div className="widget-actions">
                    <button className="widget-button widget-button-month" type="button" disabled={disabled} onClick={() => setStartedAt(getStartOfMonthIso())}>
                      นับยอดเดือนนี้
                    </button>
                    <button className="widget-button widget-button-reset" type="button" disabled={disabled} onClick={() => setStartedAt(new Date().toISOString())}>
                      เริ่มนับเป้าหมายใหม่
                    </button>
                    <button className="widget-button widget-button-total" type="button" disabled={disabled} onClick={() => setStartedAt('')}>
                      นับยอดทั้งหมด
                    </button>
                  </div>
                </div>
              </div>

              <GoalAppearanceEditor value={appearance} onChange={setAppearance} disabled={disabled} title={title} target={Number(target)} />
            </form>
          </div>

          {/* Right Column: Sticky Sidebar with Links & Live Output Preview */}
          <aside className="widgets-side-col">
            <div className="widgets-sticky-sidebar">
              {/* Quick Save Card */}
              <div className="widget-sidebar-card">
                <button
                  className="widget-button widget-button-save"
                  type="submit"
                  form="goal-form"
                  disabled={disabled}
                  style={{ width: '100%', minHeight: '46px', fontSize: '15px' }}
                >
                  {saving === 'goal' ? 'กำลังบันทึก…' : 'บันทึกเป้าหมายโดเนท'}
                </button>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                  บันทึกแล้ว OBS จะใช้รูปแบบนี้ทันที
                </div>
              </div>

              {/* OBS Browser Source Links Card */}
              <div className="widget-sidebar-card">
                <div className="widget-sidebar-card-header">
                  <div className="widget-sidebar-card-title">
                    <ExternalLink size={16} />
                    <span>ลิงก์สำหรับ OBS Browser Source</span>
                  </div>
                  <span className="brand-badge">
                    {savedGoal.goal_width} px
                  </span>
                </div>

                {renderSidebarLink('หลอดเป้าหมาย', '/overlay/goal')}

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.5 }}>
                  💡 <strong>ตั้งค่าใน OBS:</strong> Width = <strong>{savedGoal.goal_width}</strong> px และปรับความสูงให้พอดีกับชื่อเป้าหมาย
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="widget-sidebar-card">
                <div className="widget-sidebar-card-header">
                  <div className="widget-sidebar-card-title">
                    <Eye size={16} />
                    <span>Live Preview (สดทันที)</span>
                  </div>
                  <div className="preview-bg-switch">
                    <button
                      type="button"
                      className={`preview-bg-pill ${previewBg === 'checker' ? 'active' : ''}`}
                      onClick={() => setPreviewBg('checker')}
                      title="พื้นหลังโปร่งใส Checker"
                    >
                      Checker
                    </button>
                    <button
                      type="button"
                      className={`preview-bg-pill ${previewBg === 'game' ? 'active' : ''}`}
                      onClick={() => setPreviewBg('game')}
                      title="พื้นหลังมืด Dark"
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      className={`preview-bg-pill ${previewBg === 'bright' ? 'active' : ''}`}
                      onClick={() => setPreviewBg('bright')}
                      title="พื้นหลังสว่าง Light"
                    >
                      Light
                    </button>
                  </div>
                </div>

                {/* Quick Simulation Bar for Goal */}
                {section === 'goal' && (
                  <div className="preview-sim-bar">
                    <div className="preview-sim-presets">
                      <button
                        type="button"
                        className={`preview-sim-pill ${previewPercentOverride === 50 || (previewPercentOverride === null && isGoalSample) ? 'active' : ''}`}
                        onClick={() => setPreviewPercentOverride(50)}
                        title="จำลอง 50%"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        className={`preview-sim-pill ${previewPercentOverride === 75 ? 'active' : ''}`}
                        onClick={() => setPreviewPercentOverride(75)}
                        title="จำลอง 75%"
                      >
                        75%
                      </button>
                      <button
                        type="button"
                        className={`preview-sim-pill preview-sim-100 ${previewPercentOverride === 100 ? 'active' : ''}`}
                        onClick={() => setPreviewPercentOverride(100)}
                        title="ครบเป้าหมาย 100% (จุดชนวนระเบิด Supernova และเปิด Overcharge)"
                      >
                        🎉 100%
                      </button>
                      <button
                        type="button"
                        className={`preview-sim-pill preview-sim-overcharge ${previewPercentOverride === 120 ? 'active' : ''}`}
                        onClick={() => setPreviewPercentOverride(120)}
                        title="ยอดเกิน 120% (แสดงพลังงาน Overcharge เต็มพิกัด)"
                      >
                        ⚡ 120%
                      </button>
                      {realCurrent > 0 && (
                        <button
                          type="button"
                          className={`preview-sim-pill ${previewPercentOverride === null ? 'active' : ''}`}
                          onClick={() => setPreviewPercentOverride(null)}
                          title="กลับมาใช้ยอดจริงจากระบบ"
                        >
                          ยอดจริง
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="preview-blast-trigger-btn"
                      onClick={triggerLivePreviewBlast}
                      title="ยิงระเบิด Supernova Blast ทันที (พร้อมเสียง Fanfare ชัยชนะ)"
                    >
                      <Zap size={12} />
                      <span>ยิงระเบิด</span>
                    </button>
                  </div>
                )}

                <div className={`widget-preview-frame bg-${previewBg}`}>
                  <div className="widget-preview-content">
                    {section === 'goal' && (
                      <GoalWidget
                        title={title.trim() || 'เป้าหมายโดเนท'}
                        target={goalTargetNumber}
                        current={goalCurrentDisplay}
                        appearance={appearance}
                      />
                    )}
                  </div>
                </div>

                {previewPercentOverride !== null ? (
                  <div className="preview-sample-notice preview-notice-sim">
                    <Zap size={13} style={{ color: '#f59e0b' }} />
                    <span>จำลอง {previewPercentOverride}% (฿{goalCurrentDisplay.toLocaleString()})</span>
                    <button
                      type="button"
                      className="preview-reset-override-btn"
                      onClick={() => setPreviewPercentOverride(null)}
                      title="คืนค่ายอดจริง"
                    >
                      รีเซ็ต
                    </button>
                  </div>
                ) : isGoalSample ? (
                  <div className="preview-sample-notice">
                    <Sparkles size={13} style={{ color: 'var(--accent)' }} />
                    <span>จำลองยอด 50% อัตโนมัติ (ยังไม่มีผู้โดเนทจริง)</span>
                  </div>
                ) : (
                  <div className="preview-sample-notice preview-notice-real">
                    <span className="preview-live-dot" />
                    <span>ยอดจริง: ฿{realCurrent.toLocaleString()} / ฿{goalTargetNumber.toLocaleString()} ({((realCurrent / goalTargetNumber) * 100).toFixed(0)}%)</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ================= SECTION 2: SUPPORTERS ================= */}
      <section id="supporters-panel" role="tabpanel" aria-labelledby="supporters-tab" hidden={section !== 'supporters'}>
        <div className="widgets-layout-grid">
          {/* Left Column: Form & Design Editor */}
          <div className="widgets-main-col">
            <form id="supporters-form" onSubmit={event => void save(event, 'supporters')}>
              {errors.supporters && <p role="alert" className="widget-error">{errors.supporters}</p>}
              <SupporterAppearanceEditor
                value={supporters}
                onChange={setSupporters}
                disabled={disabled}
                allTimeDonors={widgetData?.allTime}
              />
            </form>
          </div>

          {/* Right Column: Sticky Sidebar with Links & Live Output Preview */}
          <aside className="widgets-side-col">
            <div className="widgets-sticky-sidebar">
              {/* Quick Save Card */}
              <div className="widget-sidebar-card">
                <button
                  className="widget-button widget-button-save"
                  type="submit"
                  form="supporters-form"
                  disabled={disabled}
                  style={{ width: '100%', minHeight: '46px', fontSize: '15px' }}
                >
                  {saving === 'supporters' ? 'กำลังบันทึก…' : 'บันทึกอันดับผู้โดเนท'}
                </button>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                  นับเฉพาะรายการที่ตรวจสอบสลิปผ่านแล้ว
                </div>
              </div>

              {/* OBS Browser Source Links Card */}
              <div className="widget-sidebar-card">
                <div className="widget-sidebar-card-header">
                  <div className="widget-sidebar-card-title">
                    <ExternalLink size={16} />
                    <span>ลิงก์สำหรับ OBS Browser Source</span>
                  </div>
                  <span className="brand-badge">
                    {savedSupporters.supporter_width} px
                  </span>
                </div>

                {renderSidebarLink('โหมดที่ตั้งค่าไว้', '/overlay/supporters')}
                {renderSidebarLink('ผู้สนับสนุนล่าสุด', '/overlay/supporters?mode=recent')}
                {renderSidebarLink('อันดับวันนี้', '/overlay/supporters?mode=daily')}
                {renderSidebarLink('อันดับเดือนนี้', '/overlay/supporters?mode=monthly')}
                {renderSidebarLink('อันดับตลอดเวลา', '/overlay/supporters?mode=allTime')}

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.5 }}>
                  💡 <strong>ตั้งค่าใน OBS:</strong> Width = <strong>{savedSupporters.supporter_width}</strong> px, Height = <strong>{Math.ceil(supporterHeight)}</strong> px
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="widget-sidebar-card">
                <div className="widget-sidebar-card-header">
                  <div className="widget-sidebar-card-title">
                    <Eye size={16} />
                    <span>Live Preview (สดทันที)</span>
                  </div>
                  <div className="preview-bg-switch">
                    <button
                      type="button"
                      className={`preview-bg-pill ${previewBg === 'checker' ? 'active' : ''}`}
                      onClick={() => setPreviewBg('checker')}
                      title="พื้นหลังโปร่งใส Checker"
                    >
                      Checker
                    </button>
                    <button
                      type="button"
                      className={`preview-bg-pill ${previewBg === 'game' ? 'active' : ''}`}
                      onClick={() => setPreviewBg('game')}
                      title="พื้นหลังมืด Dark"
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      className={`preview-bg-pill ${previewBg === 'bright' ? 'active' : ''}`}
                      onClick={() => setPreviewBg('bright')}
                      title="พื้นหลังสว่าง Light"
                    >
                      Light
                    </button>
                  </div>
                </div>

                {section === 'supporters' && (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {(Object.entries(supporterModes) as [SupporterMode, string][]).map(([modeKey, label]) => {
                      const isActive = supporters.supporter_mode === modeKey;
                      return (
                        <button
                          key={modeKey}
                          type="button"
                          className={`preview-bg-pill ${isActive ? 'active' : ''}`}
                          onClick={() => setSupporters(prev => ({ ...prev, supporter_mode: modeKey }))}
                          style={{
                            fontSize: '11.5px',
                            padding: '4px 10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {modeKey === 'allTime' && <Trophy size={11} />}
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className={`widget-preview-frame bg-${previewBg}`}>
                  <div className="widget-preview-content">
                    {section === 'supporters' && (
                      <SupporterWidget
                        donors={displayDonors}
                        appearance={supporters}
                        mode={activeMode}
                      />
                    )}
                  </div>
                </div>

                {!hasRealDonors && (
                  <div className="preview-sample-notice">
                    <Sparkles size={13} style={{ color: 'var(--accent)' }} />
                    <span>แสดงรายชื่อตัวอย่างเพื่อให้เห็นโพเดียมและเอฟเฟกต์สด</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
