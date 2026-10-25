'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import './timer.css';
import { supabase } from '@/lib/supabaseClient';
import { computeRemainingSeconds } from '@/lib/timerLogic';
import {
  defaultTimerAppearance,
  TimerAction,
  TimerAppearance,
  TimerEventPayload,
  TimerRule,
  TimerStatus
} from '@/lib/timerTypes';
import TimerCard, { FloatingBadge } from './TimerCard';

export default function TimerOverlayPage() {
  const [status, setStatus] = useState<TimerStatus>('paused');
  const [baseRemaining, setBaseRemaining] = useState<number>(3600);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date(0).toISOString());
  const [appearance, setAppearance] = useState<TimerAppearance>(defaultTimerAppearance);
  const [displaySeconds, setDisplaySeconds] = useState<number>(3600);
  const [pulseClass, setPulseClass] = useState<string>('');
  const [floatingBadges, setFloatingBadges] = useState<FloatingBadge[]>([]);
  const [latestDonor, setLatestDonor] = useState<{
    name: string;
    delta: number;
    amount?: number;
  } | null>(null);

  const [baseRate, setBaseRate] = useState<{
    enabled: boolean;
    amount: number;
    seconds: number;
    action: TimerAction;
  } | undefined>(undefined);
  const [tierRules, setTierRules] = useState<TimerRule[]>([]);

  // Keep refs for event handlers and intervals
  const stateRef = useRef({
    status: 'paused' as TimerStatus,
    baseRemaining: 3600,
    lastUpdatedAt: new Date(0).toISOString()
  });

  useEffect(() => {
    stateRef.current = { status, baseRemaining, lastUpdatedAt };
  }, [status, baseRemaining, lastUpdatedAt]);

  // Initial class on body
  useEffect(() => {
    document.body.classList.add('timer-overlay-body');
    return () => {
      document.body.classList.remove('timer-overlay-body');
    };
  }, []);

  // Fetch initial timer data
  const fetchTimerData = useCallback(async () => {
    try {
      const res = await fetch('/api/timer', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setStatus(data.data.status);
        setBaseRemaining(data.data.remaining_seconds);
        setLastUpdatedAt(data.data.last_updated_at);
        if (data.data.appearance) {
          setAppearance(prev => ({ ...prev, ...data.data.appearance }));
        }
        if (data.data.base_rate_enabled !== undefined) {
          setBaseRate({
            enabled: data.data.base_rate_enabled,
            amount: data.data.base_rate_amount ?? 5,
            seconds: data.data.base_rate_seconds ?? 300,
            action: data.data.base_rate_action ?? 'add'
          });
        }
        if (Array.isArray(data.data.tier_rules)) {
          setTierRules(data.data.tier_rules);
        }
        setDisplaySeconds(data.data.remaining_seconds);
      }
    } catch (err) {
      console.warn('Failed to load timer state:', err);
    }
  }, []);

  // Ref for latest donor auto-hide timer
  const latestDonorTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    return () => {
      if (latestDonorTimerRef.current) {
        clearTimeout(latestDonorTimerRef.current);
      }
    };
  }, []);

  // Trigger floating badge and pulse animation
  const triggerTimeChangeAnimation = useCallback((delta: number, donorName?: string, donorAmount?: number) => {
    if (!delta || delta === 0) return;

    // 1. Add floating badge with optional donor amount
    const badgeId = 'badge-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const newBadge: FloatingBadge = {
      id: badgeId,
      delta,
      donorName: donorName || (delta > 0 ? 'โดเนทเพิ่มเวลา' : 'โดเนทลดเวลา'),
      amount: donorAmount
    };

    setFloatingBadges(prev => [...prev.slice(-3), newBadge]);
    setTimeout(() => {
      setFloatingBadges(prev => prev.filter(b => b.id !== badgeId));
    }, 3200);

    // 2. Pulse effect on digits
    setPulseClass(delta > 0 ? 'timer-pulse-green' : 'timer-pulse-red');
    setTimeout(() => {
      setPulseClass('');
    }, 700);

    // 3. Update footer latest donor and auto-hide after 10 seconds
    if (donorName) {
      setLatestDonor({ name: donorName, delta, amount: donorAmount });
      if (latestDonorTimerRef.current) {
        clearTimeout(latestDonorTimerRef.current);
      }
      latestDonorTimerRef.current = setTimeout(() => {
        setLatestDonor(null);
      }, 10000);
    }
  }, []);

  // Realtime Supabase subscription
  useEffect(() => {
    void fetchTimerData();

    const channel = supabase.channel('donation-alerts');

    channel
      .on('broadcast', { event: 'timer_update' }, (payload: any) => {
        const data = payload.payload as TimerEventPayload & { appearance?: TimerAppearance };
        if (!data) return;

        if (data.status) setStatus(data.status);
        if (typeof data.remaining_seconds === 'number') {
          setBaseRemaining(data.remaining_seconds);
          setDisplaySeconds(data.remaining_seconds);
        }
        if (data.last_updated_at) setLastUpdatedAt(data.last_updated_at);
        if (data.appearance) {
          setAppearance(prev => ({ ...prev, ...data.appearance }));
        }

        if (data.delta_seconds && data.delta_seconds !== 0) {
          triggerTimeChangeAnimation(data.delta_seconds, data.donor_name, data.donor_amount);
        }
      })
      .on('broadcast', { event: 'settings_updated' }, () => {
        void fetchTimerData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTimerData, triggerTimeChangeAnimation]);

  // High-precision countdown loop (zero drift)
  useEffect(() => {
    const interval = setInterval(() => {
      const { status: curStatus, baseRemaining: curRemaining, lastUpdatedAt: curUpdated } = stateRef.current;
      const current = computeRemainingSeconds({
        timer_status: curStatus,
        timer_remaining_seconds: curRemaining,
        timer_last_updated_at: curUpdated
      });

      setDisplaySeconds(current);

      if (current <= 0 && curStatus === 'running') {
        setStatus('stopped');
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // URL query parameter background override (?bg=0, ?bg=false, ?nobg=1, ?transparent=1)
  const [urlBgOverride, setUrlBgOverride] = useState<boolean | null>(null);
  const [urlShadowOverride, setUrlShadowOverride] = useState<boolean | null>(null);
  const [urlShadowColor, setUrlShadowColor] = useState<string | null>(null);
  const [urlShadowBlur, setUrlShadowBlur] = useState<number | null>(null);
  const [urlFontOverride, setUrlFontOverride] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('font');
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('bg')) {
        const val = params.get('bg');
        setUrlBgOverride(val !== '0' && val !== 'false' && val !== 'none');
      } else if (params.has('nobg') || params.has('transparent')) {
        setUrlBgOverride(false);
      }

      if (params.has('shadow')) {
        const s = params.get('shadow');
        setUrlShadowOverride(s !== '0' && s !== 'false' && s !== 'none');
      }
      if (params.has('shadow_color')) {
        const col = params.get('shadow_color');
        if (col) setUrlShadowColor(col.startsWith('#') ? col : `#${col}`);
      }
      if (params.has('shadow_blur')) {
        const b = Number(params.get('shadow_blur'));
        if (!isNaN(b)) setUrlShadowBlur(b);
      }
      if (params.has('font')) {
        const f = params.get('font');
        if (f) setUrlFontOverride(f);
      }
    }
  }, []);

  // Test / preview badge (?test=1, ?preview=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('test') === '1' || params.get('preview') === '1') {
        const timer = setTimeout(() => {
          triggerTimeChangeAnimation(300, 'ผู้ชมตัวอย่าง (ทดสอบ)', 50);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [triggerTimeChangeAnimation]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'transparent',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <TimerCard
        appearance={appearance}
        status={status}
        displaySeconds={displaySeconds}
        latestDonor={latestDonor}
        floatingBadges={floatingBadges}
        pulseClass={pulseClass}
        urlBgOverride={urlBgOverride}
        urlShadowOverride={urlShadowOverride}
        urlShadowColor={urlShadowColor}
        urlShadowBlur={urlShadowBlur}
        urlFontOverride={urlFontOverride}
        baseRate={baseRate}
        tierRules={tierRules}
      />
    </div>
  );
}
