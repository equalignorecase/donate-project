'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Gamepad2, 
  ExternalLink, 
  Copy, 
  Check, 
  RotateCcw, 
  RefreshCw, 
  Sparkles, 
  Sliders, 
  Eye, 
  ShieldCheck, 
  Key, 
  Flame,
  Layers,
  Palette
} from 'lucide-react';
import { useAdmin } from '../AdminContext';
import ValorantCard from '@/app/overlay/valorant/ValorantCard';
import { ValorantSettings, ValorantRankData } from '@/lib/types/valorant';
import { valorantDefaults, valorantThemes, regionOptions, readValorantSettings } from '@/lib/valorantSettings';
import './valorant-admin.css';

export default function ValorantAdminPage() {
  const { showToast, handleUnauthorized } = useAdmin();

  // Settings State
  const [settings, setSettings] = useState<ValorantSettings>({ ...valorantDefaults });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [resettingSession, setResettingSession] = useState<boolean>(false);
  
  // Test connection feedback
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Live preview rank data (defaults to nice demo mock until connected)
  const [previewData, setPreviewData] = useState<ValorantRankData>({
    name: 'Player',
    tag: '1234',
    currenttierpatched: 'Ascendant 2',
    currenttier: 21,
    ranking_in_tier: 17,
    elo: 1817,
    images: {
      small: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/21/smallicon.png',
      large: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/21/largeicon.png',
    },
    wins: 4,
    losses: 0,
    last_match_change: 18,
    updated_at: new Date().toISOString(),
  });

  const [previewBg, setPreviewBg] = useState<'checker' | 'game' | 'bright'>('game');
  const [copied, setCopied] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    setOrigin(window.location.origin);

    // Fetch existing settings
    fetch('/api/admin/settings')
      .then(async (res) => {
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        const data = await res.json();
        if (res.ok && data.success && data.settings) {
          const loaded = readValorantSettings(data.settings);
          setSettings(loaded);

          // If riot credentials already configured, fetch initial real rank
          if (loaded.valorant_name && loaded.valorant_tag && loaded.valorant_api_key) {
            void fetchLiveRank();
          }
        }
      })
      .catch((err) => {
        console.warn('Load settings error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [handleUnauthorized]);

  const fetchLiveRank = async () => {
    try {
      const res = await fetch('/api/valorant', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setPreviewData(json.data);
      }
    } catch (e) {}
  };

  const handleInputChange = (field: keyof ValorantSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: keyof ValorantSettings) => {
    setSettings(prev => ({
      ...prev,
      [field]: prev[field] === 'true' ? 'false' : 'true',
    }));
  };

  const handleApplyPreset = (themeName: 'classic' | 'neon' | 'glass' | 'minimal') => {
    const preset = valorantThemes[themeName];
    if (preset) {
      setSettings(prev => ({
        ...prev,
        ...preset,
      }));
      showToast(`เปลี่ยนธีมเป็น "${themeName.toUpperCase()}" เรียบร้อย`);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.valorant_name.trim() || !settings.valorant_tag.trim()) {
      showToast('กรุณากรอก Riot Name และ Tag ก่อน');
      return;
    }
    if (!settings.valorant_api_key.trim()) {
      showToast('กรุณากรอก HenrikDev API Key ก่อน');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const query = new URLSearchParams({
        test: 'true',
        name: settings.valorant_name.trim(),
        tag: settings.valorant_tag.trim(),
        region: settings.valorant_region || 'ap',
        apiKey: settings.valorant_api_key.trim(),
      });

      const res = await fetch(`/api/valorant?${query.toString()}`);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setPreviewData(json.data);
        setTestResult({
          success: true,
          message: `เชื่อมต่อสำเร็จ! พบผู้เล่น: ${json.data.name}#${json.data.tag} (${json.data.currenttierpatched} - ${json.data.ranking_in_tier}RR)`,
        });
        showToast('เชื่อมต่อ HenrikDev สำเร็จ ดึงข้อมูลเรียบร้อย!');
      } else {
        setTestResult({
          success: false,
          message: json.message || 'ไม่สามารถเชื่อมต่อได้ ตรวจสอบชื่อ/แท็ก หรือ API Key อีกครั้ง',
        });
        showToast('เชื่อมต่อไม่สำเร็จ: ' + (json.message || 'Error'));
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'เครือข่ายขัดข้อง',
      });
      showToast('ทดสอบไม่สำเร็จ: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleResetSession = async () => {
    if (!confirm('ต้องการรีเซ็ตสถิติ Win/Loss เริ่มนับ 0/0 ใหม่สำหรับสตรีมนี้หรือไม่?')) {
      return;
    }

    setResettingSession(true);
    try {
      const res = await fetch('/api/admin/valorant/reset-session', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        setSettings(prev => ({ ...prev, valorant_session_reset_at: json.reset_at }));
        setPreviewData(prev => ({ ...prev, wins: 0, losses: 0 }));
        showToast('รีเซ็ตสถิติเริ่มนับใหม่เรียบร้อยแล้ว');
      } else {
        showToast('รีเซ็ตไม่สำเร็จ: ' + (json.message || 'Error'));
      }
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setResettingSession(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast('บันทึกการตั้งค่า Valorant เรียบร้อยแล้ว!');
      } else {
        showToast('บันทึกไม่สำเร็จ: ' + (json.message || 'Error'));
      }
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const obsUrl = `${origin}/overlay/valorant`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(obsUrl);
    setCopied(true);
    showToast('คัดลอกลิงก์ OBS เรียบร้อยแล้ว!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="val-admin-container">
      {/* Top Header */}
      <div className="val-admin-header">
        <div className="val-admin-title-area">
          <div className="val-admin-icon">
            <Gamepad2 size={24} />
          </div>
          <div>
            <h1 className="val-admin-title">Valorant Rank Overlay</h1>
            <p className="val-admin-subtitle">
              แสดงยศและสถิติการเล่นสดบน OBS (ขับเคลื่อนด้วย HenrikDev API)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className="val-btn-primary"
            onClick={() => handleSave()}
            disabled={saving}
          >
            {saving ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="val-admin-grid">
        {/* Left Column: Form & Configuration */}
        <div className="val-main-col">
          {/* Card 1: Account & Credentials */}
          <div className="val-card">
            <div className="val-card-header">
              <span className="val-card-title">
                <Key size={18} color="var(--primary, #7C3AED)" />
                บัญชี Valorant & HenrikDev API Key
              </span>
            </div>

            <div className="val-form-grid">
              <div className="val-form-group">
                <label className="val-label">Riot Nickname</label>
                <input 
                  type="text" 
                  className="val-input"
                  placeholder="เช่น cannabiz" 
                  value={settings.valorant_name}
                  onChange={(e) => handleInputChange('valorant_name', e.target.value)}
                />
              </div>

              <div className="val-form-group">
                <label className="val-label">Tag ID (หลังเครื่องหมาย #)</label>
                <input 
                  type="text" 
                  className="val-input"
                  placeholder="เช่น 9999 หรือ TH1" 
                  value={settings.valorant_tag}
                  onChange={(e) => handleInputChange('valorant_tag', e.target.value)}
                />
              </div>

              <div className="val-form-group">
                <label className="val-label">Region (เซิร์ฟเวอร์)</label>
                <select 
                  className="val-select"
                  value={settings.valorant_region}
                  onChange={(e) => handleInputChange('valorant_region', e.target.value)}
                >
                  {regionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="val-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="val-label">HenrikDev API Key (ขึ้นต้นด้วย HDEV-...)</label>
                <input 
                  type="password" 
                  className="val-input"
                  placeholder="HDEV-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
                  value={settings.valorant_api_key}
                  onChange={(e) => handleInputChange('valorant_api_key', e.target.value)}
                />
                <span className="val-help-text">
                  ยังไม่มี API Key? ขอรับฟรีได้ที่ Discord ของ HenrikDev หรือเว็บ{' '}
                  <a href="https://henrikdev.xyz" target="_blank" rel="noreferrer">
                    henrikdev.xyz
                  </a>
                </span>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="val-btn-secondary"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} color="var(--primary, #7C3AED)" />}
                {testing ? 'กำลังทดสอบเชื่อมต่อ...' : 'ทดสอบเชื่อมต่อ (Test Connection)'}
              </button>

              {testResult && (
                <div style={{ 
                  fontSize: '13px', 
                  color: testResult.success ? '#16a34a' : '#dc2626',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {testResult.success ? <Check size={16} /> : null}
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Win / Loss Session Control */}
          <div className="val-card">
            <div className="val-card-header">
              <span className="val-card-title">
                <Flame size={18} color="#f97316" />
                การนับสถิติ Win / Loss ประจำสตรีม
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              ระบบจะนับจำนวน ชนะ/แพ้ จากเกมที่แข่งในวันนี้โดยอัตโนมัติ หากเริ่มสตรีมใหม่และต้องการนับ 0/0 สามารถกดปุ่มรีเซ็ตด้านล่างได้
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="val-btn-danger"
                onClick={handleResetSession}
                disabled={resettingSession}
              >
                <RotateCcw size={14} />
                {resettingSession ? 'กำลังรีเซ็ต...' : 'รีเซ็ต Session เริ่มนับ 0 Win / 0 Loss ใหม่'}
              </button>

              {settings.valorant_session_reset_at && (
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  รีเซ็ตล่าสุดเมื่อ: {new Date(settings.valorant_session_reset_at).toLocaleTimeString('th-TH')}
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Display Toggles */}
          <div className="val-card">
            <div className="val-card-header">
              <span className="val-card-title">
                <Sliders size={18} color="#3b82f6" />
                องค์ประกอบที่แสดงบน Overlay
              </span>
            </div>

            <div className="val-toggle-row">
              <div className="val-toggle-info">
                <span className="val-toggle-title">รูปตราแรงก์ (Rank Tier Emblem)</span>
                <span className="val-toggle-desc">แสดงรูปสัญลักษณ์ยศ Valorant</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_show_badge === 'true'} 
                  onChange={() => handleToggle('valorant_show_badge')}
                />
                <span className="val-slider" />
              </label>
            </div>

            <div className="val-toggle-row">
              <div className="val-toggle-info">
                <span className="val-toggle-title">ชื่อแรงก์ (Rank Name)</span>
                <span className="val-toggle-desc">เช่น Ascendant 2, Diamond 1, Immortal 3</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_show_rank === 'true'} 
                  onChange={() => handleToggle('valorant_show_rank')}
                />
                <span className="val-slider" />
              </label>
            </div>

            <div className="val-toggle-row">
              <div className="val-toggle-info">
                <span className="val-toggle-title">แต้มคะแนน (Current RR)</span>
                <span className="val-toggle-desc">เช่น 17RR, 85RR</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_show_rr === 'true'} 
                  onChange={() => handleToggle('valorant_show_rr')}
                />
                <span className="val-slider" />
              </label>
            </div>

            <div className="val-toggle-row">
              <div className="val-toggle-info">
                <span className="val-toggle-title">สถิติชนะ/แพ้ (Win / Loss)</span>
                <span className="val-toggle-desc">แสดงจำนวนแมตช์ที่ชนะและแพ้</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_show_wl === 'true'} 
                  onChange={() => handleToggle('valorant_show_wl')}
                />
                <span className="val-slider" />
              </label>
            </div>

            <div className="val-toggle-row">
              <div className="val-toggle-info">
                <span className="val-toggle-title">ผลการแข่งเกมล่าสุด (+/- RR)</span>
                <span className="val-toggle-desc">ปุ่มแสดงแต้มที่บวกหรือลบจากเกมที่พึ่งจบไป</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_show_last_match === 'true'} 
                  onChange={() => handleToggle('valorant_show_last_match')}
                />
                <span className="val-slider" />
              </label>
            </div>

            {/* Custom Label for Last Match */}
            {settings.valorant_show_last_match === 'true' && (
              <div style={{ marginTop: '10px', padding: '12px 14px', background: 'var(--bg-subtle, #F0F1F6)', borderRadius: 'var(--radius-sm, 10px)' }}>
                <label className="val-label" style={{ marginBottom: '6px', display: 'block' }}>
                  ข้อความกำกับ (เช่น เกมล่าสุด, ตาที่แล้ว, Last Match)
                </label>
                <input 
                  type="text"
                  className="val-input"
                  style={{ width: '100%' }}
                  placeholder="เกมล่าสุด"
                  value={settings.valorant_last_match_label || ''}
                  onChange={(e) => handleInputChange('valorant_last_match_label', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Card 4: Appearance & Theming */}
          <div className="val-card">
            <div className="val-card-header">
              <span className="val-card-title">
                <Palette size={18} color="#10b981" />
                ธีมและการปรับแต่งรูปลักษณ์ (Themes & Styling)
              </span>
            </div>

            {/* Presets */}
            <label className="val-label" style={{ marginBottom: '8px', display: 'block' }}>เลือกธีมสำเร็จรูป (Presets)</label>
            <div className="val-preset-grid">
              <button 
                type="button" 
                className={`val-preset-btn ${settings.valorant_theme === 'classic' ? 'active' : ''}`}
                onClick={() => handleApplyPreset('classic')}
              >
                <span className="val-preset-icon">🎮</span>
                <span className="val-preset-name">Classic Dark</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>สไตล์ davizeragod</span>
              </button>

              <button 
                type="button" 
                className={`val-preset-btn ${settings.valorant_theme === 'neon' ? 'active' : ''}`}
                onClick={() => handleApplyPreset('neon')}
              >
                <span className="val-preset-icon">⚡</span>
                <span className="val-preset-name">Cyber Neon</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>สีสันนีออนเด่นชัด</span>
              </button>

              <button 
                type="button" 
                className={`val-preset-btn ${settings.valorant_theme === 'glass' ? 'active' : ''}`}
                onClick={() => handleApplyPreset('glass')}
              >
                <span className="val-preset-icon">💎</span>
                <span className="val-preset-name">Glassmorphism</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>กระจกฝ้าหรูหรา</span>
              </button>

              <button 
                type="button" 
                className={`val-preset-btn ${settings.valorant_theme === 'minimal' ? 'active' : ''}`}
                onClick={() => handleApplyPreset('minimal')}
              >
                <span className="val-preset-icon">🖤</span>
                <span className="val-preset-name">Minimalist</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>เรียบง่ายไร้ขอบ</span>
              </button>
            </div>

            {/* Show Background Switch */}
            <div className="val-toggle-row" style={{ marginTop: '16px', paddingBottom: '14px', borderBottom: '1px dashed var(--border, #E2E5EE)' }}>
              <div className="val-toggle-info">
                <span className="val-toggle-title">แสดงพื้นหลังการ์ด (Card Background)</span>
                <span className="val-toggle-desc">หากปิด พื้นหลังจะโปร่งแสง 100% แสดงเฉพาะตัวหนังสือและไอคอนลอยบนจอสตรีม</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_show_bg !== 'false'} 
                  onChange={() => handleToggle('valorant_show_bg')}
                />
                <span className="val-slider" />
              </label>
            </div>

            {/* Shine Effect Switch */}
            <div className="val-toggle-row" style={{ paddingBottom: '16px', borderBottom: '1.5px solid var(--border, #E2E5EE)' }}>
              <div className="val-toggle-info">
                <span className="val-toggle-title">เอฟเฟกต์ประกายแสง (Text Shine Effect)</span>
                <span className="val-toggle-desc">ลำแสงประกายคริสตัลวิ่งพาดผ่านทั้งชื่อแรงก์และคะแนน RR ต่อเนื่องเป็นคลื่นเดียวกันทุก 3.5 วินาที</span>
              </div>
              <label className="val-switch">
                <input 
                  type="checkbox" 
                  checked={settings.valorant_shine === 'true'} 
                  onChange={() => handleToggle('valorant_shine')}
                />
                <span className="val-slider" />
              </label>
            </div>

            {/* Color & Size Customization */}
            <div className="val-form-grid" style={{ marginTop: '20px' }}>
              <div 
                className="val-form-group"
                style={{ 
                  opacity: settings.valorant_show_bg === 'false' ? 0.4 : 1, 
                  pointerEvents: settings.valorant_show_bg === 'false' ? 'none' : 'auto',
                  transition: 'opacity 0.2s' 
                }}
              >
                <label className="val-label">สีพื้นหลังการ์ด (Card Background)</label>
                <div className="val-color-control">
                  <input 
                    type="color" 
                    className="val-color-picker"
                    value={settings.valorant_bg_color || '#1e293b'}
                    onChange={(e) => handleInputChange('valorant_bg_color', e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="val-input"
                    style={{ flex: 1 }}
                    value={settings.valorant_bg_color}
                    onChange={(e) => handleInputChange('valorant_bg_color', e.target.value)}
                  />
                </div>
              </div>

              <div 
                className="val-form-group"
                style={{ 
                  opacity: settings.valorant_show_bg === 'false' ? 0.4 : 1, 
                  pointerEvents: settings.valorant_show_bg === 'false' ? 'none' : 'auto',
                  transition: 'opacity 0.2s' 
                }}
              >
                <label className="val-label">ความโปร่งแสงพื้นหลัง ({settings.valorant_bg_opacity}%)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={settings.valorant_bg_opacity}
                  onChange={(e) => handleInputChange('valorant_bg_opacity', e.target.value)}
                  style={{ marginTop: '12px' }}
                />
              </div>

              <div className="val-form-group">
                <label className="val-label">สีข้อความหลัก (Text Color)</label>
                <div className="val-color-control">
                  <input 
                    type="color" 
                    className="val-color-picker"
                    value={settings.valorant_text_color || '#ffffff'}
                    onChange={(e) => handleInputChange('valorant_text_color', e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="val-input"
                    style={{ flex: 1 }}
                    value={settings.valorant_text_color}
                    onChange={(e) => handleInputChange('valorant_text_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="val-form-group">
                <label className="val-label">สีเน้นไฮไลท์ (Accent Color)</label>
                <div className="val-color-control">
                  <input 
                    type="color" 
                    className="val-color-picker"
                    value={settings.valorant_accent_color || '#38bdf8'}
                    onChange={(e) => handleInputChange('valorant_accent_color', e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="val-input"
                    style={{ flex: 1 }}
                    value={settings.valorant_accent_color}
                    onChange={(e) => handleInputChange('valorant_accent_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="val-form-group">
                <label className="val-label">ความโค้งมนขอบ ({settings.valorant_radius}px)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="32" 
                  value={settings.valorant_radius}
                  onChange={(e) => handleInputChange('valorant_radius', e.target.value)}
                  style={{ marginTop: '12px' }}
                />
              </div>

              <div className="val-form-group">
                <label className="val-label">ขนาดสเกล Overlay ({settings.valorant_scale}%)</label>
                <input 
                  type="range" 
                  min="70" 
                  max="150" 
                  value={settings.valorant_scale}
                  onChange={(e) => handleInputChange('valorant_scale', e.target.value)}
                  style={{ marginTop: '12px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview & OBS URL (Sticky) */}
        <div className="val-preview-col">
          {/* Live Preview Box */}
          <div className="val-card" style={{ marginBottom: 0 }}>
            <div className="val-card-header">
              <span className="val-card-title">
                <Eye size={18} color="var(--primary, #7C3AED)" />
                ตัวอย่างสด (Live Preview)
              </span>

              {/* Background switch */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  type="button" 
                  className={`val-btn-secondary ${previewBg === 'game' ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  onClick={() => setPreviewBg('game')}
                >
                  Dark
                </button>
                <button 
                  type="button" 
                  className={`val-btn-secondary ${previewBg === 'checker' ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  onClick={() => setPreviewBg('checker')}
                >
                  Grid
                </button>
                <button 
                  type="button" 
                  className={`val-btn-secondary ${previewBg === 'bright' ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  onClick={() => setPreviewBg('bright')}
                >
                  Light
                </button>
              </div>
            </div>

            <div className={`val-preview-box ${previewBg}`}>
              <ValorantCard 
                data={previewData}
                settings={settings}
                loading={false}
              />
            </div>
          </div>

          {/* OBS Browser Source Box */}
          <div className="val-obs-box">
            <span className="val-card-title" style={{ marginBottom: '8px' }}>
              <Layers size={18} color="#3b82f6" />
              OBS Browser Source URL
            </span>

            <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', margin: '0 0 10px 0' }}>
              คัดลอก URL นี้ไปใส่ใน Browser Source ของโปรแกรม OBS Studio / Prism / Streamlabs
            </p>

            <div className="val-obs-url-row">
              <input 
                type="text" 
                readOnly 
                className="val-obs-input"
                value={obsUrl}
              />
              <button 
                type="button" 
                className="val-btn-copy"
                onClick={handleCopyLink}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </button>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a 
                href={obsUrl} 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: '12px', color: 'var(--primary, #7C3AED)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                เปิดดูหน้าต่าง Overlay จริง <ExternalLink size={12} />
              </a>

              <span style={{ fontSize: '11px', color: '#64748b' }}>
                ขนาดแนะนำ: 450 x 140 px
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

