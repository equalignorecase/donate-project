'use client';

import React, { useEffect, useState, useMemo } from 'react';
import './timer.css';
import { formatTimerDisplay, formatDeltaDisplay, formatDeltaMinutes } from '@/lib/timerLogic';
import { TimerAction, TimerAppearance, TimerRule, TimerStatus } from '@/lib/timerTypes';

export interface FloatingBadge {
  id: string;
  delta: number;
  donorName: string;
  amount?: number;
}

export interface TimerCardProps {
  appearance: TimerAppearance;
  status: TimerStatus;
  displaySeconds: number;
  latestDonor?: { name: string; delta: number; amount?: number } | null;
  floatingBadges?: FloatingBadge[];
  pulseClass?: string;
  urlBgOverride?: boolean | null;
  urlShadowOverride?: boolean | null;
  urlShadowColor?: string | null;
  urlShadowBlur?: number | null;
  urlFontOverride?: string | null;
  baseRate?: {
    enabled: boolean;
    amount: number;
    seconds: number;
    action: TimerAction;
  };
  tierRules?: TimerRule[];
}

function formatRateDuration(seconds: number): string {
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  if (h > 0) return `${h} ชม.${m > 0 ? ` ${m} นาที` : ''}`;
  if (m > 0 && s === 0) return `${m} นาที`;
  if (m > 0) return `${m} นาที ${s} วิ`;
  return `${s} วิ`;
}

