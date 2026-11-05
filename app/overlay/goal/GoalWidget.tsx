'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoalAppearance, goalAppearanceDefaults, formatGoalDuration } from '@/lib/goalAppearance';
import { Clock } from 'lucide-react';
import { playGoalFanfare } from '@/lib/goalAudio';
import { supabase } from '@/lib/supabaseClient';
import '../widgets.css';

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(15, 23, 42, ${alpha})`;
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 0;
    const g = parseInt(clean[1] + clean[1], 16) || 0;
    const b = parseInt(clean[2] + clean[2], 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.length !== 6) return `rgba(15, 23, 42, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function GoalWidget({ 
  title, 
  target, 
  current, 
  appearance = goalAppearanceDefaults 
}: { 
  title: string; 
  target: number; 
  current: number; 
  appearance?: GoalAppearance 
}) {
  const safeTarget = Number.isFinite(target) && target > 0 ? target : 15000;
  const fillPercent = Math.min(100, Math.max(0, (current / safeTarget) * 100));
  const displayPercent = Math.max(0, (current / safeTarget) * 100);
  const percent = fillPercent;
  const money = (value: number) => value.toLocaleString('th-TH', { maximumFractionDigits: 0 });
  const effectivePattern = appearance.goal_bar_pattern || (appearance.goal_bar_style === 'striped' ? 'stripes' : 'none');
  const patternOpacity = Math.max(0, Math.min(100, Number(appearance.goal_bar_pattern_opacity ?? 80))) / 100;
  const isHUD = appearance.goal_bar_style === 'hud';
  const isMilestone = appearance.goal_bar_style === 'milestone';
  const isFloating = appearance.goal_bar_style === 'floating';
  const isFlat = ['slim', 'segmented', 'hud', 'milestone', 'floating'].includes(appearance.goal_bar_style);
  const isSegmented = appearance.goal_bar_style === 'segmented';
  const hasGloss = !isFlat && appearance.goal_bar_style !== 'minimal';

  // Unfilled Track: สีดำแบบโปร่งแสงพร้อม backdrop blur เมื่อหลอดยังไม่เต็ม
  const trackBlur = Math.max(0, Math.min(40, Number(appearance.goal_track_blur ?? 12)));
  const trackOpacity = Math.max(0, Math.min(100, Number(appearance.goal_track_opacity ?? 45))) / 100;
  const hex = (appearance.goal_track_color ?? '#000000').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const trackBg = `rgba(${r}, ${g}, ${b}, ${trackOpacity})`;

  const cardOpacity = Number(appearance.goal_opacity ?? 0);
  const isCardTransparent = cardOpacity <= 0;
  const barStart = appearance.goal_bar_color || '#0038ff';
  const barEnd = appearance.goal_bar_end_color || barStart;
  const barBackground = appearance.goal_gradient === 'true'
    ? `linear-gradient(90deg, ${barStart}, ${barEnd})`
    : barStart;
  const isTextInside = appearance.goal_text_inside !== 'false';
  const isOverchargeEnabled = appearance.goal_overcharge_enabled !== 'false';
  const isSoundEnabled = appearance.goal_overcharge_sound !== 'false';
  const isOvercharged = isOverchargeEnabled && displayPercent >= 100;
  const [showSupernova, setShowSupernova] = useState(false);
  const prevPercentRef = useRef(displayPercent);

  const triggerBurst = () => {
    setShowSupernova(true);
    if (isSoundEnabled) playGoalFanfare();
    setTimeout(() => setShowSupernova(false), 3200);
  };

  useEffect(() => {
    if (displayPercent >= 100 && prevPercentRef.current < 100 && isOverchargeEnabled) {
      triggerBurst();
    }
    prevPercentRef.current = displayPercent;
  }, [displayPercent, isOverchargeEnabled, isSoundEnabled]);

  useEffect(() => {
    const channel = supabase.channel('goal-overcharge-events')
      .on('broadcast', { event: 'test_burst' }, () => {
        triggerBurst();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSoundEnabled]);
  const isShowDuration = appearance.goal_show_duration === 'true';
  const durationText = isShowDuration ? formatGoalDuration(appearance.goal_end_date, appearance.goal_duration_text) : '';
  const durationStyle = appearance.goal_duration_style || 'glass';
  const durationPosition = appearance.goal_duration_position || 'top';
  const durationColor = appearance.goal_duration_color || '#e0f2fe';
  const durationBgColor = appearance.goal_duration_bg_color || '#0f172a';
  const durationBgOpacity = Math.max(0, Math.min(100, Number(appearance.goal_duration_bg_opacity ?? 70))) / 100;
  const durationBorderColor = appearance.goal_duration_border_color || '#3b82f6';
  const durationSize = Number(appearance.goal_duration_size || 13);
  const durationRadius = appearance.goal_duration_radius === '4' ? '4px' : appearance.goal_duration_radius === '8' ? '8px' : '9999px';
  const showDurationIcon = appearance.goal_duration_show_icon !== 'false';

  const badgeDynamicStyle: React.CSSProperties = {
    color: durationColor,
    fontSize: `${durationSize}px`,
    borderRadius: durationRadius,
    lineHeight: '1.2',
  };

  if (durationStyle === 'clean') {
    badgeDynamicStyle.background = 'transparent';
    badgeDynamicStyle.border = 'none';
    badgeDynamicStyle.boxShadow = 'none';
    badgeDynamicStyle.padding = '0';
    badgeDynamicStyle.textShadow = '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.9)';
  } else if (durationStyle === 'solid') {
    badgeDynamicStyle.background = durationBgColor;
    badgeDynamicStyle.border = durationBorderColor ? `1px solid ${durationBorderColor}` : 'none';
    badgeDynamicStyle.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.6)';
    badgeDynamicStyle.padding = '4px 14px';
  } else if (durationStyle === 'outline') {
    badgeDynamicStyle.background = hexToRgba(durationBgColor, Math.min(durationBgOpacity, 0.25));
    badgeDynamicStyle.border = `1.5px solid ${durationBorderColor}`;
    badgeDynamicStyle.boxShadow = 'none';
    badgeDynamicStyle.padding = '4px 14px';
  } else if (durationStyle === 'glow') {
    badgeDynamicStyle.background = hexToRgba(durationBgColor, durationBgOpacity);
    badgeDynamicStyle.border = `1px solid ${durationBorderColor}`;
    badgeDynamicStyle.boxShadow = `0 0 12px ${hexToRgba(durationBorderColor, 0.65)}, inset 0 0 6px ${hexToRgba(durationBorderColor, 0.3)}`;
    badgeDynamicStyle.backdropFilter = 'blur(8px)';
    badgeDynamicStyle.WebkitBackdropFilter = 'blur(8px)';
    badgeDynamicStyle.padding = '4px 14px';
  } else {
    // Default 'glass'
    badgeDynamicStyle.background = hexToRgba(durationBgColor, durationBgOpacity);
    badgeDynamicStyle.border = `1px solid ${hexToRgba(durationBorderColor, 0.55)}`;
    badgeDynamicStyle.backdropFilter = 'blur(10px)';
    badgeDynamicStyle.WebkitBackdropFilter = 'blur(10px)';
    badgeDynamicStyle.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
    badgeDynamicStyle.padding = '4px 14px';
  }

  const renderDurationBadge = (isInline = false) => {
    if (!isShowDuration || !durationText) return null;
    return (
      <span 
        className={`goal-duration-badge goal-duration-${durationStyle}${isInline ? ' goal-duration-inline' : ''}`}
        style={badgeDynamicStyle}
      >
        {showDurationIcon && (
          <Clock 
            size={Math.max(10, Math.round(durationSize * 0.92))} 
            className="goal-duration-icon" 
            style={{ color: durationColor }} 
          />
        )}
        <span>{durationText}</span>
      </span>
    );
  };

  const shape = appearance.goal_shape || 'bar';

  const renderCircleShape = () => {
    const size = Math.min(Math.max(160, Number(appearance.goal_bar_height || 48) * 3.5), 240);
    const strokeW = Math.max(10, Math.min(22, Math.round(size * 0.08)));
    const r = (size - strokeW * 2) / 2;
    const circumference = 2 * Math.PI * r;
    const strokeDashoffset = circumference - (circumference * percent) / 100;

    return (
      <div className="goal-circle-wrapper" style={{ minHeight: `${size}px` }}>
        {isOvercharged && <div className="goal-circle-corona" aria-hidden="true" />}
        <svg
          className="goal-circle-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={trackBg}
            strokeWidth={strokeW}
            className="goal-circle-track"
            style={{
              backdropFilter: trackBlur > 0 ? `blur(${trackBlur}px)` : undefined,
              WebkitBackdropFilter: trackBlur > 0 ? `blur(${trackBlur}px)` : undefined,
            }}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={barStart}
            strokeWidth={strokeW}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="goal-circle-fill"
            style={{
              filter: appearance.goal_bar_shine === 'true' ? `drop-shadow(0 0 8px ${hexToRgba(barStart, 0.75)})` : undefined,
            }}
          />
        </svg>
        <div className="goal-circle-center" style={{ width: `${r * 1.6}px` }}>
          <span className="goal-circle-pct" style={{ color: appearance.goal_accent_color, fontSize: `${Math.round(size * 0.16)}px` }}>
            {displayPercent.toFixed(0)}%
          </span>
          <span className="goal-circle-amounts" style={{ fontSize: `${Math.max(11, Math.round(size * 0.08))}px` }}>
            <strong>฿{money(current)}</strong>
            <span className="goal-circle-target">/ ฿{money(safeTarget)}</span>
          </span>
        </div>
      </div>
    );
  };

  const renderBatteryShape = () => {
    const totalSegments = 10;
    const activeSegments = Math.round((percent / 100) * totalSegments);

    return (
      <div className="goal-battery-wrapper">
        <div
          className="goal-battery-housing"
          style={{
            height: `${Math.max(38, Number(appearance.goal_bar_height || 48))}px`,
            background: trackBg,
            borderColor: appearance.goal_border_color || '#64748b',
            backdropFilter: trackBlur > 0 ? `blur(${trackBlur}px)` : undefined,
            WebkitBackdropFilter: trackBlur > 0 ? `blur(${trackBlur}px)` : undefined,
          }}
        >
          <div className="goal-battery-segments">
            {Array.from({ length: totalSegments }).map((_, idx) => {
              const isFilled = idx < activeSegments;
              const isHead = idx === activeSegments - 1;
              return (
                <div
                  key={idx}
                  className={`goal-battery-cell${isFilled ? ' filled' : ''}${isHead && appearance.goal_bar_animated === 'true' ? ' head' : ''}`}
                  style={{
                    background: isFilled ? barBackground : 'rgba(255, 255, 255, 0.05)',
                    boxShadow: isFilled ? `0 0 10px ${hexToRgba(barStart, 0.6)}` : 'none',
                    borderColor: isFilled ? barStart : undefined,
                  }}
                />
              );
            })}
          </div>
          <div className="goal-battery-terminal" style={{ borderColor: appearance.goal_border_color || '#64748b' }} />
          {isOvercharged && <div className="goal-battery-overcharge-sparks" aria-hidden="true" />}
        </div>

        <div className="goal-battery-meta" style={{ fontSize: `${appearance.goal_amount_size ?? 14}px` }}>
          <span><strong>฿{money(current)}</strong> / ฿{money(safeTarget)}</span>
          <span className="goal-battery-pct" style={{ color: appearance.goal_accent_color }}>{displayPercent.toFixed(0)}%</span>
        </div>
      </div>
    );
  };

  const renderOrbShape = () => {
    const size = Math.min(Math.max(160, Number(appearance.goal_bar_height || 48) * 3.5), 230);
    return (
      <div className="goal-orb-wrapper" style={{ minHeight: `${size + 20}px` }}>
        <div
          className="goal-orb-socket"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            boxShadow: `0 0 28px ${hexToRgba(barStart, 0.65)}, inset 0 0 20px rgba(0, 0, 0, 0.85)`
          }}
        >
          {/* Inner fluid spherical mask */}
          <div className="goal-orb-fluid-tank" style={{ background: trackBg }}>
            <div
              className="goal-orb-liquid"
              style={{
                height: `${percent}%`,
                background: barBackground,
                boxShadow: `0 0 24px ${hexToRgba(barStart, 0.85)}`
              }}
            >
              <div className="goal-orb-wave" />
              {percent > 20 && <span className="goal-orb-sparkle s1" aria-hidden="true">✦</span>}
              {percent > 50 && <span className="goal-orb-sparkle s2" aria-hidden="true">✦</span>}
              {percent > 80 && <span className="goal-orb-sparkle s3" aria-hidden="true">★</span>}
            </div>
            {/* Glass reflection highlight */}
            <div className="goal-orb-highlight" aria-hidden="true" />
            <div className="goal-orb-rim-glare" aria-hidden="true" />
          </div>

          {/* Ornate Frame Accents */}
          <div className="goal-orb-ring-outer" style={{ borderColor: hexToRgba(barStart, 0.5) }} />
          {isOvercharged && <div className="goal-orb-overcharge-storm" aria-hidden="true" />}

          {/* Center Info Overlay */}
          <div className="goal-orb-center">
            <span className="goal-orb-pct" style={{ color: appearance.goal_accent_color, fontSize: `${Math.round(size * 0.16)}px` }}>
              {displayPercent.toFixed(0)}%
            </span>
            <span className="goal-orb-current" style={{ fontSize: `${Math.max(12, Math.round(size * 0.08))}px` }}>
              ฿{money(current)}
            </span>
            <span className="goal-orb-target" style={{ fontSize: `${Math.max(10, Math.round(size * 0.065))}px` }}>
              / ฿{money(safeTarget)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderPillShape = () => {
    return (
      <div className="goal-pill-wrapper">
        <div
          className="goal-pill-container"
          style={{
            background: trackBg,
            borderColor: appearance.goal_border_color || 'rgba(255, 255, 255, 0.18)',
            backdropFilter: trackBlur > 0 ? `blur(${trackBlur}px)` : 'blur(16px)',
            WebkitBackdropFilter: trackBlur > 0 ? `blur(${trackBlur}px)` : 'blur(16px)',
            boxShadow: `0 10px 30px rgba(0, 0, 0, 0.65), 0 0 1px ${hexToRgba(barStart, 0.4)}`,
          }}
        >
          {/* Left: Mini Status Pulse */}
          <div className="goal-pill-status">
            <span
              className="goal-pill-dot"
              style={{
                background: barStart,
                boxShadow: `0 0 10px ${hexToRgba(barStart, 0.9)}`,
              }}
            />
          </div>

          {/* Center: Title + Amounts + Slim Progress Rail */}
          <div className="goal-pill-content">
            <div className="goal-pill-header">
              <span className="goal-pill-title">{title}</span>
              <div className="goal-pill-amounts" style={{ fontSize: `${Math.max(12, Number(appearance.goal_amount_size ?? 14) * 0.9)}px` }}>
                <strong>฿{money(current)}</strong>
                <span className="goal-pill-sep">/</span>
                <span className="goal-pill-target">฿{money(safeTarget)}</span>
              </div>
            </div>

            {/* Micro Hairline Bar */}
            <div className="goal-pill-rail" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
              <div
                className="goal-pill-bar"
                style={{
                  width: `${percent}%`,
                  background: barBackground,
                  boxShadow: `0 0 10px ${hexToRgba(barStart, 0.75)}`,
                }}
              />
            </div>
          </div>

          {/* Right: Percent Badge */}
          <div className="goal-pill-pct-badge" style={{ color: appearance.goal_accent_color }}>
            <span>{displayPercent.toFixed(0)}</span>
            <small>%</small>
          </div>
          {isOvercharged && <div className="goal-pill-overcharge-glow" aria-hidden="true" />}
        </div>
      </div>
    );
  };

  const renderPixelHeartsShape = () => {
    const totalHearts = 5;
    return (
      <div className="goal-hearts-wrapper">
        {isOvercharged && <div className="goal-hearts-overcharge-flame" aria-hidden="true" />}
        <div className="goal-hearts-row">
          {Array.from({ length: totalHearts }).map((_, i) => {
            const heartPct = (percent - i * 20) / 20;
            const fillPct = Math.max(0, Math.min(100, heartPct * 100));
            const isFull = fillPct >= 100;
            const isHalf = fillPct >= 50 && fillPct < 100;
            const isCurrent = heartPct > 0 && heartPct < 1;

            return (
              <div
                key={i}
                className={`goal-pixel-heart${isFull ? ' full' : isHalf ? ' half' : ''}${isCurrent ? ' beating' : ''}`}
                style={{
                  color: isFull || isHalf ? barStart : 'rgba(255, 255, 255, 0.2)',
                  filter: (isFull || isHalf) && appearance.goal_bar_shine === 'true'
                    ? `drop-shadow(0 0 8px ${hexToRgba(barStart, 0.8)})`
                    : undefined
                }}
              >
                {/* 8-bit Pixel Heart SVG */}
                <svg viewBox="0 0 16 16" width="38" height="38" className="goal-pixel-heart-svg">
                  <path
                    fill="currentColor"
                    d="M3 2h2v1H3V2zm5 0h2v1H8V2zm-4 1h1v1H4V3zm2 0h2v1H6V3zm3 0h1v1H9V3zm2 0h1v1h-1V3zM3 4h1v1H3V4zm9 0h1v1h-1V4zM2 5h1v4H2V5zm12 0h1v4h-1V5zM3 9h1v1H3V9zm9 0h1v1h-1V9zM4 10h1v1H4v-1zm7 0h1v1h-1v-1zm-6 1h1v1H5v-1zm5 0h1v1h-1v-1zm-4 1h1v1H6v-1zm3 0h1v1H9v-1zm-2 1h2v1H7v-1z"
                  />
                  {/* Fill interior */}
                  <path
                    fill={fillPct >= 100 ? barBackground : fillPct >= 50 ? barStart : trackBg}
                    d="M4 4h2v1H4V4zm4 0h2v1H8V4zM3 5h10v4H3V5zm1 4h8v1H4V9zm1 1h6v1H5v-1zm1 1h4v1H6v-1zm1 1h2v1H7v-1z"
                    opacity={fillPct > 0 ? 1 : 0.3}
                  />
                </svg>
              </div>
            );
          })}
        </div>

        <div className="goal-hearts-meta" style={{ fontSize: `${appearance.goal_amount_size ?? 14}px` }}>
          <div className="goal-hearts-amounts">
            <span>HP:</span>
            <strong>฿{money(current)}</strong>
            <span className="goal-hearts-sep">/</span>
            <span>฿{money(safeTarget)}</span>
          </div>
          <span className="goal-hearts-pct" style={{ color: appearance.goal_accent_color }}>
            [{displayPercent.toFixed(0)}%]
          </span>
        </div>
      </div>
    );
  };

  const renderShapeBody = () => {
    switch (shape) {
      case 'circle':
        return renderCircleShape();
      case 'battery':
        return renderBatteryShape();
      case 'orb':
        return renderOrbShape();
      case 'pill':
        return renderPillShape();
      case 'pixel_hearts':
        return renderPixelHeartsShape();
      case 'bar':
      default:
        return (
          <>
            {!isTextInside && !isFlat && appearance.goal_show_amount === 'true' && (
              <div className="goal-values" style={{ fontSize: `${appearance.goal_amount_size}px` }}>
                <strong>฿{money(current)}</strong>
                <span>/ ฿{money(safeTarget)}</span>
              </div>
            )}

            {isFloating && !isTextInside && appearance.goal_show_amount === 'true' && (
              <div className="goal-floating-header" style={{ fontSize: `${appearance.goal_amount_size}px`, '--goal-bubble-width': `min(100%, max(88px, calc(${money(current).length + 1}ch + 24px)))` } as React.CSSProperties}>
                <span className="goal-floating-label" title={`฿${money(current)}`} style={{ left: `clamp(calc(var(--goal-bubble-width) / 2), ${percent}%, calc(100% - var(--goal-bubble-width) / 2))`, color: appearance.goal_text_color, background: appearance.goal_track_color, borderColor: barStart }}>฿{money(current)}</span>
              </div>
            )}

            <div className={`goal-rail${isHUD ? ' goal-hud-frame' : ''}${isMilestone ? ' goal-milestone-rail' : ''}`} style={{ filter: isHUD && appearance.goal_bar_shine === 'true' ? `drop-shadow(0 0 5px ${hexToRgba(barStart, 0.4)})` : undefined }}>
              {isOvercharged && (
                <div className="goal-bar-overcharge-electric" aria-hidden="true">
                  <span className="arc-top" />
                  <span className="arc-bottom" />
                </div>
              )}
              <div
                className={`goal-track goal-track-${appearance.goal_bar_style}${appearance.goal_bar_animated === 'true' ? ' goal-track-animated' : ''}${percent >= 100 ? ' goal-track-complete' : ''}`} 
                style={{ 
                  height: `${appearance.goal_bar_height}px`, 
                  borderRadius: Number(appearance.goal_bar_radius ?? 50) >= 40 ? '9999px' : `${appearance.goal_bar_radius}px`, 
                  background: isSegmented ? `repeating-linear-gradient(90deg, ${trackBg} 0 20px, transparent 20px 24px)` : trackBg,
                  backdropFilter: trackBlur > 0 ? `blur(${trackBlur}px)` : undefined,
                  WebkitBackdropFilter: trackBlur > 0 ? `blur(${trackBlur}px)` : undefined,
                  border: isFlat ? 'none' : '1.5px solid rgba(255, 255, 255, 0.22)',
                  boxShadow: isFlat ? 'none' : 'inset 0 2px 6px rgba(0, 0, 0, 0.75), 0 4px 14px rgba(0, 0, 0, 0.45)',
                  color: appearance.goal_bar_color,
                  padding: isHUD ? '3px' : isFlat ? '0' : '4px',
                  clipPath: isHUD ? 'polygon(4% 0, 100% 0, 100% 80%, 96% 100%, 0 100%, 0 20%)' : undefined,
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                }} 
                role="progressbar" 
                aria-label={title} 
                aria-valuemin={0} 
                aria-valuemax={safeTarget} 
                aria-valuenow={Math.min(current, safeTarget)}
              >
                <div 
                  className="goal-fill" 
                  style={{ 
                    width: `${percent}%`, 
                    height: '100%',
                    borderRadius: isFlat ? `${appearance.goal_bar_radius}px` : '9999px',
                    border: percent > 0 && !isFlat ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                    boxShadow: percent > 0 && !isFlat ? '3px 0 10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)' : 'none',
                    maskImage: isSegmented ? 'repeating-linear-gradient(90deg, #000 0 20px, transparent 20px 24px)' : undefined,
                    clipPath: isHUD ? 'polygon(4% 0, 100% 0, 100% 80%, 96% 100%, 0 100%, 0 20%)' : undefined,
                    background: barBackground 
                  }}
                >
                  {effectivePattern !== 'none' && (
                    <span 
                      className={`goal-bar-texture goal-pattern-${effectivePattern}`} 
                      style={{ opacity: patternOpacity }} 
                      aria-hidden="true" 
                    />
                  )}
                  {hasGloss && (
                    <>
                      <span className="goal-bar-gloss" aria-hidden="true" />
                      <span className="goal-bar-shine" aria-hidden="true" />
                    </>
                  )}
                  {appearance.goal_bar_shine === 'true' && (
                    <>
                      <span className="goal-bar-lead-flare" aria-hidden="true" />
                      <span className="goal-bar-shine-sweep" aria-hidden="true">
                        <span className="goal-bar-beam" />
                        <span className="goal-bar-sparkle" />
                      </span>
                    </>
                  )}
                </div>

                {isMilestone && [25, 50, 75, 100].map((mark) => <span className="goal-checkpoint" key={mark} data-reached={percent >= mark} aria-hidden="true" style={{ left: `clamp(6px, ${mark}%, calc(100% - 6px))`, color: appearance.goal_text_color }}><i style={{ background: percent >= mark ? barStart : appearance.goal_track_color, borderColor: percent >= mark ? barStart : hexToRgba(appearance.goal_text_color, 0.5) }} /><span>{mark}%</span></span>)}

                {/* Text centered inside the bar: e.g. ฿1,500 / ฿5,000 (30%) */}
                {isTextInside && (
                  <div 
                    className="goal-bar-percent" 
                    style={{ 
                      fontSize: `${appearance.goal_amount_size ?? 14}px` 
                    }}
                  >
                    {appearance.goal_show_amount !== 'false' && (
                      <span className="goal-bar-amounts">
                        <strong>฿{money(current)}</strong>
                        <span className="goal-bar-sep">/</span>
                        <span>฿{money(safeTarget)}</span>
                      </span>
                    )}
                    {appearance.goal_show_percent !== 'false' && (
                      <span className="goal-bar-pct">({displayPercent.toFixed(0)}%)</span>
                    )}
                  </div>
                )}
              </div>
              {isHUD && <svg className="goal-hud-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{ color: barStart }}><path d="M4 1 H99 V80 L96 99 H1 V20 Z" /><path d="M6 12 H96 V74 L94 88 H4 V26 Z" opacity="0.35" /></svg>}
            </div>

            {!isTextInside && isFlat && !isFloating && (appearance.goal_show_amount === 'true' || appearance.goal_show_percent === 'true') && (
              <div className="goal-compact-meta" style={{ fontSize: `${appearance.goal_amount_size}px` }}>
                {appearance.goal_show_amount === 'true' && <div className="goal-values"><strong>฿{money(current)}</strong><span>/ ฿{money(safeTarget)}</span></div>}
                {appearance.goal_show_percent === 'true' && !isHUD && <span style={{ color: appearance.goal_accent_color }}>{displayPercent.toFixed(1)}%{displayPercent >= 100 ? ' · ถึงเป้าหมายแล้ว!' : ''}</span>}
              </div>
            )}

            {!isTextInside && isFloating && (appearance.goal_show_amount === 'true' || appearance.goal_show_percent === 'true') && (
              <div className="goal-floating-meta" style={{ fontSize: `${appearance.goal_amount_size}px` }}>
                {appearance.goal_show_percent === 'true' && <span style={{ color: appearance.goal_accent_color }}>{displayPercent.toFixed(1)}%</span>}
                {appearance.goal_show_amount === 'true' && <span className="goal-floating-target">เป้าหมาย ฿{money(safeTarget)}</span>}
              </div>
            )}

            {!isTextInside && !isFlat && appearance.goal_show_percent === 'true' && (
              <div className="goal-percent" style={{ color: appearance.goal_accent_color }}>
                {displayPercent.toFixed(1)}%{displayPercent >= 100 ? ' · ถึงเป้าหมายแล้ว!' : ''}
              </div>
            )}
          </>
        );
    }
  };

  return (
    <section 
      className={`obs-widget goal-widget goal-shape-${shape}${isOvercharged ? ' goal-overcharged' : ''}${isCardTransparent ? ' goal-widget-no-bg' : ''}`} 
      style={{ 
        fontFamily: `'${appearance.goal_font}', sans-serif`, 
        width: `${appearance.goal_width}px`, 
        maxWidth: '100%', 
        padding: isCardTransparent ? '8px 0' : `${appearance.goal_padding}px`, 
        borderRadius: `${appearance.goal_radius}px`, 
        borderWidth: (appearance.goal_show_border === 'false' || isCardTransparent) ? 0 : 1, 
        borderColor: appearance.goal_border_color, 
        color: appearance.goal_text_color, 
        background: isCardTransparent ? 'transparent' : `${appearance.goal_bg_color}${Math.round(cardOpacity * 2.55).toString(16).padStart(2, '0')}`,
        boxShadow: isCardTransparent ? 'none' : undefined,
      }}
    >
      {/* Supernova 100% Celebration Blast Overlay - Pure Rays & Shockwave */}
      {showSupernova && (
        <div 
          className="goal-supernova-blast" 
          aria-hidden="true"
          style={{
            '--blast-color': barStart,
            '--blast-end': barEnd,
            '--blast-glow': hexToRgba(barStart, 0.85),
            '--blast-glow-dim': hexToRgba(barStart, 0.25)
          } as React.CSSProperties}
        >
          <div className="supernova-core" />
          <div className="supernova-ring" />
          <div className="supernova-ring ring-secondary" />
          <div className="supernova-rays" />
          <div className="supernova-rays rays-secondary" />
          <div className="supernova-sparks">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className={`spark s-${i}`} />
            ))}
          </div>
        </div>
      )}

      <h1 
        className={`goal-title${isHUD ? ' goal-title-hud' : ''}`}
        style={{ 
          fontSize: `${appearance.goal_title_size}px`,
          textAlign: isHUD ? 'left' : 'center',
          color: appearance.goal_text_color ?? '#ffffff',
          marginBottom: isShowDuration && durationText && durationPosition === 'top' ? '6px' : '12px',
          display: isHUD || durationPosition === 'inline' && isShowDuration && durationText ? 'flex' : undefined,
          alignItems: 'center',
          justifyContent: isHUD ? 'space-between' : 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <span>{title}</span>
        {durationPosition === 'inline' && renderDurationBadge(true)}
        {isHUD && !isTextInside && appearance.goal_show_percent === 'true' && <span className="goal-hud-percent" style={{ color: appearance.goal_accent_color }}>{displayPercent.toFixed(1)}%</span>}
      </h1>

      {isShowDuration && durationText && durationPosition === 'top' && (
        <div className="goal-duration-badge-wrapper">
          {renderDurationBadge()}
        </div>
      )}

      {renderShapeBody()}

      {isShowDuration && durationText && durationPosition === 'bottom' && (
        <div className="goal-duration-badge-wrapper goal-duration-wrapper-bottom">
          {renderDurationBadge()}
        </div>
      )}
    </section>
  );
}
