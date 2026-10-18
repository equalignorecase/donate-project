'use client';

import React from 'react';
import './timer.css';
import { formatTimerDisplay, formatDeltaDisplay } from '@/lib/timerLogic';
import { TimerAppearance, TimerStatus } from '@/lib/timerTypes';

export interface FloatingBadge {
  id: string;
  delta: number;
  donorName: string;
}

export interface TimerCardProps {
  appearance: TimerAppearance;
  status: TimerStatus;
  displaySeconds: number;
  latestDonor?: { name: string; delta: number; amount?: number } | null;
  floatingBadges?: FloatingBadge[];
  pulseClass?: string;
  urlBgOverride?: boolean | null;
}

export default function TimerCard({
  appearance,
  status,
  displaySeconds,
  latestDonor,
  floatingBadges = [],
  pulseClass = '',
  urlBgOverride = null,
}: TimerCardProps) {
  const { formatted, isZero } = formatTimerDisplay(displaySeconds);

  const isBackgroundVisible =
    urlBgOverride !== null
      ? urlBgOverride
      : appearance.show_background !== undefined
      ? appearance.show_background
      : true;

  const isShadowEnabled = appearance.show_digits_shadow !== false;
  const shadowX = appearance.digits_shadow_x ?? 0;
  const shadowY = appearance.digits_shadow_y ?? 2;
  const shadowBlur = appearance.digits_shadow_blur ?? 8;
  const shadowColor = appearance.digits_shadow_color || '#000000';

  const digitsTextShadow = isShadowEnabled
    ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
    : 'none';

  const themeClass = `timer-theme-${appearance.theme || 'glass'}`;
  const opacityHex = Math.round(Number(appearance.opacity || 90) * 2.55)
    .toString(16)
    .padStart(2, '0');

  const containerStyle: React.CSSProperties = {
    fontFamily: `'${appearance.font || 'LINESeedSansTH'}', sans-serif`,
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

      {floatingBadges.length > 0 && (
        <div className="timer-floating-badge-container">
          {floatingBadges.map(badge => (
            <div
              key={badge.id}
              className={`timer-floating-badge ${badge.delta >= 0 ? 'badge-add' : 'badge-subtract'}`}
            >
              <span className="badge-donor-name">{badge.donorName}</span>
              <span className="badge-time-delta">{formatDeltaDisplay(badge.delta)}</span>
            </div>
          ))}
        </div>
      )}

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

      <div
        className={`timer-digits-wrapper ${pulseClass} ${isZero ? 'timer-zero-warning' : ''}`}
        style={{ fontSize: `${appearance.digits_size || 54}px` }}
      >
        <span
          className={`timer-digits ${isDigitsShineEnabled ? `timer-shimmer-sweep timer-shine-theme-${shineTheme}` : ''}`}
          style={{
            fontFamily: `'${appearance.font || 'LINESeedSansTH'}', sans-serif`,
            textShadow: digitsTextShadow,
            ['--digits-color' as any]: appearance.text_color || '#ffffff'
          }}
        >
          {formatted}
        </span>
      </div>

      {appearance.show_donor_badge && latestDonor && (
        <div className="timer-footer">
          <span className="timer-latest-donor">
            <span>ล่าสุด:</span>
            <strong>{latestDonor.name}</strong>
            <span style={{ color: latestDonor.delta >= 0 ? '#4ade80' : '#f87171' }}>
              ({formatDeltaDisplay(latestDonor.delta)})
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
