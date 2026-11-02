'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Donation, AlertSettings } from '@/lib/types/database';
import {
  StudioSceneLayout,
  defaultSceneLayout,
  getStoredLayout,
  saveStoredLayout,
  parseSceneLayout
} from '@/lib/studioLayout';
import GoalWidget from '@/app/overlay/goal/GoalWidget';
import SupporterWidget from '@/app/overlay/supporters/SupporterWidget';
import TimerCard from '@/app/overlay/timer/TimerCard';
import AlertCard, { defaultAlertSettings } from '@/app/overlay/alert/AlertCard';
import { goalAppearanceDefaults, GoalAppearance } from '@/lib/goalAppearance';
import { supporterDefaults, SupporterAppearance } from '@/lib/supporterAppearance';
import { defaultTimerAppearance, TimerAppearance, TimerStatus } from '@/lib/timerTypes';
import { Supporter } from '@/lib/widgets';
import { useAlertQueue } from '@/app/overlay/useAlertQueue';
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
  const {
    currentAlert,
    alertAnimState,
    audioRef,
    ttsAudioRef,
    unlockAudio,
    enqueueDonation,
    dismissAlert,
    onTtsEnded,
    handleTtsAudioError
  } = useAlertQueue(alertSettings);

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
      const aRes = await fetch('/api/settings', { cache: 'no-store' });
      const aData = await aRes.json();
      if (aData.success && aData.settings) {
        setAlertSettings(prev => ({ ...prev, ...aData.settings }));
        const remoteLayout = parseSceneLayout(aData.settings.stream_studio_layout);
        if (remoteLayout) {
          setLayout(remoteLayout);
          saveStoredLayout(remoteLayout);
        }
      }
    } catch {}
  };

  useEffect(() => {
    void refreshWidgets();
    const interval = setInterval(() => void refreshWidgets(), 60000);
    return () => clearInterval(interval);
  }, []);

  function handleIncomingDonation(payload: Donation) {
    if (!payload) return;
    enqueueDonation(payload);
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
          const remoteLayout = parseSceneLayout(event.data.payload.stream_studio_layout);
          if (remoteLayout) {
            setLayout(remoteLayout);
            saveStoredLayout(remoteLayout);
          }
          void refreshWidgets();
        } else if (event.data?.type === 'skip_alert') {
          dismissAlert();
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
          const remoteLayout = parseSceneLayout(payload.payload.stream_studio_layout);
          if (remoteLayout) {
            setLayout(remoteLayout);
            saveStoredLayout(remoteLayout);
          }
        }
        void refreshWidgets();
      })
      .on('broadcast', { event: 'skip_alert' }, () => {
        dismissAlert();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      if (bc) bc.close();
    };
  }, [enqueueDonation, dismissAlert]);

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
        onError={handleTtsAudioError}
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
