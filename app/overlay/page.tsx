'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import './overlay.css';
import './widgets.css';
import { supabase } from '@/lib/supabaseClient';
import { Donation, AlertSettings } from '@/lib/types/database';
import AlertCard from './alert/AlertCard';
import { useAlertQueue } from './useAlertQueue';

export default function OverlayPage() {
  const [settings, setSettings] = useState<AlertSettings>({
    alert_duration: 8,
    alert_volume: 80,
    tts_enabled: 'true',
    tts_min_amount: 0,
    alert_animation: 'bounce',
    alert_exit_animation: 'blur-dissolve',
    alert_action_text: 'โดเนทให้',
    alert_icon: 'heart',
    alert_card_bg: 'transparent',
    alert_border_color: 'transparent',
    alert_border_width: 0,
    alert_shadow_show: 'false',
    alert_amount_bg: 'transparent',
    alert_amount_color: '#38bdf8',
    alert_msg_bg: 'transparent',
    alert_msg_color: '#ffffff',
    alert_text_stroke_enabled: 'true',
    alert_text_stroke_color: '#000000',
    alert_text_stroke_width: 1,
    alert_text_gradient_enabled: 'true',
    alert_text_gradient_preset: 'neon_pink',
    alert_text_gradient_from: '#f857a6',
    alert_text_gradient_to: '#ff5858',
    alert_card_beam: 'false',
    alert_shine_sweep: 'true',
    alert_shine_theme: 'crystal',
    alert_tiered_enabled: 'true',
    alert_tiered_rare_min: 50,
    alert_tiered_epic_min: 200,
    alert_tiered_legendary_min: 500,
    alert_tiered_common_color: '#22c55e',
    alert_tiered_common_from: '#22c55e',
    alert_tiered_common_to: '#10b981',
    alert_tiered_rare_color: '#00c6ff',
    alert_tiered_rare_from: '#00c6ff',
    alert_tiered_rare_to: '#0072ff',
    alert_tiered_epic_color: '#a855f7',
    alert_tiered_epic_from: '#da22ff',
    alert_tiered_epic_to: '#9733ee',
    alert_tiered_legendary_color: '#f59e0b',
    alert_tiered_legendary_from: '#f12711',
    alert_tiered_legendary_to: '#f5af19'
  });

  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [isNoBgMode, setIsNoBgMode] = useState<boolean>(false);

  // Compute effective settings: Strip background, border, blur & shadow when in TikTok/No-BG mode
  const effectiveSettings = useMemo<AlertSettings>(() => {
    if (!isNoBgMode) return settings;
    return {
      ...settings,
      alert_card_bg: 'transparent',
      alert_card_blur: 0,
      alert_border_color: 'transparent',
      alert_border_width: 0,
      alert_shadow_show: 'false',
      alert_glow: 'false',
      alert_shimmer_show: 'false',
      alert_card_beam: 'false',
      alert_icon_bg: 'transparent',
      alert_icon_border: 'transparent',
      alert_amount_bg: 'transparent',
      alert_amount_border: 'transparent',
      alert_msg_bg: 'transparent',
      alert_msg_border: 'transparent',
      alert_text_stroke_enabled: 'true',
      alert_text_stroke_width: settings.alert_text_stroke_width || 1.5,
      alert_text_stroke_color: settings.alert_text_stroke_color || '#000000',
      alert_text_shadow: settings.alert_text_shadow === 'none' ? 'game' : (settings.alert_text_shadow || 'game')
    };
  }, [settings, isNoBgMode]);

  const {
    currentAlert,
    alertAnimState,
    audioUnlocked,
    audioRef,
    ttsAudioRef,
    unlockAudio: baseUnlockAudio,
    enqueueDonation,
    dismissAlert,
    setQueuePaused,
    onTtsEnded,
    handleTtsAudioError
  } = useAlertQueue(effectiveSettings);

  // Unlock audio context on user click/interaction
  const unlockAudio = () => {
    baseUnlockAudio();
    setTimeout(() => setShowBanner(false), 2000);
  };

  // Listen to any user interaction to unlock audio and check URL params for TikTok/No-BG mode
  useEffect(() => {
    const handleGesture = () => unlockAudio();
    window.addEventListener('click', handleGesture);
    window.addEventListener('pointerdown', handleGesture);
    window.addEventListener('keydown', handleGesture);

    let bannerTimer: NodeJS.Timeout | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isTikTok =
        params.get('tiktok') === '1' ||
        params.get('nobg') === '1' ||
        params.get('frameless') === '1' ||
        params.get('transparent') === '1';

      if (isTikTok) {
        setIsNoBgMode(true);
        document.body.classList.add('tiktok-mode');
      }

      if (
        isTikTok ||
        params.get('obs') === '1' ||
        params.get('clean') === '1' ||
        params.get('stream') === '1' ||
        params.get('studio') === '1'
      ) {
        setShowBanner(false);
      } else {
        bannerTimer = setTimeout(() => {
          setShowBanner(false);
        }, 8000);
      }
    }

    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      if (bannerTimer) clearTimeout(bannerTimer);
    };
  }, []);

  useEffect(() => {
    document.body.classList.add('overlay-body');
    return () => {
      document.body.classList.remove('overlay-body');
      document.body.classList.remove('tiktok-mode');
    };
  }, []);

  useEffect(() => {
    applyStyles(effectiveSettings);
  }, [effectiveSettings]);

  function applyStyles(s: AlertSettings) {
    if (!s || typeof window === 'undefined') return;
    const root = document.documentElement;

    if (s.alert_font) root.style.setProperty('--alert-font', `'${s.alert_font}', sans-serif`);
    if (s.alert_card_bg) root.style.setProperty('--alert-card-bg', s.alert_card_bg);
    if (s.alert_card_blur !== undefined) root.style.setProperty('--alert-card-blur', `${s.alert_card_blur}px`);
    if (s.alert_card_width) root.style.setProperty('--alert-card-width', `${s.alert_card_width}px`);

    if (s.alert_border_color) root.style.setProperty('--alert-border-color', s.alert_border_color);
    if (s.alert_border_width !== undefined) root.style.setProperty('--alert-border-width', `${s.alert_border_width}px`);
    if (s.alert_border_radius !== undefined) root.style.setProperty('--alert-border-radius', `${s.alert_border_radius}px`);

    if (s.alert_shimmer_color) root.style.setProperty('--alert-shimmer', s.alert_shimmer_color);
    root.style.setProperty('--alert-shimmer-display', (s.alert_shimmer_show === 'false' || s.alert_shimmer_show === false) ? 'none' : 'block');

    if (s.alert_shadow_show === 'false' || s.alert_shadow_show === false) {
      root.style.setProperty('--alert-shadow', 'none');
    } else if (s.alert_glow === 'true' || s.alert_glow === true) {
      const glowColor = s.alert_border_color && s.alert_border_color !== 'transparent' ? s.alert_border_color : '#2563eb';
      root.style.setProperty('--alert-shadow', `0 25px 50px -12px rgba(0,0,0,0.3), 0 0 35px ${glowColor}66`);
    } else {
      root.style.setProperty('--alert-shadow', '0 25px 50px -12px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.04)');
    }

    if (s.alert_icon_bg) root.style.setProperty('--alert-icon-bg', s.alert_icon_bg);
    if (s.alert_icon_color) root.style.setProperty('--alert-icon-color', s.alert_icon_color);
    if (s.alert_icon_border) root.style.setProperty('--alert-icon-border', s.alert_icon_border);
    root.style.setProperty('--alert-icon-border-width', s.alert_icon_bg === 'transparent' ? '0px' : '1.5px');
    root.style.setProperty('--alert-icon-shadow', s.alert_icon_bg === 'transparent' ? 'none' : '0 4px 12px rgba(15, 23, 42, 0.05)');

    if (s.alert_name_color) root.style.setProperty('--alert-name-color', s.alert_name_color);
    if (s.alert_action_color) root.style.setProperty('--alert-action-color', s.alert_action_color);
    if (s.alert_title_size) root.style.setProperty('--alert-title-size', `${s.alert_title_size}px`);

    if (s.alert_letter_spacing !== undefined) root.style.setProperty('--alert-letter-spacing', `${s.alert_letter_spacing}px`);
    if (s.alert_word_gap !== undefined) root.style.setProperty('--alert-word-gap', `${s.alert_word_gap}px`);
    if (s.alert_text_margin_top !== undefined) root.style.setProperty('--alert-text-margin-top', `${s.alert_text_margin_top}px`);
    if (s.alert_text_margin_bottom !== undefined) root.style.setProperty('--alert-text-margin-bottom', `${s.alert_text_margin_bottom}px`);
    if (s.alert_text_margin_left !== undefined) root.style.setProperty('--alert-text-margin-left', `${s.alert_text_margin_left}px`);
    if (s.alert_text_margin_right !== undefined) root.style.setProperty('--alert-text-margin-right', `${s.alert_text_margin_right}px`);
    if (s.alert_line_height !== undefined) root.style.setProperty('--alert-line-height', `${s.alert_line_height}`);

    const strokeEnabled = s.alert_text_stroke_enabled === 'true' || s.alert_text_stroke_enabled === true;
    if (strokeEnabled) {
      const strokeWidth = s.alert_text_stroke_width || 1.5;
      const strokeColor = s.alert_text_stroke_color || '#000000';
      root.style.setProperty('--alert-text-stroke', `${strokeWidth}px ${strokeColor}`);
    } else {
      root.style.setProperty('--alert-text-stroke', 'none');
    }

    if (s.alert_amount_bg) root.style.setProperty('--alert-amount-bg', s.alert_amount_bg);
    if (s.alert_amount_color) root.style.setProperty('--alert-amount-color', s.alert_amount_color);
    if (s.alert_amount_border) root.style.setProperty('--alert-amount-border', s.alert_amount_border);
    if (s.alert_amount_size) root.style.setProperty('--alert-amount-size', `${s.alert_amount_size}px`);
    root.style.setProperty('--alert-amount-border-width', s.alert_amount_bg === 'transparent' ? '0px' : '1.5px');
    root.style.setProperty('--alert-amount-padding', s.alert_amount_bg === 'transparent' ? '0px' : '2px 14px');

    if (s.alert_msg_bg) root.style.setProperty('--alert-msg-bg', s.alert_msg_bg);
    if (s.alert_msg_color) root.style.setProperty('--alert-msg-color', s.alert_msg_color);
    if (s.alert_msg_border) root.style.setProperty('--alert-msg-border', s.alert_msg_border);
    if (s.alert_msg_size) root.style.setProperty('--alert-msg-size', `${s.alert_msg_size}px`);
  }

  const triggerLocalTest = () => {
    unlockAudio();
    enqueueDonation({
      id: 'test-direct-' + Date.now(),
      name: 'ผู้สนับสนุนใจดี',
      amount: 1000,
      message: 'ทดสอบเสียงแจ้งเตือนและระบบอ่านภาษาไทย 1,000 บาทสำเร็จ!',
      sender_bank: 'PROMPTPAY',
      created_at: new Date().toLocaleTimeString('th-TH'),
      isTest: true
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('test') === '1' || params.get('preview') === '1') {
        setTimeout(() => {
          triggerLocalTest();
        }, 1000);
      }
    }
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      const timestamp = Date.now();
      try {
        const res = await fetch(`/api/settings?_t=${timestamp}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
          return;
        }
      } catch (e) {
        console.warn('[Overlay] Public settings load failed, trying admin endpoint:', e);
      }

      try {
        const resAdmin = await fetch(`/api/admin/settings?_t=${timestamp}`, { cache: 'no-store' });
        const dataAdmin = await resAdmin.json();
        if (dataAdmin.success && dataAdmin.settings) {
          setSettings(prev => ({ ...prev, ...dataAdmin.settings }));
        }
      } catch (err) {
        console.warn('[Overlay] Could not load settings:', err);
      }
    };

    loadSettings();

    // Listen to local BroadcastChannel for zero-latency testing
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('donation-alerts');
      bc.onmessage = (event) => {
        if (event.data?.type === 'donation' && event.data?.payload) {
          enqueueDonation(event.data.payload);
        } else if (event.data?.type === 'settings_updated' && event.data?.payload) {
          setSettings(prev => ({ ...prev, ...event.data.payload }));
        } else if (event.data?.type === 'skip_alert') {
          dismissAlert();
        } else if (event.data?.type === 'pause_queue') {
          setQueuePaused(true);
        } else if (event.data?.type === 'resume_queue') {
          setQueuePaused(false);
        }
      };
    }

    const channel = supabase.channel('donation-alerts');

    channel
      .on('broadcast', { event: 'donation' }, (payload: any) => {
        if (payload.payload) enqueueDonation(payload.payload);
      })
      .on('broadcast', { event: 'settings_updated' }, (payload: any) => {
        if (payload.payload) {
          setSettings(prev => ({ ...prev, ...payload.payload }));
        }
      })
      .on('broadcast', { event: 'skip_alert' }, () => {
        dismissAlert();
      })
      .on('broadcast', { event: 'pause_queue' }, () => {
        setQueuePaused(true);
      })
      .on('broadcast', { event: 'resume_queue' }, () => {
        setQueuePaused(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (bc) bc.close();
    };
  }, [enqueueDonation, dismissAlert, setQueuePaused]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      background: 'transparent',
      position: 'relative'
    }}>
      <audio ref={audioRef} src={settings.alert_sound_url || "/sounds/alert.mp3"} preload="auto" />
      <audio
        ref={ttsAudioRef}
        preload="auto"
        onEnded={onTtsEnded}
        onError={handleTtsAudioError}
      />

      {/* Browser Autoplay Notice & Local Sound Tester (Hidden in OBS via ?obs=1 or close button) */}
      {showBanner && (
        <div
          style={{
            position: 'fixed',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: audioUnlocked ? 'rgba(15, 23, 42, 0.88)' : 'rgba(220, 38, 38, 0.94)',
            backdropFilter: 'blur(12px)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '9999px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'sans-serif',
            transition: 'all 0.3s ease',
            border: '1px solid rgba(255,255,255,0.15)'
          }}
        >
          <span>
            {audioUnlocked
              ? '🔊 เสียงพร้อมทำงานแล้ว'
              : '🔇 เบราว์เซอร์บล็อกเสียงอัตโนมัติ (คลิกที่นี่เพื่อเปิดเสียง)'}
          </span>
          <button
            type="button"
            onClick={triggerLocalTest}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            ▶ ทดสอบ Alert + TTS (1,000฿)
          </button>
          <button
            type="button"
            onClick={() => setShowBanner(false)}
            title="ซ่อนแถบนี้ (สำหรับ OBS หน้าจอโปร่งใสอยู่แล้ว)"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
              padding: '2px 4px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {currentAlert && (
        <AlertCard
          settings={effectiveSettings}
          alert={currentAlert}
          animState={alertAnimState}
        />
      )}
    </div>
  );
}
