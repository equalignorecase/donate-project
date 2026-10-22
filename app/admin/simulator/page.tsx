'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Monitor,
  Play,
  RotateCcw,
  Copy,
  ExternalLink,
  Check,
  Gamepad2,
  Palette,
  Grid,
  Eye,
  Video,
  Layers,
  Sparkles,
  Move
} from 'lucide-react';
import { useAdmin } from '../AdminContext';
import {
  StudioSceneLayout,
  defaultSceneLayout,
  getStoredLayout,
  saveStoredLayout,
  SNAP_PRESETS
} from '@/lib/studioLayout';
import GoalWidget from '@/app/overlay/goal/GoalWidget';
import SupporterWidget from '@/app/overlay/supporters/SupporterWidget';
import TimerCard from '@/app/overlay/timer/TimerCard';
import AlertCard, { defaultAlertSettings, getAlertTier } from '@/app/overlay/alert/AlertCard';
import { goalAppearanceDefaults, GoalAppearance } from '@/lib/goalAppearance';
import { supporterDefaults, SupporterAppearance } from '@/lib/supporterAppearance';
import { defaultTimerAppearance, TimerAppearance } from '@/lib/timerTypes';
import { AlertSettings } from '@/lib/types/database';
import { supabase } from '@/lib/supabaseClient';
import { Supporter } from '@/lib/widgets';
import { amountToThaiWords } from '@/lib/thaiNumber';
import './simulator.css';
import '@/app/overlay/overlay.css';
import '@/app/overlay/widgets.css';

const exampleDonors: Supporter[] = [
  { name: 'คุณสมชายใจดี', amount: 2500 },
  { name: 'น้องฟ้าใส', amount: 1800 },
  { name: 'พี่บอยสตูดิโอ', amount: 1200 },
  { name: 'CatGamer', amount: 800 },
  { name: 'ผู้สนับสนุนนิรนาม', amount: 500 },
];

