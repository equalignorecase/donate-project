'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Volume2,
  Sparkles,
  ShieldCheck,
  Play,
  Square,
  UploadCloud,
  Save,
  Loader2,
  Sliders,
  ExternalLink,
  Smartphone,
  Banknote,
  Clock,
  VolumeX,
  Volume1
} from 'lucide-react';
import { AlertSettings } from '@/lib/types/database';
import { useAdmin } from '../AdminContext';
import { ALERT_SOUND_PRESETS } from '@/lib/constants';

type SettingsTab = 'payment' | 'audio' | 'automation';

export default function AdminSettingsPage() {
  const { showToast, handleUnauthorized } = useAdmin();
  const [activeTab, setActiveTab] = useState<SettingsTab>('payment');
  const [settings, setSettings] = useState<AlertSettings>({
    promptpay_id: '',
    receiver_name: '',
    receiver_account: '',
    min_donate: '5',
    alert_duration: 8,
    alert_volume: 80,
    alert_sound_url: '/sounds/alert.mp3',
    tts_enabled: 'true',
    tts_min_amount: 20
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPlayingAlertSound, setIsPlayingAlertSound] = useState<boolean>(false);
  const [uploadingSound, setUploadingSound] = useState<boolean>(false);
  const [soundMode, setSoundMode] = useState<'preset' | 'custom'>('preset');
  const alertSoundRef = useRef<HTMLAudioElement | null>(null);

  const handleTestAlertSound = () => {
    if (alertSoundRef.current) {
      alertSoundRef.current.pause();
      alertSoundRef.current = null;
      setIsPlayingAlertSound(false);
      return;
    }

    const soundUrl = (settings.alert_sound_url || '/sounds/alert.mp3').trim();
    const vol = Math.min(Math.max((Number(settings.alert_volume ?? 80)) / 100, 0), 1);

    try {
      setIsPlayingAlertSound(true);
      const audio = new Audio(soundUrl);
      audio.volume = vol;
      alertSoundRef.current = audio;

      audio.onended = () => {
        setIsPlayingAlertSound(false);
        alertSoundRef.current = null;
      };
      audio.onerror = () => {
        setIsPlayingAlertSound(false);
        alertSoundRef.current = null;
        alert('ไม่สามารถเล่นไฟล์เสียงกระดิ่งนี้ได้ ตรวจสอบ URL หรือไฟล์');
      };

      audio.play().catch(() => {
        setIsPlayingAlertSound(false);
        alertSoundRef.current = null;
      });
    } catch {
      setIsPlayingAlertSound(false);
      alertSoundRef.current = null;
    }
  };

  const handleSoundUpload = async (file: File) => {
    setUploadingSound(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('donate_admin_token') || '') : '';
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers['x-admin-token'] = adminToken;
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const res = await fetch('/api/admin/upload-media', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'อัปโหลดเสียงไม่สำเร็จ');
      }

      setSettings(prev => ({ ...prev, alert_sound_url: data.url }));
      setSoundMode('custom');
      showToast('อัปโหลดไฟล์เสียงสำเร็จ');
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์เสียง');
    } finally {
      setUploadingSound(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/settings', {
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
          if (data.settings.alert_sound_url) {
            const isPreset = ALERT_SOUND_PRESETS.some(p => p.id !== 'custom' && p.id === data.settings.alert_sound_url);
            setSoundMode(isPreset ? 'preset' : 'custom');
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [handleUnauthorized]);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.success) {
        showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      } else {
        alert(data.message || 'บันทึกการตั้งค่าไม่สำเร็จ');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
        <Loader2 className="spinner" size={24} style={{ margin: '0 auto 12px' }} />
        <div>กำลังโหลดการตั้งค่าระบบ...</div>
      </div>
    );
  }

  const currentVolume = Number(settings.alert_volume ?? 80);

  return (
    <div>
      {/* Top Header Bar */}
      <div className="settings-page-header">
        <div className="settings-header-info">
          <h1>
            <Sliders size={22} />
            <span>ตั้งค่าระบบ</span>
          </h1>
          <p>จัดการช่องทางรับเงิน, การแจ้งเตือน OBS Studio, และระบบความปลอดภัยสลิป</p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => handleSaveSettings()}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
          <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-header">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveTab('payment')}
        >
          <CreditCard size={16} />
          <span>การรับเงิน &amp; ความปลอดภัย</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          <Volume2 size={16} />
          <span>OBS Alert &amp; เสียง</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'automation' ? 'active' : ''}`}
          onClick={() => setActiveTab('automation')}
        >
          <Sparkles size={16} />
          <span>TTS &amp; ระดับยอดเงิน</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings}>
        {/* ================= TAB 1: PAYMENT & SECURITY ================= */}
        {activeTab === 'payment' && (
          <div>
            {/* Card: Payment Methods */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <Smartphone size={18} />
                </div>
                <div>
                  <div className="settings-card-title">ช่องทางการรับชำระเงิน</div>
                  <div className="settings-card-desc">
                    กำหนดหมายเลขบัญชีสำหรับสร้าง QR Code พร้อมเพย์ และการรับเงินผ่าน TrueMoney Wallet
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="settingPromptPayId">
                    หมายเลข PromptPay (เบอร์โทรศัพท์ หรือ เลขบัตรประชาชน)
                  </label>
                  <input
                    type="text"
                    id="settingPromptPayId"
                    className="input-control"
                    placeholder="เช่น 0812345678 หรือ 1234567890123"
                    value={settings.promptpay_id || ''}
                    onChange={(e) => setSettings({ ...settings, promptpay_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settingTrueMoneyPhone">
                    เบอร์ TrueMoney Wallet รับเงิน (10 หลัก)
                  </label>
                  <input
                    type="text"
                    id="settingTrueMoneyPhone"
                    className="input-control"
                    placeholder="เช่น 0812345678"
                    value={settings.truemoney_phone || ''}
                    onChange={(e) => setSettings({ ...settings, truemoney_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="settingMinDonate">
                    ยอดโดเนทขั้นต่ำ (บาท)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      id="settingMinDonate"
                      className="input-control"
                      min="1"
                      value={settings.min_donate || '1'}
                      onChange={(e) => setSettings({ ...settings, min_donate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Slip Verification Security */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="settings-card-title">การตรวจสอบสลิปและบัญชีผู้รับ (SlipOK)</div>
                  <div className="settings-card-desc">
                    ระบุชื่อและเลขบัญชีเพื่อตรวจสอบสลิปโอนเงิน ป้องกันการส่งสลิปปลอมหรือโอนผิดบัญชี
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="settingReceiverName">
                    ชื่อผู้รับเงินในบัญชี (คั่นหลายชื่อด้วยเครื่องหมายจุลภาค ,)
                  </label>
                  <input
                    type="text"
                    id="settingReceiverName"
                    className="input-control"
                    placeholder="เช่น นาย สมชาย ใจดี, SOMCHAI"
                    value={settings.receiver_name || ''}
                    onChange={(e) => setSettings({ ...settings, receiver_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settingReceiverAccount">
                    เลขบัญชีธนาคารผู้รับ (คั่นหลายเลขบัญชีด้วยเครื่องหมายจุลภาค ,)
                  </label>
                  <input
                    type="text"
                    id="settingReceiverAccount"
                    className="input-control"
                    placeholder="เช่น 1234567890, 9876543210"
                    value={settings.receiver_account || ''}
                    onChange={(e) => setSettings({ ...settings, receiver_account: e.target.value })}
                  />
                </div>
              </div>

              <div className="settings-info-callout">
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent)' }} />
                <div>
                  <strong>คำแนะนำสำหรับ SlipOK:</strong> หากต้องการให้ระบบตรวจสอบผ่านทั้งการสแกน QR PromptPay และการโอนตรงเข้าเลขบัญชีธนาคาร ให้เปิด{' '}
                  <a href="https://slipok.com" target="_blank" rel="noopener noreferrer">
                    SlipOK Dashboard <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  </a>{' '}
                  แล้วระบุทั้ง <strong>เบอร์พร้อมเพย์</strong> และ <strong>เลขที่บัญชีธนาคาร</strong> ไว้ในสาขา (Branch) เพื่อป้องกัน Error 1014
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: OBS ALERT & AUDIO ================= */}
        {activeTab === 'audio' && (
          <div>
            {/* Card: OBS Screen Timing & Volume */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="settings-card-title">ระยะเวลาและการแสดงผลบน OBS Studio</div>
                  <div className="settings-card-desc">
                    ตั้งค่าระยะเวลาการแสดงกล่อง Alert และความดังของเสียงเตือน
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="settingAlertDuration">
                    ระยะเวลาแสดง Alert บนหน้าจอ (วินาที)
                  </label>
                  <input
                    type="number"
                    id="settingAlertDuration"
                    className="input-control"
                    min="3"
                    max="30"
                    value={settings.alert_duration || 8}
                    onChange={(e) => setSettings({ ...settings, alert_duration: parseInt(e.target.value) || 8 })}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" htmlFor="settingAlertVolume" style={{ marginBottom: 0 }}>
                      ระดับเสียงแจ้งเตือน
                    </label>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
                      {currentVolume}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    {currentVolume === 0 ? (
                      <VolumeX size={18} style={{ color: 'var(--text-dim)' }} />
                    ) : (
                      <Volume1 size={18} style={{ color: 'var(--accent)' }} />
                    )}
                    <input
                      type="range"
                      id="settingAlertVolume"
                      min="0"
                      max="100"
                      value={currentVolume}
                      onChange={(e) => setSettings({ ...settings, alert_volume: parseInt(e.target.value) || 0 })}
                      style={{ flex: 1, cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Alert Audio Sound */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <Volume2 size={18} />
                </div>
                <div>
                  <div className="settings-card-title">ไฟล์เสียงแจ้งเตือน (Alert Sound)</div>
                  <div className="settings-card-desc">
                    เลือกเสียงกระดิ่งมาตรฐาน หรืออัปโหลดไฟล์เสียงของคุณเอง (.mp3, .wav, .ogg)
                  </div>
                </div>
              </div>

              {/* Sound Player Bar */}
              <div className="settings-audio-bar">
                <div className="settings-audio-info">
                  <div className="settings-audio-wave">
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600 }}>
                      {settings.alert_sound_url || '/sounds/alert.mp3'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      ความดังปัจจุบัน: {currentVolume}%
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn sm ${isPlayingAlertSound ? 'danger' : 'secondary'}`}
                  onClick={handleTestAlertSound}
                >
                  {isPlayingAlertSound ? <Square size={14} /> : <Play size={14} />}
                  <span>{isPlayingAlertSound ? 'หยุดเล่นเสียง' : 'ทดลองฟังเสียง'}</span>
                </button>
              </div>

              {/* Sound Mode Segmented Switch */}
              <div className="settings-segmented" style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  className={`settings-segmented-btn ${soundMode === 'preset' ? 'active' : ''}`}
                  onClick={() => {
                    setSoundMode('preset');
                    const isCurrentPreset = ALERT_SOUND_PRESETS.some(p => p.id !== 'custom' && p.id === settings.alert_sound_url);
                    if (!isCurrentPreset) {
                      setSettings(prev => ({ ...prev, alert_sound_url: '/sounds/alert.mp3' }));
                    }
                  }}
                >
                  <Volume2 size={14} />
                  <span>เสียงมาตรฐาน (Preset)</span>
                </button>

                <button
                  type="button"
                  className={`settings-segmented-btn ${soundMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setSoundMode('custom')}
                >
                  <UploadCloud size={14} />
                  <span>อัปโหลด / ลิงก์ไฟล์เสียง</span>
                </button>
              </div>

              {soundMode === 'preset' ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="settingAlertSound">
                    เลือกเสียงกระดิ่งจากระบบ
                  </label>
                  <select
                    id="settingAlertSound"
                    className="input-control"
                    value={
                      ALERT_SOUND_PRESETS.some(p => p.id !== 'custom' && p.id === settings.alert_sound_url)
                        ? settings.alert_sound_url
                        : '/sounds/alert.mp3'
                    }
                    onChange={(e) => setSettings(prev => ({ ...prev, alert_sound_url: e.target.value }))}
                  >
                    {ALERT_SOUND_PRESETS.filter(p => p.id !== 'custom').map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px dashed var(--border)',
                  background: 'var(--bg-page)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>อัปโหลดหรือระบุ URL ไฟล์เสียง</span>
                    <button
                      type="button"
                      className="btn sm secondary"
                      onClick={() => {
                        setSettings(prev => ({ ...prev, alert_sound_url: '/sounds/alert.mp3' }));
                        setSoundMode('preset');
                      }}
                      style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    >
                      คืนค่าเสียงเดิม
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label className="btn sm secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="file"
                        accept=".mp3,.wav,.ogg"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSoundUpload(file);
                        }}
                      />
                      {uploadingSound ? <Loader2 size={14} className="spinner" /> : <UploadCloud size={14} />}
                      <span>{uploadingSound ? 'กำลังอัปโหลด...' : 'เลือกไฟล์จากเครื่อง'}</span>
                    </label>

                    <input
                      type="text"
                      className="input-control"
                      placeholder="หรือวาง URL เช่น /sounds/alert.mp3 หรือ https://..."
                      value={settings.alert_sound_url || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, alert_sound_url: e.target.value }))}
                      style={{ flex: 1, minWidth: '220px' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: AUTOMATION & TIERS ================= */}
        {activeTab === 'automation' && (
          <div>
            {/* Card: Text-to-Speech */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <Volume2 size={18} />
                </div>
                <div>
                  <div className="settings-card-title">ระบบอ่านออกเสียงอัตโนมัติ (Text-to-Speech)</div>
                  <div className="settings-card-desc">
                    ให้อ่านชื่อผู้สนับสนุน ยอดเงิน และข้อความโดเนทอัตโนมัติขณะมี Alert ขึ้นหน้าจอ
                  </div>
                </div>
              </div>

              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="settingTtsEnabled">
                    สถานะการทำงาน TTS
                  </label>
                  <select
                    id="settingTtsEnabled"
                    className="input-control"
                    value={String(settings.tts_enabled)}
                    onChange={(e) => setSettings({ ...settings, tts_enabled: e.target.value })}
                  >
                    <option value="true">เปิดใช้งาน (อ่านชื่อ ยอดเงิน และข้อความ)</option>
                    <option value="false">ปิดใช้งาน</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="settingTtsMinAmount">
                    ยอดเงินขั้นต่ำที่จะให้อ่าน TTS (บาท)
                  </label>
                  <input
                    type="number"
                    id="settingTtsMinAmount"
                    className="input-control"
                    min="1"
                    value={settings.tts_min_amount || 20}
                    onChange={(e) => setSettings({ ...settings, tts_min_amount: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Card: Tiered Text Colors */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="settings-card-title">สีตัวอักษรตามระดับยอดเงิน (Tiered Colors)</div>
                  <div className="settings-card-desc">
                    แยกสีข้อความและไอคอนตามระดับจำนวนเงินโดเนท เพื่อไฮไลต์ยอดโดเนทพิเศษ
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="settingTieredEnabled">
                  สถานะเปิดใช้งาน Tiered Colors
                </label>
                <select
                  id="settingTieredEnabled"
                  className="input-control"
                  value={String(settings.alert_tiered_enabled !== 'false' && settings.alert_tiered_enabled !== false)}
                  onChange={(e) => setSettings({ ...settings, alert_tiered_enabled: e.target.value })}
                >
                  <option value="true">เปิดใช้งาน (เปลี่ยนสีตัวอักษรและไอคอนตามระดับยอดเงิน)</option>
                  <option value="false">ปิดใช้งาน (ใช้สีปกติเท่ากันทุกยอด)</option>
                </select>
              </div>

              {/* Tier Cards Grid */}
              <div className="settings-tier-grid">
                {/* Rare Tier */}
                <div className="settings-tier-item">
                  <div className="settings-tier-item-head">
                    <span className="settings-tier-badge" style={{ color: settings.alert_tiered_rare_color || '#00c6ff' }}>
                      <span className="settings-tier-dot" style={{ background: settings.alert_tiered_rare_color || '#00c6ff' }} />
                      <span>ระดับ Rare</span>
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>ยอดขั้นต่ำ (บาท)</label>
                    <input
                      type="number"
                      className="input-control"
                      min="1"
                      value={settings.alert_tiered_rare_min ?? 50}
                      onChange={(e) => setSettings({ ...settings, alert_tiered_rare_min: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>สีตัวอักษร</label>
                    <div className="settings-color-input-wrap">
                      <input
                        type="color"
                        value={settings.alert_tiered_rare_color?.startsWith('#') ? settings.alert_tiered_rare_color : '#00c6ff'}
                        onChange={(e) => setSettings({ ...settings, alert_tiered_rare_color: e.target.value })}
                      />
                      <input
                        type="text"
                        className="hex-text"
                        value={settings.alert_tiered_rare_color || '#00c6ff'}
                        onChange={(e) => setSettings({ ...settings, alert_tiered_rare_color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Epic Tier */}
                <div className="settings-tier-item">
                  <div className="settings-tier-item-head">
                    <span className="settings-tier-badge" style={{ color: settings.alert_tiered_epic_color || '#9333ea' }}>
                      <span className="settings-tier-dot" style={{ background: settings.alert_tiered_epic_color || '#9333ea' }} />
                      <span>ระดับ Epic</span>
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>ยอดขั้นต่ำ (บาท)</label>
                    <input
                      type="number"
                      className="input-control"
                      min="1"
                      value={settings.alert_tiered_epic_min ?? 200}
                      onChange={(e) => setSettings({ ...settings, alert_tiered_epic_min: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>สีตัวอักษร</label>
                    <div className="settings-color-input-wrap">
                      <input
                        type="color"
                        value={settings.alert_tiered_epic_color?.startsWith('#') ? settings.alert_tiered_epic_color : '#9333ea'}
                        onChange={(e) => setSettings({ ...settings, alert_tiered_epic_color: e.target.value })}
                      />
                      <input
                        type="text"
                        className="hex-text"
                        value={settings.alert_tiered_epic_color || '#9333ea'}
                        onChange={(e) => setSettings({ ...settings, alert_tiered_epic_color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Legendary Tier */}
                <div className="settings-tier-item">
                  <div className="settings-tier-item-head">
                    <span className="settings-tier-badge" style={{ color: settings.alert_tiered_legendary_color || '#ea580c' }}>
                      <span className="settings-tier-dot" style={{ background: settings.alert_tiered_legendary_color || '#ea580c' }} />
                      <span>ระดับ Legendary</span>
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>ยอดขั้นต่ำ (บาท)</label>
                    <input
                      type="number"
                      className="input-control"
                      min="1"
                      value={settings.alert_tiered_legendary_min ?? 500}
                      onChange={(e) => setSettings({ ...settings, alert_tiered_legendary_min: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>สีตัวอักษร</label>
                    <div className="settings-color-input-wrap">
                      <input
                        type="color"
                        value={settings.alert_tiered_legendary_color?.startsWith('#') ? settings.alert_tiered_legendary_color : '#ea580c'}
                        onChange={(e) => setSettings({ ...settings, alert_tiered_legendary_color: e.target.value })}
                      />
                      <input
                        type="text"
                        className="hex-text"
                        value={settings.alert_tiered_legendary_color || '#ea580c'}
                        onChange={(e) => setSettings({ ...settings, alert_tiered_legendary_color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="settings-bottom-bar">
          <button
            type="submit"
            className="btn"
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
            <span>{isSaving ? 'กำลังบันทึกการตั้งค่า...' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
