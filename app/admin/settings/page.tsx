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
  Volume1,
  PlayCircle,
  Image as ImageIcon,
  Globe,
  RotateCcw
} from 'lucide-react';
import { AlertSettings } from '@/lib/types/database';
import { Skeleton } from '@/app/components';
import { SocialPlatformIcon } from '@/app/components/SocialPlatformIcon';
import {
  DONATE_PAGE_DEFAULTS,
  DONATE_PAGE_SETTING_KEYS,
  getDonatePageProfile
} from '@/lib/donate-page-profile';
import { useAdmin } from '../AdminContext';
import { ALERT_SOUND_PRESETS } from '@/lib/constants';

type SettingsTab = 'payment' | 'audio' | 'automation' | 'donatePage';

const SOCIAL_LINK_FIELDS: ReadonlyArray<{
  settingKey: keyof Pick<
    AlertSettings,
    | 'donate_page_social_discord'
    | 'donate_page_social_tiktok'
    | 'donate_page_social_youtube'
    | 'donate_page_social_twitch'
    | 'donate_page_social_x_ig'
  >;
  id: string;
  label: string;
  placeholder: string;
}> = [
  {
    settingKey: DONATE_PAGE_SETTING_KEYS.socialDiscord,
    id: 'settingDonateDiscord',
    label: 'Discord',
    placeholder: 'https://discord.gg/...'
  },
  {
    settingKey: DONATE_PAGE_SETTING_KEYS.socialTiktok,
    id: 'settingDonateTiktok',
    label: 'TikTok',
    placeholder: 'https://www.tiktok.com/@...'
  },
  {
    settingKey: DONATE_PAGE_SETTING_KEYS.socialYoutube,
    id: 'settingDonateYoutube',
    label: 'YouTube',
    placeholder: 'https://www.youtube.com/@...'
  },
  {
    settingKey: DONATE_PAGE_SETTING_KEYS.socialTwitch,
    id: 'settingDonateTwitch',
    label: 'Twitch',
    placeholder: 'https://www.twitch.tv/...'
  },
  {
    settingKey: DONATE_PAGE_SETTING_KEYS.socialInstagramOrX,
    id: 'settingDonateXIg',
    label: 'Instagram / X',
    placeholder: 'https://www.instagram.com/... หรือ https://x.com/...'
  }
];

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
    tts_min_amount: 20,
    media_share_enabled: 'false',
    media_share_min_amount: 20,
    media_share_max_duration: 60,
    media_share_volume: 70,
    [DONATE_PAGE_SETTING_KEYS.name]: DONATE_PAGE_DEFAULTS.name,
    [DONATE_PAGE_SETTING_KEYS.handle]: DONATE_PAGE_DEFAULTS.handle,
    [DONATE_PAGE_SETTING_KEYS.bio]: DONATE_PAGE_DEFAULTS.bio,
    [DONATE_PAGE_SETTING_KEYS.avatarUrl]: DONATE_PAGE_DEFAULTS.avatarUrl,
    [DONATE_PAGE_SETTING_KEYS.heroUrl]: DONATE_PAGE_DEFAULTS.heroUrl,
    [DONATE_PAGE_SETTING_KEYS.socialDiscord]: '',
    [DONATE_PAGE_SETTING_KEYS.socialTiktok]: '',
    [DONATE_PAGE_SETTING_KEYS.socialYoutube]: '',
    [DONATE_PAGE_SETTING_KEYS.socialTwitch]: '',
    [DONATE_PAGE_SETTING_KEYS.socialInstagramOrX]: ''
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPlayingAlertSound, setIsPlayingAlertSound] = useState<boolean>(false);
  const [uploadingSound, setUploadingSound] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<'avatar' | 'hero' | null>(null);
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

  const uploadMediaFile = async (file: File): Promise<string> => {
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
    if (!res.ok || !data.success || !data.url) {
      throw new Error(data.message || 'อัปโหลดไฟล์ไม่สำเร็จ');
    }

    return String(data.url);
  };

  const handleSoundUpload = async (file: File) => {
    setUploadingSound(true);
    try {
      const url = await uploadMediaFile(file);
      setSettings(prev => ({ ...prev, alert_sound_url: url }));
      setSoundMode('custom');
      showToast('อัปโหลดไฟล์เสียงสำเร็จ');
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์เสียง');
    } finally {
      setUploadingSound(false);
    }
  };

  const handleDonateImageUpload = async (target: 'avatar' | 'hero', file: File) => {
    setUploadingImage(target);
    try {
      const url = await uploadMediaFile(file);
      const key = target === 'avatar' ? DONATE_PAGE_SETTING_KEYS.avatarUrl : DONATE_PAGE_SETTING_KEYS.heroUrl;
      setSettings(prev => ({ ...prev, [key]: url }));
      showToast(target === 'avatar' ? 'อัปโหลดรูปโปรไฟล์สำเร็จ (กดบันทึกเพื่อยืนยัน)' : 'อัปโหลดภาพพื้นหลังสำเร็จ (กดบันทึกเพื่อยืนยัน)');
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploadingImage(null);
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
          const definedSettings = Object.fromEntries(
            Object.entries(data.settings).filter(([, value]) => value !== undefined && value !== null)
          );
          setSettings((prev) => ({ ...prev, ...definedSettings }));
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
    return <SettingsSkeleton />;
  }

  const currentVolume = Number(settings.alert_volume ?? 80);
  const donatePreviewProfile = getDonatePageProfile(
    settings as unknown as Record<string, string | number | boolean | undefined>
  );

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
          <span>TTS, Media Share &amp; ระดับยอดเงิน</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'donatePage' ? 'active' : ''}`}
          onClick={() => setActiveTab('donatePage')}
        >
          <Globe size={16} />
          <span>หน้าโดเนท &amp; โปรไฟล์</span>
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

            {/* Card: Media Share (YouTube Link) */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <PlayCircle size={18} />
                </div>
                <div>
                  <div className="settings-card-title">แชร์คลิป / เพลง YouTube (Media Share)</div>
                  <div className="settings-card-desc">
                    อนุญาตให้ผู้โดเนทเลือกเปิดสวิตช์แนบลิงก์ YouTube เพื่อเล่นขึ้นจอ OBS หลัง Alert &amp; TTS จบลง
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="settingMediaShareEnabled">
                    สถานะระบบแนบลิงก์หน้าโดเนท
                  </label>
                  <select
                    id="settingMediaShareEnabled"
                    className="input-control"
                    value={String(settings.media_share_enabled === 'true' || settings.media_share_enabled === true)}
                    onChange={(e) => setSettings({ ...settings, media_share_enabled: e.target.value })}
                  >
                    <option value="true">เปิดใช้งาน (ผู้โดเนทเลือกใส่หรือไม่ใส่ลิงก์ก็ได้)</option>
                    <option value="false">ปิดใช้งาน (ซ่อนช่องใส่ลิงก์บนหน้าโดเนท)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settingMediaShareMinAmount">
                    ยอดขั้นต่ำสำหรับแนบลิงก์ YouTube (บาท)
                  </label>
                  <input
                    type="number"
                    id="settingMediaShareMinAmount"
                    className="input-control"
                    min="1"
                    max="1000000"
                    value={settings.media_share_min_amount ?? 20}
                    onChange={(e) => setSettings({ ...settings, media_share_min_amount: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="settingMediaShareMaxDuration">
                    ความยาวเล่นสูงสุดต่อคลิป (วินาที · 5-600 วิ)
                  </label>
                  <input
                    type="number"
                    id="settingMediaShareMaxDuration"
                    className="input-control"
                    min="5"
                    max="600"
                    value={settings.media_share_max_duration ?? 60}
                    onChange={(e) => setSettings({ ...settings, media_share_max_duration: parseInt(e.target.value, 10) || 60 })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" htmlFor="settingMediaShareVolume" style={{ marginBottom: 0 }}>
                      ระดับเสียงคลิป YouTube บน OBS
                    </label>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
                      {Number(settings.media_share_volume ?? 70)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    {Number(settings.media_share_volume ?? 70) === 0 ? (
                      <VolumeX size={18} style={{ color: 'var(--text-dim)' }} />
                    ) : (
                      <Volume1 size={18} style={{ color: 'var(--accent)' }} />
                    )}
                    <input
                      type="range"
                      id="settingMediaShareVolume"
                      min="0"
                      max="100"
                      value={Number(settings.media_share_volume ?? 70)}
                      onChange={(e) => setSettings({ ...settings, media_share_volume: parseInt(e.target.value, 10) || 0 })}
                      style={{ flex: 1, cursor: 'pointer' }}
                    />
                  </div>
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

        {/* ================= TAB 4: PUBLIC DONATE PAGE & PROFILE ================= */}
        {activeTab === 'donatePage' && (
          <div>
            {/* Card: Live Mini Preview */}
            <div className="settings-card">
              <div className="settings-card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="settings-card-icon">
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="settings-card-title">ตัวอย่างหน้าโดเนทสาธารณะ (Live Preview)</div>
                    <div className="settings-card-desc">
                      แสดงผลโปรไฟล์ รูปแบนเนอร์ และปุ่มโซเชียลตามค่าที่กำลังแก้ไขแบบเรียลไทม์
                    </div>
                  </div>
                </div>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  <span>เปิดหน้าโดเนทจริง</span>
                </a>
              </div>

              <div
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: '#0f1118'
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    height: '128px',
                    background: donatePreviewProfile.heroUrl
                      ? `linear-gradient(180deg, rgba(15, 17, 24, 0.15) 0%, #0f1118 100%), url("${donatePreviewProfile.heroUrl}") center/cover no-repeat`
                      : 'linear-gradient(135deg, #1d2438 0%, #0f1118 100%)'
                  }}
                />
                <div style={{ padding: '0 20px 20px', marginTop: '-42px', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        border: '3px solid #0f1118',
                        background: '#1c2130',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '26px',
                        flexShrink: 0
                      }}
                    >
                      {donatePreviewProfile.avatarUrl ? (
                        <img
                          src={donatePreviewProfile.avatarUrl}
                          alt={donatePreviewProfile.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span>{donatePreviewProfile.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>
                        {donatePreviewProfile.name}
                      </div>
                      {donatePreviewProfile.handle && (
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>
                          {donatePreviewProfile.handle}
                        </div>
                      )}
                    </div>
                  </div>

                  {donatePreviewProfile.bio && (
                    <p
                      style={{
                        marginTop: '12px',
                        marginBottom: 0,
                        fontSize: '13.5px',
                        lineHeight: 1.55,
                        color: 'rgba(255,255,255,0.84)',
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {donatePreviewProfile.bio}
                    </p>
                  )}

                  {donatePreviewProfile.socialLinks.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      {donatePreviewProfile.socialLinks.map((item) => (
                        <span
                          key={item.key}
                          title={item.label}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#e5e7eb'
                          }}
                        >
                          <SocialPlatformIcon platform={item.platform} size={15} />
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    หัวข้อฟอร์ม: โดเนทให้ {donatePreviewProfile.name} · ใบเสร็จ: ถึง {donatePreviewProfile.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Profile Info */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="settings-card-title">ข้อมูลโปรไฟล์สตรีมเมอร์</div>
                  <div className="settings-card-desc">
                    ชื่อที่แสดงจะอัปเดตทั้งโปรไฟล์ หัวข้อฟอร์ม ใบเสร็จ ท้ายเว็บ และชื่อแท็บเบราว์เซอร์
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="settingDonateName">
                    ชื่อสตรีมเมอร์ / ชื่อที่แสดง (สูงสุด 60 ตัวอักษร)
                  </label>
                  <input
                    type="text"
                    id="settingDonateName"
                    className="input-control"
                    maxLength={60}
                    placeholder={DONATE_PAGE_DEFAULTS.name}
                    value={settings[DONATE_PAGE_SETTING_KEYS.name] ?? ''}
                    onChange={(e) =>
                      setSettings({ ...settings, [DONATE_PAGE_SETTING_KEYS.name]: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settingDonateHandle">
                    Handle / ชื่อบัญชี (เว้นว่างเพื่อซ่อน)
                  </label>
                  <input
                    type="text"
                    id="settingDonateHandle"
                    className="input-control"
                    maxLength={60}
                    placeholder={DONATE_PAGE_DEFAULTS.handle}
                    value={settings[DONATE_PAGE_SETTING_KEYS.handle] ?? ''}
                    onChange={(e) =>
                      setSettings({ ...settings, [DONATE_PAGE_SETTING_KEYS.handle]: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="settingDonateBio">
                  ข้อความแนะนำตัว (Bio — รองรับขึ้นบรรทัดใหม่ สูงสุด 300 ตัวอักษร เว้นว่างเพื่อซ่อน)
                </label>
                <textarea
                  id="settingDonateBio"
                  className="input-control"
                  rows={3}
                  maxLength={300}
                  placeholder={DONATE_PAGE_DEFAULTS.bio}
                  value={settings[DONATE_PAGE_SETTING_KEYS.bio] ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, [DONATE_PAGE_SETTING_KEYS.bio]: e.target.value })
                  }
                />
                <div className="text-muted" style={{ fontSize: '12px', marginTop: '6px' }}>
                  {(settings[DONATE_PAGE_SETTING_KEYS.bio] ?? '').length}/300 ตัวอักษร
                </div>
              </div>
            </div>

            {/* Card: Avatar & Hero Images */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <div className="settings-card-title">รูปโปรไฟล์และแบนเนอร์พื้นหลัง</div>
                  <div className="settings-card-desc">
                    อัปโหลดภาพใหม่หรือวาง URL รูปภาพ (รองรับ .png, .jpg, .jpeg, .webp, .gif ขนาดไม่เกิน 25MB)
                  </div>
                </div>
              </div>

              <div className="form-row" style={{ marginBottom: 0 }}>
                {([
                  {
                    target: 'avatar' as const,
                    settingKey: DONATE_PAGE_SETTING_KEYS.avatarUrl,
                    defaultValue: DONATE_PAGE_DEFAULTS.avatarUrl,
                    inputId: 'settingDonateAvatarUrl',
                    uploadId: 'donateAvatarUploadInput',
                    label: 'รูปโปรไฟล์ (Avatar)',
                    placeholder: '/avatar.png หรือ https://...'
                  },
                  {
                    target: 'hero' as const,
                    settingKey: DONATE_PAGE_SETTING_KEYS.heroUrl,
                    defaultValue: DONATE_PAGE_DEFAULTS.heroUrl,
                    inputId: 'settingDonateHeroUrl',
                    uploadId: 'donateHeroUploadInput',
                    label: 'ภาพแบนเนอร์พื้นหลัง (Hero Banner — ล้างค่าเพื่อใช้พื้นหลังทึบ)',
                    placeholder: 'https://...'
                  }
                ]).map((imgField) => (
                  <div key={imgField.target} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor={imgField.inputId}>
                      {imgField.label}
                    </label>
                    <input
                      type="text"
                      id={imgField.inputId}
                      className="input-control"
                      placeholder={imgField.placeholder}
                      value={settings[imgField.settingKey] ?? ''}
                      onChange={(e) =>
                        setSettings({ ...settings, [imgField.settingKey]: e.target.value })
                      }
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <label
                        htmlFor={imgField.uploadId}
                        className="btn-secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: uploadingImage === imgField.target ? 'wait' : 'pointer',
                          marginBottom: 0
                        }}
                      >
                        {uploadingImage === imgField.target ? (
                          <Loader2 size={14} className="spinner" />
                        ) : (
                          <UploadCloud size={14} />
                        )}
                        <span>{uploadingImage === imgField.target ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}</span>
                      </label>
                      <input
                        id={imgField.uploadId}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
                        style={{ display: 'none' }}
                        disabled={uploadingImage !== null}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleDonateImageUpload(imgField.target, file);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() =>
                          setSettings({ ...settings, [imgField.settingKey]: imgField.defaultValue })
                        }
                      >
                        <RotateCcw size={14} />
                        <span>คืนค่าเริ่มต้น</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Social Links */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <ExternalLink size={18} />
                </div>
                <div>
                  <div className="settings-card-title">ลิงก์โซเชียลมีเดีย (สูงสุด 5 ช่อง)</div>
                  <div className="settings-card-desc">
                    ช่องที่ใส่ URL (http:// หรือ https://) จะแสดงเป็นไอคอนใต้ข้อความแนะนำตัว ช่องที่เว้นว่างจะถูกซ่อนอัตโนมัติ
                  </div>
                </div>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: 0 }}>
                {SOCIAL_LINK_FIELDS.map((field) => (
                  <div key={field.settingKey} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor={field.id}>
                      {field.label}
                    </label>
                    <input
                      type="url"
                      id={field.id}
                      className="input-control"
                      placeholder={field.placeholder}
                      value={settings[field.settingKey] ?? ''}
                      onChange={(e) =>
                        setSettings({ ...settings, [field.settingKey]: e.target.value })
                      }
                    />
                  </div>
                ))}
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

function SettingsSkeleton() {
  return (
    <div aria-hidden="true">
      {/* Top Header Bar Skeleton */}
      <div className="settings-page-header" style={{ marginBottom: '24px' }}>
        <div>
          <Skeleton width="160px" height="26px" style={{ marginBottom: '8px' }} />
          <Skeleton width="340px" height="14px" />
        </div>
        <Skeleton width="140px" height="40px" radius="8px" />
      </div>

      {/* Tabs Skeleton */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <Skeleton width="180px" height="42px" radius="8px" />
        <Skeleton width="190px" height="42px" radius="8px" />
        <Skeleton width="210px" height="42px" radius="8px" />
      </div>

      {/* Settings Panel Skeleton */}
      <div className="panel" style={{ padding: '28px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Skeleton width="220px" height="20px" style={{ marginBottom: '8px' }} />
          <Skeleton width="320px" height="14px" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <div>
            <Skeleton width="120px" height="14px" style={{ marginBottom: '8px' }} />
            <Skeleton width="100%" height="42px" radius="8px" />
          </div>
          <div>
            <Skeleton width="130px" height="14px" style={{ marginBottom: '8px' }} />
            <Skeleton width="100%" height="42px" radius="8px" />
          </div>
          <div>
            <Skeleton width="140px" height="14px" style={{ marginBottom: '8px' }} />
            <Skeleton width="100%" height="42px" radius="8px" />
          </div>
          <div>
            <Skeleton width="110px" height="14px" style={{ marginBottom: '8px' }} />
            <Skeleton width="100%" height="42px" radius="8px" />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
          <Skeleton width="180px" height="20px" style={{ marginBottom: '12px' }} />
          <Skeleton width="100%" height="90px" radius="10px" />
        </div>
      </div>
    </div>
  );
}