export default function SimulatorPage() {
  const { showToast } = useAdmin();
  const [layout, setLayout] = useState<StudioSceneLayout>(defaultSceneLayout);
  const [selectedWidget, setSelectedWidget] = useState<keyof StudioSceneLayout | null>('alert');
  const [previewBackdrop, setPreviewBackdrop] = useState<'gaming' | 'chatting' | 'neon' | 'checker' | 'green' | 'dark'>('gaming');
  const [copied, setCopied] = useState(false);

  // Simulation Alert State
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(defaultAlertSettings);
  const [alertSimKey, setAlertSimKey] = useState(0);
  const [alertAnimState, setAlertAnimState] = useState<'idle' | 'show' | 'hide'>('idle');
  const [alertSample, setAlertSample] = useState({
    name: 'คุณสมศักดิ์ นาวา',
    amount: 500,
    message: 'ยินดีด้วยกับการสตรีมครับ! ขอให้ยอดปังๆ สนุกมากๆ ครับ 💖'
  });

  // Widget settings loaded from API (or fallback defaults)
  const [goalApp, setGoalApp] = useState<GoalAppearance>({ ...goalAppearanceDefaults });
  const [supporterApp, setSupporterApp] = useState<SupporterAppearance>({ ...supporterDefaults });
  const [timerApp, setTimerApp] = useState<TimerAppearance>({ ...defaultTimerAppearance });
  const [goalTarget, setGoalTarget] = useState<number>(15000);
  const [goalCurrent, setGoalCurrent] = useState<number>(7500);

  // Dragging state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingWidget, setDraggingWidget] = useState<keyof StudioSceneLayout | null>(null);
  const dragOffsetRef = useRef<{ startX: number; startY: number; initWidgetX: number; initWidgetY: number }>({
    startX: 0,
    startY: 0,
    initWidgetX: 0,
    initWidgetY: 0
  });

  // Resizing state
  const [resizingWidget, setResizingWidget] = useState<keyof StudioSceneLayout | null>(null);
  const resizeStartRef = useRef<{
    centerX: number;
    centerY: number;
    startDist: number;
    startScale: number;
  }>({
    centerX: 0,
    centerY: 0,
    startDist: 0,
    startScale: 1
  });

  // Audio and timer for simulated alert
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const simTtsAudioRef = useRef<HTMLAudioElement | null>(null);
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const simTtsTimeoutRef = useRef<any>(null);

  // Load layout from localStorage
  useEffect(() => {
    const saved = getStoredLayout();
    setLayout(saved);
  }, []);

  // Fetch real widget appearances & alert settings from API
  useEffect(() => {
    fetch('/api/widgets')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          if (res.data.goal?.appearance) setGoalApp(res.data.goal.appearance);
          if (res.data.goal?.target) setGoalTarget(Number(res.data.goal.target));
          if (res.data.goal?.current) setGoalCurrent(Number(res.data.goal.current));
          if (res.data.supporterAppearance) setSupporterApp(res.data.supporterAppearance);
        }
      })
      .catch(() => {});

    fetch('/api/timer')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data?.appearance) {
          setTimerApp(res.data.appearance);
        }
      })
      .catch(() => {});

    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.settings) {
          setAlertSettings(prev => ({ ...prev, ...res.settings }));
        }
      })
      .catch(() => {});

    const channel = supabase.channel('donation-alerts')
      .on('broadcast', { event: 'settings_updated' }, (payload: any) => {
        if (payload?.payload) {
          setAlertSettings(prev => ({ ...prev, ...payload.payload }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, []);

  // Save layout helper
  const updateLayout = useCallback((next: StudioSceneLayout) => {
    setLayout(next);
    saveStoredLayout(next);
  }, []);

  // Toggle widget visibility
  const toggleWidget = (key: keyof StudioSceneLayout) => {
    const next = {
      ...layout,
      [key]: {
        ...layout[key],
        visible: !layout[key].visible
      }
    };
    updateLayout(next);
    showToast(`${layout[key].visible ? 'ซ่อน' : 'แสดง'} ${getWidgetName(key)} แล้ว`);
  };

  // Snap selected widget to preset
  const applySnap = (x: number, y: number) => {
    if (!selectedWidget) return;
    const next = {
      ...layout,
      [selectedWidget]: {
        ...layout[selectedWidget],
        x,
        y
      }
    };
    updateLayout(next);
    showToast(`ย้าย ${getWidgetName(selectedWidget)} ไปที่ X: ${x}%, Y: ${y}%`);
  };

  // Reset scale of selected widget
  const handleResetScale = () => {
    if (!selectedWidget) return;
    const next = {
      ...layout,
      [selectedWidget]: {
        ...layout[selectedWidget],
        scale: 1
      }
    };
    updateLayout(next);
    showToast(`รีเซ็ตขนาด ${getWidgetName(selectedWidget)} เป็น 100% เรียบร้อย`);
  };

  // Reset to default
  const handleResetLayout = () => {
    updateLayout(defaultSceneLayout);
    showToast('คืนค่าตำแหน่งและขนาดทุกวิดเจ็ตเป็นค่าเริ่มต้นเรียบร้อย');
  };

  // Copy OBS Overlay Scene URL
  const handleCopyObsUrl = () => {
    const url = `${window.location.origin}/overlay/scene`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      showToast('คัดลอกลิงก์ OBS Scene URL แล้ว! นำไปใส่ใน OBS Browser Source ได้เลย');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Trigger test donation alert
  const triggerTestAlert = (customAmt?: number, customName?: string, customMsg?: string) => {
    if (alertTimerRef.current) {
      clearTimeout(alertTimerRef.current);
      alertTimerRef.current = null;
    }
    if (simTtsTimeoutRef.current) {
      clearTimeout(simTtsTimeoutRef.current);
      simTtsTimeoutRef.current = null;
    }

    const amountVal = customAmt !== undefined ? customAmt : (Number(alertSample.amount) || 500);
    const nameVal = customName || alertSample.name || 'คุณสมศักดิ์ นาวา';
    const msgVal = customMsg !== undefined ? customMsg : (alertSample.message || 'ยินดีด้วยกับการสตรีมครับ!');

    setAlertSample({
      name: nameVal,
      amount: amountVal,
      message: msgVal
    });

    setAlertSimKey(k => k + 1);
    setAlertAnimState('show');

    const vol = Math.min(Math.max((Number(alertSettings.alert_volume ?? 80)) / 100, 0), 1);
    if (alertAudioRef.current) {
      const soundUrl = (alertSettings.alert_sound_url || '/sounds/alert.mp3').trim();
      if (alertAudioRef.current.src !== soundUrl && !alertAudioRef.current.src.endsWith(soundUrl)) {
        alertAudioRef.current.src = soundUrl;
      }
      alertAudioRef.current.volume = vol;
      alertAudioRef.current.currentTime = 0;
      alertAudioRef.current.play().catch(() => {});
    }

    const testPayload = {
      id: 'test-sim-' + Date.now(),
      name: nameVal,
      amount: amountVal,
      message: msgVal,
      sender_bank: 'SIMULATOR',
      created_at: new Date().toLocaleTimeString('th-TH'),
      isTest: true
    };

    // Broadcast to open OBS overlay tabs via BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('donation-alerts');
        bc.postMessage({ type: 'donation', payload: testPayload });
        bc.close();
      } catch (e) {}
    }

    const duration = Math.max(3, Number(alertSettings.alert_duration) || 6);

    const scheduleDismiss = (delayMs: number) => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => {
        setAlertAnimState('hide');
        alertTimerRef.current = setTimeout(() => {
          setAlertAnimState('idle');
          alertTimerRef.current = null;
        }, 380);
      }, Math.max(delayMs, 0));
    };

    // TTS speech preview in simulator
    const ttsEnabled = alertSettings.tts_enabled === 'true' || alertSettings.tts_enabled === true;
    const minAmt = Number(alertSettings.tts_min_amount || 0);
    if (ttsEnabled && testPayload.amount >= minAmt) {
      const thaiAmt = amountToThaiWords(testPayload.amount);
      const actionText = (alertSettings.alert_action_text || 'โดเนทให้').trim();
      const textToSpeak = `${testPayload.name} ${actionText} ${thaiAmt} ${testPayload.message}`;
      const url = `/api/tts?text=${encodeURIComponent(textToSpeak)}`;

      if (simTtsAudioRef.current) {
        simTtsAudioRef.current.src = url;
        simTtsAudioRef.current.volume = vol;
        simTtsAudioRef.current.load();
      }

      simTtsTimeoutRef.current = setTimeout(() => {
        if (simTtsAudioRef.current) {
          simTtsAudioRef.current.play().catch(() => {});
        }
      }, 1200);

      // Safety guard timeout
      scheduleDismiss(35000);
    } else {
      scheduleDismiss(duration * 1000);
    }
  };

  const handleSimTtsEnded = () => {
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => {
      setAlertAnimState('hide');
      alertTimerRef.current = setTimeout(() => {
        setAlertAnimState('idle');
        alertTimerRef.current = null;
      }, 380);
    }, 1500);
  };

  // Drag and drop event handlers
  const handlePointerDown = (widgetKey: keyof StudioSceneLayout, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedWidget(widgetKey);
    setDraggingWidget(widgetKey);

    dragOffsetRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initWidgetX: layout[widgetKey].x,
      initWidgetY: layout[widgetKey].y
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Corner resize pointer down handler
  const handleResizePointerDown = (widgetKey: keyof StudioSceneLayout, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedWidget(widgetKey);
    setResizingWidget(widgetKey);

    const target = (e.currentTarget as HTMLElement).closest('.simulator-widget-draggable') as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const startDist = Math.hypot(e.clientX - centerX, e.clientY - centerY) || 1;

      resizeStartRef.current = {
        centerX,
        centerY,
        startDist,
        startScale: layout[widgetKey].scale || 1
      };
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (resizingWidget) {
      const currentDist = Math.hypot(
        e.clientX - resizeStartRef.current.centerX,
        e.clientY - resizeStartRef.current.centerY
      );
      let newScale = Math.round((resizeStartRef.current.startScale * (currentDist / resizeStartRef.current.startDist)) * 100) / 100;
      newScale = Math.max(0.4, Math.min(2.5, newScale));

      setLayout(prev => ({
        ...prev,
        [resizingWidget]: {
          ...prev[resizingWidget],
          scale: newScale
        }
      }));
      return;
    }

    if (!draggingWidget || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaXPixels = e.clientX - dragOffsetRef.current.startX;
    const deltaYPixels = e.clientY - dragOffsetRef.current.startY;

    const deltaXPercent = (deltaXPixels / rect.width) * 100;
    const deltaYPercent = (deltaYPixels / rect.height) * 100;

    let newX = Math.round((dragOffsetRef.current.initWidgetX + deltaXPercent) * 10) / 10;
    let newY = Math.round((dragOffsetRef.current.initWidgetY + deltaYPercent) * 10) / 10;

    // Clamp inside canvas boundary
    newX = Math.max(5, Math.min(95, newX));
    newY = Math.max(5, Math.min(95, newY));

    setLayout(prev => ({
      ...prev,
      [draggingWidget]: {
        ...prev[draggingWidget],
        x: newX,
        y: newY
      }
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingWidget) {
      saveStoredLayout(layout);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setDraggingWidget(null);
    }
    if (resizingWidget) {
      saveStoredLayout(layout);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setResizingWidget(null);
    }
  };

  function getWidgetName(key: keyof StudioSceneLayout): string {
    switch (key) {
      case 'alert': return 'Alert Box (แจ้งเตือน)';
      case 'goal': return 'Goal Bar (หลอดเป้าหมาย)';
      case 'supporters': return 'Supporter (อันดับผู้สนับสนุน)';
      case 'timer': return 'Timer (จับเวลา)';
    }
  }

  return (
    <div className="simulator-container">
      {/* Hidden audio for simulated alert sound and TTS preview */}
      <audio ref={alertAudioRef} src={alertSettings.alert_sound_url || "/sounds/alert.mp3"} preload="auto" />
      <audio
        ref={simTtsAudioRef}
        preload="auto"
        onEnded={handleSimTtsEnded}
        onError={handleSimTtsEnded}
      />

      {/* Header bar */}
      <div className="simulator-header">
        <div className="simulator-title-group">
          <h1>
            <Monitor size={26} color="#3b82f6" />
            <span>จำลองจอไลฟ์สตรีม (Live Stream Studio)</span>
            <span className="simulator-title-badge">OBS 16:9 CANVAS</span>
          </h1>
          <p className="simulator-subtitle">
            จำลองตำแหน่งทุก Widgets บนหน้าจอ 1080p ลากวางจัดวางตำแหน่งอิสระ และนำไปใช้ใน OBS Scene ได้ในลิงก์เดียว
          </p>
        </div>

        <div className="simulator-actions">
          <button
            type="button"
            className="simulator-btn simulator-btn-primary"
            onClick={() => triggerTestAlert()}
            title="ทดสอบเด้งแจ้งเตือนโดเนทจำลอง"
          >
            <Play size={15} />
            <span>ทดสอบยิง Alert</span>
          </button>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', padding: '3px 6px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', marginRight: '4px', fontWeight: 600 }}>Tier:</span>
            <button
              type="button"
              className="simulator-btn sm"
              style={{ padding: '3px 8px', fontSize: '11px', background: 'transparent', border: 'none', color: '#e2e8f0' }}
              onClick={() => triggerTestAlert(20, 'สมชาย ใจดี', 'เป็นกำลังใจให้นะครับ สตรีมสนุกมาก!')}
              title="ทดสอบระดับ Common (20 บาท - สีปกติ)"
            >
              🟢 20฿
            </button>
            <button
              type="button"
              className="simulator-btn sm"
              style={{ padding: '3px 8px', fontSize: '11px', background: 'transparent', border: 'none', color: alertSettings.alert_tiered_rare_color || '#38bdf8' }}
              onClick={() => triggerTestAlert(100, 'ฟ้าใส สดชื่น', 'ชอบสตรีมนี้มากครับ ✨')}
              title="ทดสอบระดับ Rare (100 บาท - สีตัวอักษร Rare)"
            >
              🔵 100฿
            </button>
            <button
              type="button"
              className="simulator-btn sm"
              style={{ padding: '3px 8px', fontSize: '11px', background: 'transparent', border: 'none', color: alertSettings.alert_tiered_epic_color || '#a855f7' }}
              onClick={() => triggerTestAlert(300, 'เสี่ยท็อป สายเปย์', 'ขอให้ยอดปังๆ สู้ๆ 💎')}
              title="ทดสอบระดับ Epic (300 บาท - สีตัวอักษร Epic)"
            >
              🟣 300฿
            </button>
            <button
              type="button"
              className="simulator-btn sm"
              style={{ padding: '3px 8px', fontSize: '11px', background: 'rgba(234, 88, 12, 0.2)', border: '1px solid rgba(234, 88, 12, 0.4)', color: alertSettings.alert_tiered_legendary_color || '#ea580c', borderRadius: '4px' }}
              onClick={() => triggerTestAlert(1000, 'สุลต่าน ใจป๋า', 'เติมพลังให้ครับ สู้ๆ! 👑')}
              title="ทดสอบระดับ Legendary (1,000 บาท - สีตัวอักษร Legendary)"
            >
              🟠 1,000฿
            </button>
          </div>

          <button
            type="button"
            className="simulator-btn simulator-btn-secondary"
            onClick={handleCopyObsUrl}
            title="คัดลอกลิงก์ OBS Scene URL เพื่อนำไปใส่ใน OBS Browser Source"
          >
            {copied ? <Check size={15} color="#22c55e" /> : <Copy size={15} />}
            <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก OBS Scene URL'}</span>
          </button>

          <Link
            href="/overlay/scene"
            target="_blank"
            className="simulator-btn simulator-btn-secondary"
            title="เปิดหน้าจอ OBS Overlay Scene เต็มหน้าต่าง"
          >
            <ExternalLink size={15} />
            <span>เปิดเต็มจอ (/overlay/scene)</span>
          </Link>

          <button
            type="button"
            className="simulator-btn simulator-btn-secondary"
            onClick={handleResetLayout}
            title="คืนค่าตำแหน่งทุกวิดเจ็ตเป็นค่าเริ่มต้น"
          >
            <RotateCcw size={15} />
            <span>รีเซ็ตตำแหน่ง</span>
          </button>
        </div>
      </div>

      {/* Control Strip: Widget Toggles & Backdrop Switcher */}
      <div className="simulator-control-strip">
        {/* Left: Widget show/hide toggles */}
        <div className="simulator-widget-toggles">
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginRight: '6px' }}>
            เปิด/ปิด วิดเจ็ต:
          </span>
          {(['alert', 'goal', 'supporters', 'timer'] as (keyof StudioSceneLayout)[]).map(key => (
            <button
              key={key}
              type="button"
              className={`simulator-toggle-btn ${layout[key].visible ? 'active' : ''}`}
              onClick={() => toggleWidget(key)}
            >
              <span className="simulator-toggle-dot" />
              <span>{getWidgetName(key).split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Right: Backdrop Simulator Switcher */}
        <div className="simulator-backdrop-group">
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginRight: '6px' }}>
            ฉากหลังจำลอง:
          </span>
          <button
            type="button"
            className={`simulator-backdrop-btn ${previewBackdrop === 'gaming' ? 'active' : ''}`}
            onClick={() => setPreviewBackdrop('gaming')}
          >
            <Gamepad2 size={13} />
            <span>เกมมิ่ง</span>
          </button>
          <button
            type="button"
            className={`simulator-backdrop-btn ${previewBackdrop === 'chatting' ? 'active' : ''}`}
            onClick={() => setPreviewBackdrop('chatting')}
          >
            <Video size={13} />
            <span>Just Chatting</span>
          </button>
          <button
            type="button"
            className={`simulator-backdrop-btn ${previewBackdrop === 'neon' ? 'active' : ''}`}
            onClick={() => setPreviewBackdrop('neon')}
          >
            <Palette size={13} />
            <span>นีออน</span>
          </button>
          <button
            type="button"
            className={`simulator-backdrop-btn ${previewBackdrop === 'checker' ? 'active' : ''}`}
            onClick={() => setPreviewBackdrop('checker')}
          >
            <Grid size={13} />
            <span>ตารางใส OBS</span>
          </button>
          <button
            type="button"
            className={`simulator-backdrop-btn ${previewBackdrop === 'green' ? 'active' : ''}`}
            onClick={() => setPreviewBackdrop('green')}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
            <span>Green Screen</span>
          </button>
          <button
            type="button"
            className={`simulator-backdrop-btn ${previewBackdrop === 'dark' ? 'active' : ''}`}
            onClick={() => setPreviewBackdrop('dark')}
          >
            <Eye size={13} />
            <span>มืดสนิท</span>
          </button>
        </div>
      </div>

      {/* Snap Presets Floating Bar */}
      {selectedWidget && (
        <div className="simulator-presets-bar">
          <span className="simulator-presets-label">
            จัดตำแหน่งด่วนสำหรับ <strong>{getWidgetName(selectedWidget)}</strong> (ปัจจุบัน X: {layout[selectedWidget].x}%, Y: {layout[selectedWidget].y}%, ขนาด: {Math.round((layout[selectedWidget].scale || 1) * 100)}%):
          </span>
          {SNAP_PRESETS.map(preset => (
            <button
              key={preset.label}
              type="button"
              className="sim-snap-btn"
              onClick={() => applySnap(preset.x, preset.y)}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            className="sim-snap-btn"
            style={{ background: 'rgba(56, 189, 248, 0.2)', borderColor: '#38bdf8', color: '#ffffff', marginLeft: 'auto' }}
            onClick={handleResetScale}
            title="รีเซ็ตขนาดวิดเจ็ตนี้กลับเป็น 100%"
          >
            ↺ รีเซ็ตขนาด (100%)
          </button>
        </div>
      )}

      {/* Main 16:9 Screen Canvas Simulator */}
      <div className="simulator-screen-outer">
        <div className="simulator-screen-ratio">
          <div
            ref={canvasRef}
            className={`simulator-canvas backdrop-${previewBackdrop}`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Just Chatting Webcam Frame Simulation */}
            {previewBackdrop === 'chatting' && (
              <div className="sim-cam-frame" aria-hidden="true">
                <Video size={32} />
                <span>WEBCAM 1080P</span>
              </div>
            )}

            {/* 1. Donation Alert Box */}
            {layout.alert.visible && (
              <div
                className={`simulator-widget-draggable ${selectedWidget === 'alert' ? 'selected' : ''} ${draggingWidget === 'alert' ? 'is-dragging' : ''}`}
                style={{
                  left: `${layout.alert.x}%`,
                  top: `${layout.alert.y}%`,
                  transform: `translate(-50%, -50%) scale(${layout.alert.scale || 1})`,
                  transformOrigin: 'center center',
                  display: alertAnimState !== 'idle' || selectedWidget === 'alert' ? 'block' : 'none',
                }}
                onPointerDown={e => handlePointerDown('alert', e)}
                onClick={() => setSelectedWidget('alert')}
              >
                {/* 4 Corner Resize Handles */}
                {selectedWidget === 'alert' && (
                  <>
                    <div className="sim-resize-handle sim-resize-tl" onPointerDown={e => handleResizePointerDown('alert', e)} title="ลากเพื่อย่อ-ขยาย" />
                    <div className="sim-resize-handle sim-resize-tr" onPointerDown={e => handleResizePointerDown('alert', e)} title="ลากเพื่อย่อ-ขยาย" />
                    <div className="sim-resize-handle sim-resize-bl" onPointerDown={e => handleResizePointerDown('alert', e)} title="ลากเพื่อย่อ-ขยาย" />
                    <div className="sim-resize-handle sim-resize-br" onPointerDown={e => handleResizePointerDown('alert', e)} title="ลากเพื่อย่อ-ขยาย" />
                  </>
                )}

                <div className="sim-widget-handle-bar">
                  <Move size={12} color="#60a5fa" />
                  <span className="sim-widget-handle-title">Alert Box</span>
                  <span className="sim-widget-handle-coords">X:{layout.alert.x}% Y:{layout.alert.y}%</span>
                  <span className="sim-widget-scale-badge">{Math.round((layout.alert.scale || 1) * 100)}%</span>
                </div>

                <div style={{ pointerEvents: 'none' }}>
                  {alertAnimState !== 'idle' ? (
                    <AlertCard
                      key={`alert-sim-${alertSimKey}`}
                      settings={alertSettings}
                      alert={alertSample}
                      animState={alertAnimState}
                    />
                  ) : (
                    <div className="sim-alert-placeholder">
                      <div className="sim-alert-placeholder-text">
                        📢 พื้นที่แสดง Alert Box (คลิก &quot;ทดสอบยิง Alert&quot; เพื่อดูเอฟเฟกต์)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Donation Goal Bar */}
            {layout.goal.visible && (
              <div
                className={`simulator-widget-draggable ${selectedWidget === 'goal' ? 'selected' : ''} ${draggingWidget === 'goal' ? 'is-dragging' : ''}`}
                style={{
                  left: `${layout.goal.x}%`,
                  top: `${layout.goal.y}%`,
                  transform: `translate(-50%, -50%) scale(${layout.goal.scale || 1})`,
                  transformOrigin: 'center center',
                }}
                onPointerDown={e => handlePointerDown('goal', e)}
                onClick={() => setSelectedWidget('goal')}
              >
                {/* 4 Corner Resize Handles */}
                {selectedWidget === 'goal' && (
                  <>
                    <div className="sim-resize-handle sim-resize-tl" onPointerDown={e => handleResizePointerDown('goal', e)} title="ลากเพื่อย่อ-ขยาย" />
                    <div className="sim-resize-handle sim-resize-tr" onPointerDown={e => handleResizePointerDown('goal', e)} title="ลากเพื่อย่อ-ขยาย" />
                    <div className="sim-resize-handle sim-resize-bl" onPointerDown={e => handleResizePointerDown('goal', e)} title="ลากเพื่อย่อ-ขยาย" />
                    <div className="sim-resize-handle sim-resize-br" onPointerDown={e => handleResizePointerDown('goal', e)} title="ลากเพื่อย่อ-ขยาย" />
                  </>
                )}

                <div className="sim-widget-handle-bar">
                  <Move size={12} color="#60a5fa" />
                  <span className="sim-widget-handle-title">Goal Bar</span>
                  <span className="sim-widget-handle-coords">X:{layout.goal.x}% Y:{layout.goal.y}%</span>
                  <span className="sim-widget-scale-badge">{Math.round((layout.goal.scale || 1) * 100)}%</span>
                </div>
                <div style={{ pointerEvents: 'none' }}>
                  <GoalWidget
                    title="เป้าหมายโดเนทสตรีมเมอร์"
                    target={goalTarget}
                    current={goalCurrent}
                    appearance={goalApp}
                  />
                </div>
              </div>
            )}

            {/* 3. Supporter Leaderboard */}
            {layout.supporters.visible && (
              <div
                className={`simulator-widget-draggable ${selectedWidget === 'supporters' ? 'selected' : ''} ${draggingWidget === 'supporters' ? 'is-dragging' : ''}`}
                style={{
                  left: `${layout.supporters.x}%`,
                  top: `${layout.supporters.y}%`,
                  transform: `translate(-50%, -50%) scale(${layout.supporters.scale || 1})`,
                  transformOrigin: 'center center',
                }}
                onPointerDown={e => handlePointerDown('supporters', e)}
                onClick={() => setSelectedWidget('supporters')}
              >
                {/* 4 Corner Resize Handles */}
                {selectedWidget === 'supporters' && (
                  <>
                    <div className="sim-resize-handle sim-resize-tl" onPointerDown={e => handleResizePointerDown('supporters', e)} title="ลากเพื่อย่อ-ขยาย" />
                    <div className="sim-resize-handle sim-resize-tr" onPointerDown={e => handleResizePointerDown('supporters', e)} title="ลากเพื่อย่อ-ขยาย" />
                    <div className="sim-resize-handle sim-resize-bl" onPointerDown={e => handleResizePointerDown('supporters', e)} title="ลากเพื่อย่อ-ขยาย" />
                    <div className="sim-resize-handle sim-resize-br" onPointerDown={e => handleResizePointerDown('supporters', e)} title="ลากเพื่อย่อ-ขยาย" />
                  </>
                )}

                <div className="sim-widget-handle-bar">
                  <Move size={12} color="#60a5fa" />
                  <span className="sim-widget-handle-title">Supporters Ranking</span>
                  <span className="sim-widget-handle-coords">X:{layout.supporters.x}% Y:{layout.supporters.y}%</span>
                  <span className="sim-widget-scale-badge">{Math.round((layout.supporters.scale || 1) * 100)}%</span>
                </div>
                <div style={{ pointerEvents: 'none' }}>
                  <SupporterWidget
                    donors={exampleDonors}
                    appearance={supporterApp}
                    mode={supporterApp.supporter_mode as any || 'daily'}
                  />
                </div>
              </div>
            )}

            {/* 4. Stream Timer */}
            {layout.timer.visible && (
              <div
                className={`simulator-widget-draggable ${selectedWidget === 'timer' ? 'selected' : ''} ${draggingWidget === 'timer' ? 'is-dragging' : ''}`}
                style={{
                  left: `${layout.timer.x}%`,
                  top: `${layout.timer.y}%`,
                  transform: `translate(-50%, -50%) scale(${layout.timer.scale || 1})`,
                  transformOrigin: 'center center',
                }}
                onPointerDown={e => handlePointerDown('timer', e)}
                onClick={() => setSelectedWidget('timer')}
              >
                {/* 4 Corner Resize Handles */}
                {selectedWidget === 'timer' && (
                  <>
                    <div className="sim-resize-handle sim-resize-tl" onPointerDown={e => handleResizePointerDown('timer', e)} title="ลากเพื่อย่อ-ขยาย" />
                    <div className="sim-resize-handle sim-resize-tr" onPointerDown={e => handleResizePointerDown('timer', e)} title="ลากเพื่อย่อ-ขยาย" />
                    <div className="sim-resize-handle sim-resize-bl" onPointerDown={e => handleResizePointerDown('timer', e)} title="ลากเพื่อย่อ-ขยาย" />
                    <div className="sim-resize-handle sim-resize-br" onPointerDown={e => handleResizePointerDown('timer', e)} title="ลากเพื่อย่อ-ขยาย" />
                  </>
                )}

                <div className="sim-widget-handle-bar">
                  <Move size={12} color="#60a5fa" />
                  <span className="sim-widget-handle-title">Stream Timer</span>
                  <span className="sim-widget-handle-coords">X:{layout.timer.x}% Y:{layout.timer.y}%</span>
                  <span className="sim-widget-scale-badge">{Math.round((layout.timer.scale || 1) * 100)}%</span>
                </div>
                <div style={{ pointerEvents: 'none' }}>
                  <TimerCard
                    appearance={timerApp}
                    status="running"
                    displaySeconds={3540}
                    latestDonor={{ name: 'คุณสมชาย', delta: 300, amount: 100 }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
