'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Donation, AlertSettings } from '@/lib/types/database';
import {
  StudioSceneLayout,
  defaultSceneLayout,
  getStoredLayout
} from '@/lib/studioLayout';
import GoalWidget from '@/app/overlay/goal/GoalWidget';
import SupporterWidget from '@/app/overlay/supporters/SupporterWidget';
import TimerCard from '@/app/overlay/timer/TimerCard';
import AlertCard, { defaultAlertSettings, getAlertTier } from '@/app/overlay/alert/AlertCard';
import { goalAppearanceDefaults, GoalAppearance } from '@/lib/goalAppearance';
import { supporterDefaults, SupporterAppearance } from '@/lib/supporterAppearance';
import { defaultTimerAppearance, TimerAppearance, TimerStatus } from '@/lib/timerTypes';
import { Supporter } from '@/lib/widgets';
import { amountToThaiWords } from '@/lib/thaiNumber';
import { prepareTtsText } from '@/lib/tts-helper';
import '@/app/overlay/overlay.css';
import '@/app/overlay/widgets.css';
import '@/app/overlay/timer/timer.css';

export default function OverlayScenePage() {
  const [layout, setLayout] = useState<StudioSceneLayout>(defaultSceneLayout);

  // Widget settings & data
  const [goalApp, setGoalApp] = useState<GoalAppearance>({ ...goalAppearanceDefaults });
  const [goalTitle, setGoalTitle] = useState<string>('เป้าหมายโดเนท');
  const [goalTarget, setGoalTarget] = useState<number>(15000);
  const [goalCurrent, setGoalCurrent] = useState<number>(0);

  const [supporterApp, setSupporterApp] = useState<SupporterAppearance>({ ...supporterDefaults });
  const [donors, setDonors] = useState<Supporter[]>([]);

  const [timerApp, setTimerApp] = useState<TimerAppearance>({ ...defaultTimerAppearance });
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('running');
  const [timerSeconds, setTimerSeconds] = useState<number>(3600);
  const [latestDonor, setLatestDonor] = useState<{ name: string; delta: number; amount?: number } | null>(null);

  // Alert Box State
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(defaultAlertSettings);
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [alertAnimState, setAlertAnimState] = useState<string>('');
  const queueRef = useRef<Donation[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsTimeoutRef = useRef<any>(null);
  const alertStartTimeRef = useRef<number>(0);
  const alertDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedAlertIds = useRef<Set<string>>(new Set());

  // Unlock audio context on user interaction
  const unlockAudio = () => {
    try {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          audioRef.current.currentTime = 0;
        }).catch(() => {});
      }
      if (ttsAudioRef.current && ttsAudioRef.current.paused) {
        ttsAudioRef.current.play().then(() => {
          ttsAudioRef.current?.pause();
          ttsAudioRef.current.currentTime = 0;
        }).catch(() => {});
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      }
    } catch (e) {}
  };

  // Load layout from localStorage
  useEffect(() => {
    document.body.classList.add('widget-overlay-body');
    const saved = getStoredLayout();
    setLayout(saved);

    // Listen for storage changes if user edits in another tab
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'stream_studio_layout') {
        setLayout(getStoredLayout());
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('click', unlockAudio);
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      document.body.classList.remove('widget-overlay-body');
    };
  }, []);

  // Fetch initial widgets data
  const refreshWidgets = async () => {
    try {
      const res = await fetch('/api/widgets', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.goal?.appearance) setGoalApp(data.data.goal.appearance);
        if (data.data.goal?.title) setGoalTitle(data.data.goal.title);
        if (data.data.goal?.target) setGoalTarget(Number(data.data.goal.target));
        if (data.data.goal?.current) setGoalCurrent(Number(data.data.goal.current));

        if (data.data.supporterAppearance) {
          setSupporterApp(data.data.supporterAppearance);
          const mode = data.data.supporterAppearance.supporter_mode || 'daily';
          setDonors(data.data[mode] || []);
        }
      }
    } catch {}

    try {
      const res = await fetch('/api/timer', { cache: 'no-store' });
      const tData = await res.json();
      if (tData.success && tData.data) {
        if (tData.data.appearance) setTimerApp(tData.data.appearance);
        if (tData.data.status) setTimerStatus(tData.data.status);
        if (tData.data.remaining_seconds !== undefined) setTimerSeconds(tData.data.remaining_seconds);
      }
    } catch {}

    try {
      const aRes = await fetch('/api/admin/settings', { cache: 'no-store' });
      const aData = await aRes.json();
      if (aData.success && aData.settings) {
        setAlertSettings(prev => ({ ...prev, ...aData.settings }));
      }
    } catch {}
  };

  useEffect(() => {
    void refreshWidgets();
    const interval = setInterval(() => void refreshWidgets(), 60000);
    return () => clearInterval(interval);
  }, []);

  function dismissAlert() {
    if (alertDismissTimeoutRef.current) {
      clearTimeout(alertDismissTimeoutRef.current);
      alertDismissTimeoutRef.current = null;
    }
    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.currentTime = 0;
      } catch (e) {}
    }
    setAlertAnimState('hide');
    setTimeout(() => {
      setAlertAnimState('');
      setCurrentAlert(null);
      isPlayingRef.current = false;
      processQueue();
    }, 500);
  }

  function scheduleAlertDismiss(delayMs: number) {
    if (alertDismissTimeoutRef.current) {
      clearTimeout(alertDismissTimeoutRef.current);
    }
    alertDismissTimeoutRef.current = setTimeout(() => {
      dismissAlert();
    }, Math.max(delayMs, 0));
  }

  function onTtsEnded() {
    if (!isPlayingRef.current) return;
    const minDurationMs = Math.max(3, Number(alertSettings.alert_duration) || 8) * 1000;
    const elapsed = Date.now() - alertStartTimeRef.current;
    const remainingTime = Math.max(1500, minDurationMs - elapsed);
    scheduleAlertDismiss(remainingTime);
  }

  function speakDonation(item: Donation): boolean {
    const s = alertSettings;
    if (s.tts_enabled !== 'true' && s.tts_enabled !== true) return false;

    const minAmt = parseFloat(String(s.tts_min_amount || 0));
    const itemAmt = parseFloat(String(item.amount || 0));
    if (itemAmt < minAmt) return false;

    const donorName = item.name?.trim() || 'Anonymous';
    const actionText = (s.alert_action_text || 'โดเนทให้').trim();
    const thaiAmount = amountToThaiWords(itemAmt);
    let textToSpeak = `${donorName} ${actionText} ${thaiAmount}`;
    if (item.message && item.message.trim() !== '') {
      textToSpeak += ` ${item.message.trim()}`;
    }
    textToSpeak = prepareTtsText(textToSpeak);
    const volume = Math.min(Math.max(parseFloat(String(s.alert_volume || 80)) / 100, 0), 1);

    if (ttsTimeoutRef.current) {
      clearTimeout(ttsTimeoutRef.current);
    }

    const url = `/api/tts?text=${encodeURIComponent(textToSpeak)}`;
    if (ttsAudioRef.current) {
      ttsAudioRef.current.src = url;
      ttsAudioRef.current.volume = volume;
      ttsAudioRef.current.load();
    }

    ttsTimeoutRef.current = setTimeout(() => {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.play().catch(() => {
          onTtsEnded();
        });
      } else {
        onTtsEnded();
      }
    }, 1200);

    return true;
  }

  // Alert queue processing
  function processQueue() {
    if (isPlayingRef.current || queueRef.current.length === 0) return;
    isPlayingRef.current = true;
    alertStartTimeRef.current = Date.now();
    const item = queueRef.current.shift()!;
    setCurrentAlert(item);

    if (audioRef.current) {
      const soundUrl = (alertSettings.alert_sound_url || '/sounds/alert.mp3').trim();
      if (audioRef.current.src !== soundUrl && !audioRef.current.src.endsWith(soundUrl)) {
        audioRef.current.src = soundUrl;
      }
      const vol = Math.min(Math.max((Number(alertSettings.alert_volume ?? 80)) / 100, 0), 1);
      audioRef.current.volume = vol;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    const willSpeak = speakDonation(item);

    setAlertAnimState('show');

    const minDurationMs = Math.max(3, Number(alertSettings.alert_duration) || 8) * 1000;
    if (!willSpeak) {
      scheduleAlertDismiss(minDurationMs);
    } else {
      scheduleAlertDismiss(Math.max(minDurationMs, 35000));
    }
  }

  function handleIncomingDonation(payload: Donation) {
    if (!payload) return;
    const id = String(payload.id || `scene-alert-${Date.now()}`);
    if (processedAlertIds.current.has(id)) return;
    processedAlertIds.current.add(id);
    if (processedAlertIds.current.size > 200) {
      const first = processedAlertIds.current.values().next().value;
      if (first) processedAlertIds.current.delete(first);
    }

    queueRef.current.push({ ...payload, id });
    processQueue();
    void refreshWidgets();
  }

  // Subscribe to realtime donations & local BroadcastChannel
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('donation-alerts');
      bc.onmessage = (event) => {
        if (event.data?.type === 'donation' && event.data?.payload) {
          handleIncomingDonation(event.data.payload);
        } else if (event.data?.type === 'settings_updated' && event.data?.payload) {
          setAlertSettings(prev => ({ ...prev, ...event.data.payload }));
          void refreshWidgets();
        }
      };
    }

    const channel = supabase.channel('donation-alerts')
      .on('broadcast', { event: 'donation' }, ({ payload }) => {
        if (payload) {
          handleIncomingDonation(payload);
        }
      })
      .on('broadcast', { event: 'settings_updated' }, (payload: any) => {
        if (payload?.payload) {
          setAlertSettings(prev => ({ ...prev, ...payload.payload }));
        }
        void refreshWidgets();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      if (bc) bc.close();
      if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);
      if (alertDismissTimeoutRef.current) clearTimeout(alertDismissTimeoutRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'transparent',
        pointerEvents: 'none',
      }}
    >
      <audio ref={audioRef} src={alertSettings.alert_sound_url || "/sounds/alert.mp3"} preload="auto" />
      <audio
        ref={ttsAudioRef}
        preload="auto"
        onEnded={onTtsEnded}
        onError={() => onTtsEnded()}
      />

      {/* 1. Alert Box */}
      {layout.alert.visible && currentAlert && (
        <div
          style={{
            position: 'absolute',
            left: `${layout.alert.x}%`,
            top: `${layout.alert.y}%`,
            transform: `translate(-50%, -50%) scale(${layout.alert.scale || 1})`,
            transformOrigin: 'center center',
          }}
        >
          <AlertCard
            settings={alertSettings}
            alert={currentAlert}
            animState={alertAnimState}
          />
        </div>
      )}

      {/* 2. Goal Bar */}
      {layout.goal.visible && (
        <div
          style={{
            position: 'absolute',
            left: `${layout.goal.x}%`,
            top: `${layout.goal.y}%`,
            transform: `translate(-50%, -50%) scale(${layout.goal.scale || 1})`,
            transformOrigin: 'center center',
          }}
        >
          <GoalWidget
            title={goalTitle}
            target={goalTarget}
            current={goalCurrent}
            appearance={goalApp}
          />
        </div>
      )}

      {/* 3. Supporters Leaderboard */}
      {layout.supporters.visible && (
        <div
          style={{
            position: 'absolute',
            left: `${layout.supporters.x}%`,
            top: `${layout.supporters.y}%`,
            transform: `translate(-50%, -50%) scale(${layout.supporters.scale || 1})`,
            transformOrigin: 'center center',
          }}
        >
          <SupporterWidget
            donors={donors}
            appearance={supporterApp}
            mode={supporterApp.supporter_mode as any || 'daily'}
          />
        </div>
      )}

      {/* 4. Stream Timer */}
      {layout.timer.visible && (
        <div
          style={{
            position: 'absolute',
            left: `${layout.timer.x}%`,
            top: `${layout.timer.y}%`,
            transform: `translate(-50%, -50%) scale(${layout.timer.scale || 1})`,
            transformOrigin: 'center center',
          }}
        >
          <TimerCard
            appearance={timerApp}
            status={timerStatus}
            displaySeconds={timerSeconds}
            latestDonor={latestDonor}
          />
        </div>
      )}
    </div>
  );
}
