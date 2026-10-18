'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertSettings } from '@/lib/types/database';
import { useAdmin } from '../AdminContext';
import { ALERT_SOUND_PRESETS } from '@/lib/constants';

export default function AdminSettingsPage() {
  const { showToast, handleUnauthorized } = useAdmin();
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
      };
      audio.onerror = () => {
        setIsPlayingAlertSound(false);
        alert('ไม่สามารถเล่นไฟล์เสียงกระดิ่งนี้ได้ ตรวจสอบ URL หรือไฟล์');
      };

      audio.play().catch(() => {
        setIsPlayingAlertSound(false);
      });
    } catch (e) {
      setIsPlayingAlertSound(false);
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
      showToast('อัปโหลดไฟล์เสียงสำเร็จ!');
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
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
        showToast('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!');
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
      <div className="panel" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-dim)' }}>
        กำลังโหลดการตั้งค่าระบบ...
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          ตั้งค่าพร้อมเพย์ & ระบบ OBS Alert
        </h2>
      </div>

      <form onSubmit={handleSaveSettings}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="settingPromptPayId">
              หมายเลข PromptPay (เบอร์โทร 10 หลัก หรือ ปชช 13 หลัก)
            </label>
            <input
              type="text"
              id="settingPromptPayId"
              className="input-control"
              placeholder="0649520055"
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
              placeholder="0649520055"
              value={settings.truemoney_phone || ''}
              onChange={(e) => setSettings({ ...settings, truemoney_phone: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="settingMinDonate">ยอดโดเนทขั้นต่ำ (บาท)</label>
            <input
              type="number"
              id="settingMinDonate"
              className="input-control"
              min="1"
              value={settings.min_donate || '1'}
              onChange={(e) => setSettings({ ...settings, min_donate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="settingAlertDuration">ระยะเวลาแสดง Alert บน OBS (วินาที)</label>
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
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="settingAlertVolume">
              ระดับเสียงแจ้งเตือน ({settings.alert_volume || 80}%)
            </label>
            <input
              type="range"
              id="settingAlertVolume"
              min="0"
              max="100"
              value={settings.alert_volume || 80}
              onChange={(e) => setSettings({ ...settings, alert_volume: parseInt(e.target.value) || 0 })}
              style={{ width: '100%', marginTop: '10px' }}
            />
          </div>
        </div>

        {/* Feature 2.1: Alert Sound Selection */}
        <div className="form-row">
          <div className="form-group" style={{ width: '100%' }}>
            <div className="field-label-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" htmlFor="settingAlertSound" style={{ marginBottom: 0 }}>
                🔔 เสียงกระดิ่งแจ้งเตือน (Alert Sound)
              </label>
              <button
                type="button"
                className="btn sm secondary"
                onClick={handleTestAlertSound}
                disabled={isPlayingAlertSound}
                style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
              >
                {isPlayingAlertSound ? '⏳ กำลังเล่นเสียง...' : '▶️ ทดลองฟังเสียงกระดิ่ง'}
              </button>
            </div>
            {/* 2 Tabs: Preset vs Custom */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', marginBottom: '10px' }}>
              <button
                type="button"
                className={`btn sm ${soundMode === 'preset' ? '' : 'secondary'}`}
                style={{
                  fontWeight: 600,
                  fontSize: '12px',
                  background: soundMode === 'preset' ? '#2563eb' : undefined,
                  color: soundMode === 'preset' ? '#ffffff' : undefined
                }}
                onClick={() => {
                  setSoundMode('preset');
                  const isCurrentPreset = ALERT_SOUND_PRESETS.some(p => p.id !== 'custom' && p.id === settings.alert_sound_url);
                  if (!isCurrentPreset) {
                    setSettings(prev => ({ ...prev, alert_sound_url: '/sounds/alert.mp3' }));
                  }
                }}
              >
                🔔 เสียงมาตรฐาน (5 แบบ)
              </button>
              <button
                type="button"
                className={`btn sm ${soundMode === 'custom' ? '' : 'secondary'}`}
                style={{
                  fontWeight: 600,
                  fontSize: '12px',
                  background: soundMode === 'custom' ? '#2563eb' : undefined,
                  color: soundMode === 'custom' ? '#ffffff' : undefined
                }}
                onClick={() => setSoundMode('custom')}
              >
                📁 อัปโหลดไฟล์ / วางลิงก์เอง
              </button>
            </div>

            {soundMode === 'preset' ? (
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
            ) : (
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                border: '1.5px dashed var(--border)',
                background: 'var(--bg-surface)',
                marginTop: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>อัปโหลดหรือระบุลิงก์เสียง (.mp3, .wav, .ogg)</span>
                  <button
                    type="button"
                    className="btn sm danger"
                    onClick={() => {
                      setSettings(prev => ({ ...prev, alert_sound_url: '/sounds/alert.mp3' }));
                      setSoundMode('preset');
                    }}
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                  >
                    รีเซ็ตเป็นกระดิ่งเดิม
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
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
                    {uploadingSound ? '⏳ กำลังอัปโหลด...' : '📁 เลือกไฟล์เสียง'}
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="URL ไฟล์เสียง เช่น /sounds/alert.mp3 หรือ https://..."
                    value={settings.alert_sound_url || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, alert_sound_url: e.target.value }))}
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="settingTtsEnabled">ระบบอ่านออกเสียง (TTS)</label>
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

          <div className="form-group">
            <label className="form-label" htmlFor="settingTtsMinAmount">ยอดเงินขั้นต่ำที่จะให้อ่าน TTS (บาท)</label>
            <input
              type="number"
              id="settingTtsMinAmount"
              className="input-control"
              value={settings.tts_min_amount || 20}
              onChange={(e) => setSettings({ ...settings, tts_min_amount: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '15px', margin: '24px 0 10px', color: 'var(--text-main)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎨</span>
          <span>ระบบเปลี่ยนสีตัวอักษรตามระดับยอดเงิน (Tiered Text Colors)</span>
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '14px' }}>
          เปลี่ยนสีชื่อผู้โดเนทและยอดเงินตามระดับจำนวนเงินอัตโนมัติ (Common: สีตามธีม | Rare | Epic | Legendary)
        </p>

        <div className="form-row">
          <div className="form-group" style={{ width: '100%' }}>
            <label className="form-label" htmlFor="settingTieredEnabled">
              สถานะเปิดใช้งาน Tiered Text Colors
            </label>
            <select
              id="settingTieredEnabled"
              className="input-control"
              value={String(settings.alert_tiered_enabled !== 'false' && settings.alert_tiered_enabled !== false)}
              onChange={(e) => setSettings({ ...settings, alert_tiered_enabled: e.target.value })}
            >
              <option value="true">เปิดใช้งาน (เปลี่ยนสีตัวอักษรชื่อและยอดเงินตามระดับ)</option>
              <option value="false">ปิดใช้งาน (ใช้สีตัวอักษรปกติเท่ากันทุกยอด)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="settingTierRareMin">
              ยอดเงินขั้นต่ำระดับ Rare (บาท)
            </label>
            <input
              type="number"
              id="settingTierRareMin"
              className="input-control"
              min="1"
              value={settings.alert_tiered_rare_min ?? 50}
              onChange={(e) => setSettings({ ...settings, alert_tiered_rare_min: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="settingTierRareColor">
              สีตัวอักษร Rare
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                id="settingTierRareColor"
                value={settings.alert_tiered_rare_color?.startsWith('#') ? settings.alert_tiered_rare_color : '#0284c7'}
                onChange={(e) => setSettings({ ...settings, alert_tiered_rare_color: e.target.value })}
                style={{ width: '40px', height: '38px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', padding: '2px', background: 'transparent' }}
              />
              <input
                type="text"
                className="input-control"
                value={settings.alert_tiered_rare_color || '#0284c7'}
                onChange={(e) => setSettings({ ...settings, alert_tiered_rare_color: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="settingTierEpicMin">
              ยอดเงินขั้นต่ำระดับ Epic (บาท)
            </label>
            <input
              type="number"
              id="settingTierEpicMin"
              className="input-control"
              min="1"
              value={settings.alert_tiered_epic_min ?? 200}
              onChange={(e) => setSettings({ ...settings, alert_tiered_epic_min: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="settingTierEpicColor">
              สีตัวอักษร Epic
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                id="settingTierEpicColor"
                value={settings.alert_tiered_epic_color?.startsWith('#') ? settings.alert_tiered_epic_color : '#9333ea'}
                onChange={(e) => setSettings({ ...settings, alert_tiered_epic_color: e.target.value })}
                style={{ width: '40px', height: '38px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', padding: '2px', background: 'transparent' }}
              />
              <input
                type="text"
                className="input-control"
                value={settings.alert_tiered_epic_color || '#9333ea'}
                onChange={(e) => setSettings({ ...settings, alert_tiered_epic_color: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="settingTierLegendaryMin">
              ยอดเงินขั้นต่ำระดับ Legendary (บาท)
            </label>
            <input
              type="number"
              id="settingTierLegendaryMin"
              className="input-control"
              min="1"
              value={settings.alert_tiered_legendary_min ?? 500}
              onChange={(e) => setSettings({ ...settings, alert_tiered_legendary_min: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="settingTierLegendaryColor">
              สีตัวอักษร Legendary
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                id="settingTierLegendaryColor"
                value={settings.alert_tiered_legendary_color?.startsWith('#') ? settings.alert_tiered_legendary_color : '#ea580c'}
                onChange={(e) => setSettings({ ...settings, alert_tiered_legendary_color: e.target.value })}
                style={{ width: '40px', height: '38px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', padding: '2px', background: 'transparent' }}
              />
              <input
                type="text"
                className="input-control"
                value={settings.alert_tiered_legendary_color || '#ea580c'}
                onChange={(e) => setSettings({ ...settings, alert_tiered_legendary_color: e.target.value })}
              />
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '15px', margin: '24px 0 10px', color: 'var(--text-main)', fontWeight: 700 }}>
          ระบบตรวจสอบความปลอดภัยสลิปเพิ่มเติม (Optional)
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '14px' }}>
          ระบุชื่อและเลขบัญชีปลายทางเพื่อป้องกันการส่งสลิปปลอมหรือโอนผิดบัญชี (รองรับทั้งพร้อมเพย์และเลขบัญชีธนาคาร)
        </p>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="settingReceiverName">
              ชื่อผู้รับเงินในบัญชี (ภาษาไทย หรือ อังกฤษ ใส่หลายชื่อคั่นด้วย ",")
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
              เลขบัญชีธนาคารผู้รับ (ใส่ได้หลายบัญชี คั่นด้วย ",")
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

        <div style={{
          marginTop: '8px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          fontSize: '13px',
          lineHeight: '1.5',
          color: 'var(--text-main)'
        }}>
          📌 <strong>สำคัญมากสำหรับ SlipOK:</strong> หากต้องการให้ระบบตรวจผ่านทั้งการ <strong>"สแกนพร้อมเพย์"</strong> และการ <strong>"โอนเลขบัญชีธนาคารตรง"</strong> คุณต้องเข้าไปที่หน้าเว็บ <a href="https://slipok.com" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>SlipOK Dashboard</a> แล้วเพิ่มทั้ง <strong>เบอร์พร้อมเพย์</strong> และ <strong>เลขที่บัญชีธนาคาร</strong> ไว้ในสาขา (Branch) ของคุณด้วย มิฉะนั้น SlipOK จะปฏิเสธสลิปด้วย Error 1014 ทันที
        </div>

        <button type="submit" className="btn" style={{ marginTop: '14px' }} disabled={isSaving}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
        </button>
      </form>
    </div>
  );
}
