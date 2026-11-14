'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Send,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Youtube,
  Volume2,
  ShieldAlert,
  Sparkles,
  Loader2,
  Tv
} from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { AlertSettings, Donation } from '@/lib/types/database';
import {
  defaultAlertSettings,
  getAlertTier,
  getTierTextColor,
  AlertTier
} from '@/app/overlay/alert/AlertCard';
import { getDonatePageProfile } from '@/lib/donate-page-profile';
import { containsProfanity } from '@/lib/profanity';
import { getMediaShareConfig, parseYouTubeUrl } from '@/lib/media-share';
import { TEST_DONATE_MAX_AMOUNT } from '@/lib/test-donate';

interface MediaPreviewData {
  videoId: string;
  title: string;
  authorName: string;
  thumbnailUrl: string;
  startSeconds: number;
}

interface SessionTestEntry {
  payload: Donation;
  tier: AlertTier;
  profanityMasked: boolean;
}

const TIER_LABELS: Record<AlertTier, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];

function broadcastLocalDonation(eventType: 'donation' | 'skip_alert' | 'pause_queue' | 'resume_queue', payload?: unknown) {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
  try {
    const bc = new BroadcastChannel('donation-alerts');
    bc.postMessage(payload !== undefined ? { type: eventType, payload } : { type: eventType });
    bc.close();
  } catch {}
}