export default function TimerCard({
  appearance,
  status,
  displaySeconds,
  latestDonor,
  floatingBadges = [],
  pulseClass = '',
  urlBgOverride = null,
  urlShadowOverride = null,
  urlShadowColor = null,
  urlShadowBlur = null,
  urlFontOverride = null,
  baseRate,
  tierRules = [],
}: TimerCardProps) {
  const { formatted, isZero } = formatTimerDisplay(displaySeconds);

  const isBackgroundVisible =
    urlBgOverride !== null
      ? urlBgOverride
      : appearance.show_background !== undefined
      ? appearance.show_background
      : true;

  const isShadowEnabled =
    urlShadowOverride !== null
      ? urlShadowOverride
      : appearance.show_digits_shadow !== false;

  const shadowX = appearance.digits_shadow_x ?? 0;
  const shadowY = appearance.digits_shadow_y ?? 2;
  const shadowBlur = urlShadowBlur !== null ? urlShadowBlur : (appearance.digits_shadow_blur ?? 8);
  const shadowColor = urlShadowColor || appearance.digits_shadow_color || '#000000';

  const digitsTextShadow = isShadowEnabled
    ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
    : 'none';

  const themeClass = `timer-theme-${appearance.theme || 'glass'}`;
  const opacityHex = Math.round(Number(appearance.opacity || 90) * 2.55)
    .toString(16)
    .padStart(2, '0');

  const activeFont = urlFontOverride || appearance.font || 'LINESeedSansTH';

  const containerStyle: React.CSSProperties = {
    fontFamily: `'${activeFont}', sans-serif`,
    width: `${appearance.width || 480}px`,
    maxWidth: '100%',
    padding: isBackgroundVisible
      ? `${appearance.padding || 24}px`
      : `${Math.min(appearance.padding || 16, 20)}px 12px`,
    borderRadius: isBackgroundVisible ? `${appearance.radius || 20}px` : '0px',
    borderColor: isBackgroundVisible ? (appearance.border_color || '#334155') : 'transparent',
    color: appearance.text_color || '#ffffff',
    backgroundColor: isBackgroundVisible
      ? `${appearance.bg_color || '#0f172a'}${opacityHex}`
      : 'transparent',
    boxShadow: isBackgroundVisible ? undefined : 'none',
    border: isBackgroundVisible ? undefined : 'none',
    backdropFilter: isBackgroundVisible ? undefined : 'none',
    WebkitBackdropFilter: isBackgroundVisible ? undefined : 'none',
    '--timer-accent': appearance.accent_color || '#38bdf8',
    '--digits-text-shadow': digitsTextShadow,
  } as React.CSSProperties;

  const isCardBeamEnabled = appearance.timer_card_beam !== false && isBackgroundVisible;
  const isDigitsShineEnabled = appearance.timer_shine_sweep !== false;
  const shineTheme = appearance.timer_shine_theme || 'cyan';

  // Construct Rate Items list
  const rateItems = useMemo(() => {
    const items: Array<{ id: string; text: string; badge?: string }> = [];

    if (baseRate && baseRate.enabled && baseRate.amount > 0 && baseRate.seconds > 0) {
      const actionSymbol = baseRate.action === 'subtract' ? '-' : '+';
      items.push({
        id: 'base-rate',
        text: `ทุก ฿${baseRate.amount.toLocaleString('th-TH')} = ${actionSymbol}${formatRateDuration(baseRate.seconds)}`,
        badge: 'เรทหลัก'
      });
    }

    if (Array.isArray(tierRules)) {
      tierRules.forEach((rule, idx) => {
        if (!rule || rule.amount <= 0) return;
        const actionSymbol = rule.action === 'subtract' ? '-' : '+';
        const durationText = formatRateDuration(rule.seconds);
        const text = rule.label?.trim()
          ? rule.label
          : `฿${rule.amount.toLocaleString('th-TH')} = ${actionSymbol}${durationText}`;
        items.push({
          id: rule.id || `tier-${idx}`,
          text,
          badge: 'กฎพิเศษ'
        });
      });
    }

    return items;
  }, [baseRate, tierRules]);

  // Cycle rate items smoothly
  const [rateIdx, setRateIdx] = useState<number>(0);
  useEffect(() => {
    if (rateItems.length <= 1) return;
    const interval = setInterval(() => {
      setRateIdx(prev => (prev + 1) % rateItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [rateItems.length]);

  const activeRate = rateItems[rateIdx % rateItems.length];

  return (
    <div
      className={`timer-widget-container ${themeClass} ${!isBackgroundVisible ? 'no-background' : ''}`}
      style={containerStyle}
    >
      {/* Card Specular Beam Sweep (เหมือนหลอดโด) */}
      {isCardBeamEnabled && (
        <div className="widget-card-beam-sweep" aria-hidden="true">
          <span className="widget-card-beam" />
          <span className="widget-card-sparkle" />
        </div>
      )}

      {/* Floating Animation Badges */}
      {floatingBadges.length > 0 && (
        <div className="timer-floating-badge-container">
          {floatingBadges.map(badge => (
            <div
              key={badge.id}
              className={`timer-floating-badge ${badge.delta >= 0 ? 'badge-add' : 'badge-subtract'}`}
            >
              <span className="badge-donor-name">
                {badge.donorName}
                {typeof badge.amount === 'number' && badge.amount > 0 && (
                  <span className="badge-donor-amount"> ฿{badge.amount.toLocaleString('th-TH')}</span>
                )}
              </span>
              <span className="badge-time-delta">{formatDeltaMinutes(badge.delta)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Header Title */}
      {appearance.show_title && (
        <div className="timer-header">
          <span
            className="timer-title-text"
            style={{
              fontSize: `${appearance.title_size || 16}px`,
              color: appearance.accent_color || '#38bdf8',
            }}
          >
            {appearance.title || '⏱️ SUBATHON TIMER'}
          </span>

          {status === 'paused' && (
            <span className="timer-status-badge status-badge-paused">PAUSED</span>
          )}
          {status === 'stopped' && isZero && (
            <span className="timer-status-badge status-badge-ended">ENDED</span>
          )}
        </div>
      )}

      {/* Countdown Digits */}
      <div
        className={`timer-digits-wrapper ${pulseClass} ${isZero ? 'timer-zero-warning' : ''}`}
        style={{ fontSize: `${appearance.digits_size || 54}px` }}
      >
        <span
          className={`timer-digits ${isDigitsShineEnabled ? `timer-shimmer-sweep timer-shine-theme-${shineTheme}` : ''}`}
          style={{
            fontFamily: `'${activeFont}', sans-serif`,
            textShadow: digitsTextShadow,
            ['--digits-color' as any]: appearance.text_color || '#ffffff'
          }}
        >
          {formatted}
        </span>
      </div>

      {/* Rate / Rules Banner (โอนกี่บาท = กี่นาที) */}
      {appearance.show_rate_banner !== false && activeRate && (
        <div className="timer-rate-banner" key={activeRate.id}>
          <span className="timer-rate-icon" aria-hidden="true">💡</span>
          <span className="timer-rate-text">{activeRate.text}</span>
          {rateItems.length > 1 && (
            <span className="timer-rate-badge">{activeRate.badge}</span>
          )}
        </div>
      )}

      {/* Footer / Latest Donor */}
      {appearance.show_donor_badge && latestDonor && (
        <div className="timer-footer">
          <span className="timer-latest-donor">
            <span>ล่าสุด:</span>
            <strong>{latestDonor.name}</strong>
            {typeof latestDonor.amount === 'number' && latestDonor.amount > 0 && (
              <span className="timer-latest-amount">฿{latestDonor.amount.toLocaleString('th-TH')}</span>
            )}
            <span style={{ color: latestDonor.delta >= 0 ? '#4ade80' : '#f87171' }}>
              ({formatDeltaMinutes(latestDonor.delta)})
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