export default function AdminTestDonatePage() {
  const { showToast, handleUnauthorized } = useAdmin();

  const [settings, setSettings] = useState<AlertSettings>(defaultAlertSettings);
  const [customBlacklist, setCustomBlacklist] = useState<string[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [name, setName] = useState('ผู้ชมทดสอบ');
  const [amount, setAmount] = useState('50');
  const [message, setMessage] = useState('นี่คือการทดสอบระบบ Alert ขึ้นจอ OBS!');
  const [attachMedia, setAttachMedia] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState<MediaPreviewData | null>(null);
  const [mediaPreviewLoading, setMediaPreviewLoading] = useState(false);

  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SessionTestEntry[]>([]);

  useEffect(() => {
    let active = true;
    fetch(`/api/settings?_t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.success) return;
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
        if (Array.isArray(data.blacklist)) {
          setCustomBlacklist(data.blacklist);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingSettings(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const parsedMedia = useMemo(() => (attachMedia ? parseYouTubeUrl(mediaUrl) : null), [attachMedia, mediaUrl]);

  useEffect(() => {
    if (!parsedMedia) {
      setMediaPreview(null);
      setMediaPreviewLoading(false);
      return;
    }

    const controller = new AbortController();
    setMediaPreviewLoading(true);

    const timer = window.setTimeout(() => {
      fetch(`/api/media/youtube-info?url=${encodeURIComponent(parsedMedia.canonicalUrl)}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.data) {
            setMediaPreview(data.data);
          } else {
            setMediaPreview({
              videoId: parsedMedia.videoId,
              title: `YouTube (${parsedMedia.videoId})`,
              authorName: 'YouTube',
              thumbnailUrl: parsedMedia.thumbnailUrl,
              startSeconds: parsedMedia.startSeconds,
            });
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setMediaPreviewLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [parsedMedia?.canonicalUrl]);

  const profile = useMemo(
    () => getDonatePageProfile(settings as unknown as Record<string, string | number | boolean | undefined>),
    [settings]
  );

  const minDonate = Math.max(1, Number(settings.min_donate || 5) || 5);
  const mediaConfig = useMemo(() => getMediaShareConfig(settings), [settings]);

  const numericAmount = Number(amount);
  const isValidAmount = Number.isFinite(numericAmount) && numericAmount >= 1 && numericAmount <= TEST_DONATE_MAX_AMOUNT;
  const activeTier: AlertTier = getAlertTier(isValidAmount ? numericAmount : 0, settings);
  const tierColor = getTierTextColor(activeTier, settings) || '#22c55e';

  const ttsEnabled = settings.tts_enabled !== 'false' && settings.tts_enabled !== false;
  const ttsMinAmount = Math.max(0, Number(settings.tts_min_amount ?? 20) || 0);
  const willPlayTts = ttsEnabled && isValidAmount && numericAmount >= ttsMinAmount;

  const hasNameProfanity = containsProfanity(name, customBlacklist);
  const hasMessageProfanity = containsProfanity(message, customBlacklist);

  const tierPresets = useMemo(() => {
    const rareMin = parseFloat(String(settings.alert_tiered_rare_min ?? 50)) || 50;
    const epicMin = parseFloat(String(settings.alert_tiered_epic_min ?? 200)) || 200;
    const legMin = parseFloat(String(settings.alert_tiered_legendary_min ?? 500)) || 500;
    return [
      { tier: 'common' as const, label: 'Common', amount: Math.max(1, Math.min(minDonate, rareMin - 1)) },
      { tier: 'rare' as const, label: 'Rare', amount: rareMin },
      { tier: 'epic' as const, label: 'Epic', amount: epicMin },
      { tier: 'legendary' as const, label: 'Legendary', amount: legMin },
    ];
  }, [settings, minDonate]);

  const dispatchTestAlert = async (payload: {
    name: string;
    amount: number;
    message: string;
    media_url?: string;
  }) => {
    setSending(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.message || 'ส่งทดสอบโดเนทไม่สำเร็จ');
      }

      // Mirror the exact same server payload (including matching id) for instant local OBS playback
      broadcastLocalDonation('donation', data.data);

      const entryTier = getAlertTier(Number(data.data.amount) || 0, settings);
      setSessionHistory((prev) => [
        {
          payload: data.data,
          tier: entryTier,
          profanityMasked: Boolean(data.profanityMasked),
        },
        ...prev.slice(0, 4),
      ]);

      showToast(
        data.profanityMasked
          ? 'ส่งทดสอบขึ้น OBS แล้ว (ข้อความบางส่วนถูก Mask คำหยาบเป็น ***)'
          : `ส่งทดสอบโดเนท ฿${Number(data.data.amount).toLocaleString('th-TH')} ขึ้น OBS แล้ว!`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการส่งทดสอบโดเนท');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount) {
      setErrorMsg(`กรุณาระบุจำนวนเงินทดสอบระหว่าง 1 – ${TEST_DONATE_MAX_AMOUNT.toLocaleString('th-TH')} บาท`);
      return;
    }
    if (attachMedia && !parsedMedia) {
      setErrorMsg('กรุณาใส่ลิงก์ YouTube ให้ถูกต้อง หรือปิดสวิตช์แนบลิงก์คลิป');
      return;
    }

    await dispatchTestAlert({
      name: name.trim() || 'ผู้ชมทดสอบ',
      amount: Math.round(numericAmount * 100) / 100,
      message: message.trim(),
      ...(attachMedia && parsedMedia ? { media_url: parsedMedia.canonicalUrl } : {}),
    });
  };

  const handleAlertControl = async (action: 'skip_alert' | 'pause_queue' | 'resume_queue') => {
    try {
      broadcastLocalDonation(action);
      if (action === 'pause_queue') setIsQueuePaused(true);
      if (action === 'resume_queue') setIsQueuePaused(false);

      const res = await fetch('/api/admin/alert-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
      }
    } catch {
      showToast('ส่งคำสั่งควบคุมคิว OBS ไม่สำเร็จ');
    }
  };

  const handleResetForm = () => {
    setName('ผู้ชมทดสอบ');
    setAmount(String(Math.max(50, minDonate)));
    setMessage('นี่คือการทดสอบระบบ Alert ขึ้นจอ OBS!');
    setAttachMedia(false);
    setMediaUrl('');
    setMediaPreview(null);
    setErrorMsg(null);
  };

  const latestTest = sessionHistory[0] || null;

  return (
    <div>
      {/* Header Banner */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                ทดสอบโดเนทขึ้นจอ OBS (หน้าจำลอง /)
              </h1>
              <span
                className="badge"
                style={{
                  background: 'rgba(14, 165, 233, 0.14)',
                  color: '#38bdf8',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                }}
              >
                OBS ONLY • ไม่ลงประวัติ / ไม่บวก Goal / ไม่บวก Timer
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              ส่งแจ้งเตือนจำลองถึงช่อง <strong>{profile.name}</strong> โดยไม่ต้องโอนเงินจริง รองรับ Alert Tier, TTS, Filter คำหยาบ และ YouTube Media Share
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link
              href="/overlay"
              target="_blank"
              rel="noopener noreferrer"
              className="btn secondary sm"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Tv size={14} />
              <span>เปิดจอ /overlay</span>
              <ExternalLink size={12} />
            </Link>
            <Link
              href="/admin/simulator"
              className="btn secondary sm"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={14} />
              <span>Live Simulator</span>
            </Link>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn secondary sm"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={14} />
              <span>เปิดหน้าโดเนทจริง</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Left: Sandbox Donate Form */}
        <div className="panel">
          <div className="panel-header" style={{ marginBottom: '16px' }}>
            <h2 className="panel-title">
              <Send size={18} />
              <span>กรอกข้อมูลทดสอบโดเนท</span>
            </h2>
            {loadingSettings && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>กำลังโหลดค่าตั้งค่า...</span>}
          </div>

          {/* Quick Tier Presets */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              เลือกทดสอบระดับ Tier ด่วน (อ้างอิงจากที่ตั้งค่าไว้):
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {tierPresets.map((preset) => {
                const color = getTierTextColor(preset.tier, settings) || '#22c55e';
                const isSelected = isValidAmount && activeTier === preset.tier;
                return (
                  <button
                    key={preset.tier}
                    type="button"
                    className="btn secondary sm"
                    onClick={() => setAmount(String(preset.amount))}
                    style={{
                      borderColor: isSelected ? color : undefined,
                      color: isSelected ? color : undefined,
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '999px',
                        background: color,
                        display: 'inline-block',
                        marginRight: '6px',
                      }}
                    />
                    {preset.label} (฿{preset.amount.toLocaleString('th-TH')})
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Donor Name */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="testDonateName">
                  ชื่อผู้สนับสนุน
                </label>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{name.length}/50</span>
              </div>
              <input
                id="testDonateName"
                type="text"
                className="input-control"
                maxLength={50}
                placeholder="ผู้ชมทดสอบ"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {hasNameProfanity && (
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '12.5px',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ShieldAlert size={14} />
                  <span>พบคำใน Blacklist — หน้า `/` จริงจะบล็อกไม่ให้ส่ง ส่วนโหมดทดสอบจะ Mask เป็น `***` ก่อนขึ้น OBS</span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <label className="form-label" htmlFor="testDonateAmount">
                  จำนวนเงิน (บาท)
                </label>
                {isValidAmount && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: tierColor,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      border: `1px solid ${tierColor}`,
                    }}
                  >
                    Tier: {TIER_LABELS[activeTier]}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {QUICK_AMOUNTS.map((presetAmt) => (
                  <button
                    key={presetAmt}
                    type="button"
                    className={`btn sm ${Number(amount) === presetAmt ? 'primary' : 'secondary'}`}
                    onClick={() => setAmount(String(presetAmt))}
                  >
                    ฿{presetAmt.toLocaleString('th-TH')}
                  </button>
                ))}
              </div>

              <input
                id="testDonateAmount"
                type="number"
                step="0.01"
                min="1"
                max={TEST_DONATE_MAX_AMOUNT}
                className="input-control"
                placeholder="50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              {isValidAmount && numericAmount < minDonate && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#f59e0b' }}>
                  หมายเหตุ: ยอดนี้ต่ำกว่าขั้นต่ำบนหน้าเว็บจริง (฿{minDonate.toLocaleString('th-TH')}) แต่ทดสอบยิงขึ้น OBS ได้
                </div>
              )}
            </div>

            {/* Message */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="testDonateMessage">
                  ข้อความถึงสตรีมเมอร์ (เว้นว่างได้)
                </label>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{message.length}/200</span>
              </div>
              <textarea
                id="testDonateMessage"
                className="input-control"
                rows={3}
                maxLength={200}
                placeholder="พิมพ์ข้อความทดสอบ Alert และเสียงอ่าน TTS..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {hasMessageProfanity && (
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '12.5px',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ShieldAlert size={14} />
                  <span>พบคำใน Blacklist — หน้า `/` จริงจะบล็อก ส่วนโหมดทดสอบจะ Mask เป็น `***` ก่อนขึ้น OBS</span>
                </div>
              )}
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Volume2 size={14} />
                <span>
                  {!ttsEnabled
                    ? 'TTS ถูกปิดอยู่ในตั้งค่า — Alert จะไม่พูดข้อความ'
                    : willPlayTts
                      ? `TTS พร้อมอ่าน (ยอดถึงขั้นต่ำ ฿${ttsMinAmount.toLocaleString('th-TH')})`
                      : `ยอดต่ำกว่าขั้นต่ำ TTS (฿${ttsMinAmount.toLocaleString('th-TH')}) — Alert จะเด้งแบบไม่อ่านเสียง`}
                </span>
              </div>
            </div>

            {/* YouTube Media Share Toggle */}
            <div
              className="form-group"
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Youtube size={18} style={{ color: '#ef4444' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>แนบลิงก์ YouTube (Media Share)</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {mediaConfig.enabled
                        ? `เปิดใช้งานอยู่ • ขั้นต่ำ ฿${mediaConfig.minAmount.toLocaleString('th-TH')} • เล่นสูงสุด ${mediaConfig.maxDuration} วินาที`
                        : 'ขณะนี้ Media Share ปิดอยู่ในตั้งค่า — จอ /overlay จะแสดง Alert โดยไม่เล่นคลิป'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn sm ${attachMedia ? 'primary' : 'secondary'}`}
                  onClick={() => setAttachMedia((prev) => !prev)}
                >
                  {attachMedia ? 'แนบลิงก์อยู่ (คลิกเพื่อปิด)' : 'เปิดแนบลิงก์ทดสอบ'}
                </button>
              </div>

              {attachMedia && (
                <div style={{ marginTop: '12px' }}>
                  <input
                    id="testDonateMediaUrl"
                    type="url"
                    className="input-control"
                    placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/...?t=30"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                  />

                  {mediaUrl.trim() && !parsedMedia && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444' }}>
                      ลิงก์ YouTube ไม่ถูกต้อง (รองรับ youtube.com/watch?v=..., youtu.be/..., shorts/...)
                    </div>
                  )}

                  {mediaConfig.enabled && isValidAmount && numericAmount < mediaConfig.minAmount && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#f59e0b' }}>
                      ยอดเงินต่ำกว่าขั้นต่ำ Media Share (฿{mediaConfig.minAmount.toLocaleString('th-TH')}) — `/overlay` จะข้ามการเล่นคลิป
                    </div>
                  )}

                  {mediaPreviewLoading && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      กำลังดึงตัวอย่างคลิป YouTube...
                    </div>
                  )}

                  {mediaPreview && !mediaPreviewLoading && (
                    <div
                      style={{
                        marginTop: '10px',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                        padding: '8px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <img
                        src={mediaPreview.thumbnailUrl}
                        alt={mediaPreview.title}
                        style={{ width: '88px', height: '50px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {mediaPreview.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {mediaPreview.authorName}
                          {mediaPreview.startSeconds > 0 ? ` • เริ่มวินาทีที่ ${mediaPreview.startSeconds}` : ''}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {errorMsg && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn primary"
                disabled={sending}
                style={{ flex: 1, minWidth: '220px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {sending ? <Loader2 size={16} className="spinner" /> : <Send size={16} />}
                <span>{sending ? 'กำลังส่งเข้า OBS...' : 'ส่งทดสอบโดเนทขึ้น OBS ทันที'}</span>
              </button>

              <button
                type="button"
                className="btn secondary"
                onClick={handleResetForm}
                disabled={sending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={15} />
                <span>รีเซ็ตค่า</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live OBS Queue Control + Receipt + Session History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Live OBS Queue Controls */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '12px' }}>
              <h2 className="panel-title">
                <Tv size={18} />
                <span>ควบคุมคิว OBS สด (Live Controls)</span>
              </h2>
            </div>

            <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {isQueuePaused
                ? 'สถานะคิว: พักการแสดง Alert ชั่วคราว (รายการใหม่จะรอในคิวจนกว่าจะกดเล่นต่อ)'
                : 'สถานะคิว: พร้อมแสดงผลปกติ — กดข้ามเสียง/คลิปที่กำลังทดสอบได้ทันที'}
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn secondary sm"
                onClick={() => handleAlertControl('skip_alert')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <SkipForward size={14} />
                <span>ข้าม Alert / หยุด TTS</span>
              </button>

              <button
                type="button"
                className={`btn sm ${isQueuePaused ? 'primary' : 'secondary'}`}
                onClick={() => handleAlertControl(isQueuePaused ? 'resume_queue' : 'pause_queue')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {isQueuePaused ? <Play size={14} /> : <Pause size={14} />}
                <span>{isQueuePaused ? 'เล่นคิว Alert ต่อ' : 'พักคิว Alert'}</span>
              </button>
            </div>
          </div>

          {/* Latest Simulated Receipt */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '12px' }}>
              <h2 className="panel-title">
                <CheckCircle2 size={18} />
                <span>ผลทดสอบล่าสุด (Simulated Receipt)</span>
              </h2>
              {latestTest && (
                <button
                  type="button"
                  className="btn secondary sm"
                  disabled={sending}
                  onClick={() =>
                    dispatchTestAlert({
                      name: latestTest.payload.name,
                      amount: Number(latestTest.payload.amount),
                      message: latestTest.payload.message || '',
                      ...(latestTest.payload.media_url ? { media_url: latestTest.payload.media_url } : {}),
                    })
                  }
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcw size={13} />
                  <span>ยิงซ้ำรายการนี้</span>
                </button>
              )}
            </div>

            {!latestTest ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
                ยังไม่ได้ส่งรายการทดสอบในหน้านี้ — กรอกข้อมูลด้านซ้ายแล้วกด &quot;ส่งทดสอบโดเนทขึ้น OBS ทันที&quot;
              </div>
            ) : (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13.5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <strong>{latestTest.payload.name}</strong>
                  <strong style={{ fontSize: '16px', color: getTierTextColor(latestTest.tier, settings) || '#22c55e' }}>
                    ฿{Number(latestTest.payload.amount).toLocaleString('th-TH')}
                  </strong>
                </div>
                {latestTest.payload.message && (
                  <div style={{ color: 'var(--text-muted)' }}>ข้อความที่ส่ง: {latestTest.payload.message}</div>
                )}
                {latestTest.payload.media_url && (
                  <div style={{ color: '#38bdf8', wordBreak: 'break-all' }}>
                    Media Share: {latestTest.payload.media_url}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span>Ref: {latestTest.payload.id}</span>
                  <span>Tier: {TIER_LABELS[latestTest.tier]}</span>
                  <span>DB/Goal/Timer: ไม่ถูกเปลี่ยนแปลง</span>
                </div>
              </div>
            )}
          </div>

          {/* Session Test Log */}
          {sessionHistory.length > 1 && (
            <div className="panel">
              <div className="panel-header" style={{ marginBottom: '10px' }}>
                <h2 className="panel-title">ประวัติทดสอบรอบนี้ ({sessionHistory.length} รายการล่าสุด)</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sessionHistory.map((item) => (
                  <div
                    key={item.payload.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>
                        {item.payload.name} · ฿{Number(item.payload.amount).toLocaleString('th-TH')}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.payload.message || '(ไม่มีข้อความ)'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn secondary sm"
                      disabled={sending}
                      onClick={() =>
                        dispatchTestAlert({
                          name: item.payload.name,
                          amount: Number(item.payload.amount),
                          message: item.payload.message || '',
                          ...(item.payload.media_url ? { media_url: item.payload.media_url } : {}),
                        })
                      }
                    >
                      ยิงซ้ำ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
