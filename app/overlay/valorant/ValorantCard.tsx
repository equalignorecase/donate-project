'use client';

import React from 'react';
import { ValorantRankData, ValorantSettings } from '@/lib/types/valorant';
import { valorantDefaults } from '@/lib/valorantSettings';
import './valorant.css';

function hexToRgba(color: string, alpha: number): string {
  if (!color) return `rgba(20, 25, 35, ${alpha})`;
  if (color.startsWith('rgba(') || color.startsWith('rgb(')) return color;
  const clean = color.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  if (full.length !== 6) return `rgba(20, 25, 35, ${alpha})`;
  const r = parseInt(full.substring(0, 2), 16) || 0;
  const g = parseInt(full.substring(2, 4), 16) || 0;
  const b = parseInt(full.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ValorantCardProps {
  data?: ValorantRankData | null;
  settings?: Partial<ValorantSettings>;
  loading?: boolean;
  error?: string | null;
}

export default function ValorantCard({
  data,
  settings: propSettings,
  loading = false,
  error = null,
}: ValorantCardProps) {
  const cfg = { ...valorantDefaults, ...propSettings };

  const showBadge = cfg.valorant_show_badge !== 'false';
  const showRank = cfg.valorant_show_rank !== 'false';
  const showRr = cfg.valorant_show_rr !== 'false';
  const showWl = cfg.valorant_show_wl !== 'false';
  const showLastMatch = cfg.valorant_show_last_match !== 'false';
  const showBg = cfg.valorant_show_bg !== 'false';
  const showShine = cfg.valorant_shine === 'true';

  const opacityVal = (Number(cfg.valorant_bg_opacity || 90) / 100).toFixed(2);
  const scaleVal = (Number(cfg.valorant_scale || 100) / 100).toFixed(2);

  const selectedFont = cfg.valorant_font || 'LINESeedSansTH-ExtraBold';
  let fontFamilyCss = `'LINESeedSansTH-ExtraBold', system-ui, sans-serif`;
  let weightBold = '800';
  let weightMedium = '600';
  let strokeVal = '0.35px currentColor';

  if (selectedFont === 'LINESeedSansTH' || selectedFont === 'LINESeedSansTH-Regular') {
    fontFamilyCss = `'LINESeedSansTH-Regular', 'LINESeedSansTH', system-ui, sans-serif`;
    weightBold = '400';
    weightMedium = '400';
    strokeVal = 'none';
  } else if (selectedFont === 'Rajdhani') {
    fontFamilyCss = `'Rajdhani', 'LINESeedSansTH-ExtraBold', system-ui, sans-serif`;
    weightBold = '700';
    weightMedium = '600';
    strokeVal = 'none';
  } else if (selectedFont === 'Chakra Petch') {
    fontFamilyCss = `'Chakra Petch', 'LINESeedSansTH-ExtraBold', system-ui, sans-serif`;
    weightBold = '700';
    weightMedium = '600';
    strokeVal = 'none';
  } else {
    fontFamilyCss = `'LINESeedSansTH-ExtraBold', system-ui, sans-serif`;
    weightBold = '800';
    weightMedium = '700';
    strokeVal = '0.35px currentColor';
  }

  const isCompact = cfg.valorant_theme === 'compact';

  // Compute card style variables
  const cardStyle: React.CSSProperties = showBg ? {
    backgroundColor: isCompact
      ? hexToRgba(cfg.valorant_bg_color || '#141923', Number(opacityVal))
      : cfg.valorant_bg_color || '#1e293b',
    opacity: !isCompact && Number(opacityVal) < 1 ? Number(opacityVal) : 1,
    borderRadius: `${cfg.valorant_radius || 16}px`,
    borderColor: cfg.valorant_show_border === 'true' ? cfg.valorant_border_color || 'rgba(255,255,255,0.1)' : 'transparent',
    borderWidth: cfg.valorant_show_border === 'true' ? '1px' : '0px',
    borderStyle: 'solid',
    fontFamily: fontFamilyCss,
  } : {
    backgroundColor: 'transparent',
    backgroundImage: 'none',
    boxShadow: 'none',
    border: 'none',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    padding: '4px',
    fontFamily: fontFamilyCss,
  };

  const containerStyle: React.CSSProperties = {
    transform: `scale(${scaleVal})`,
  };

  const cssVars = {
    '--accent-color': cfg.valorant_accent_color || '#38bdf8',
    '--text-color': cfg.valorant_text_color || '#ffffff',
    '--bg-opacity': opacityVal,
    '--val-weight-bold': weightBold,
    '--val-weight-medium': weightMedium,
    '--val-stroke': strokeVal,
  } as React.CSSProperties;

  const currentRank = data?.currenttierpatched || 'Unranked';
  const currentRr = data ? `${data.ranking_in_tier}RR` : '0RR';
  const badgeUrl = data?.images?.large || data?.images?.small || 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png';
  const wins = data?.wins ?? 0;
  const losses = data?.losses ?? 0;
  const lastChange = data?.last_match_change ?? 0;

  const lastMatchPrefix = (cfg.valorant_last_match_label || 'เกมล่าสุด').trim();
  const lastMatchDeltaText = lastChange > 0 ? `+${lastChange} RR` : `${lastChange} RR`;
  let lastMatchText = `${lastMatchPrefix}: 0 RR`;
  let pillClass = 'neutral';
  if (lastChange > 0) {
    lastMatchText = `${lastMatchPrefix}: +${lastChange} RR`;
    pillClass = 'win';
  } else if (lastChange < 0) {
    lastMatchText = `${lastMatchPrefix}: ${lastChange} RR`;
    pillClass = 'loss';
  }

  const leaderboardRank = data?.leaderboard_rank && data.leaderboard_rank > 0 ? data.leaderboard_rank : null;
  const compactRrText = data ? `${data.ranking_in_tier} RR` : '0 RR';
  const showRightStats = showLastMatch || showWl;

  if (isCompact) {
    return (
      <div
        className="valorant-card-container theme-compact"
        style={{ ...containerStyle, ...cssVars }}
      >
        <div className={`valorant-card valorant-card-compact ${!showBg ? 'no-background' : ''}`} style={cardStyle}>
          {showBadge && (
            <div className="valorant-compact-badge">
              <img
                src={badgeUrl}
                alt={currentRank}
                className="valorant-compact-badge-img"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png';
                }}
              />
            </div>
          )}

          <div className="valorant-compact-main">
            {leaderboardRank && (
              <div className={`valorant-compact-lb ${showShine ? 'val-text-shine' : ''}`}>
                #{leaderboardRank}
              </div>
            )}
            {(showRank || showRr) && (
              <div className="valorant-compact-sub">
                {showRank && <span className="valorant-compact-tier">{currentRank}</span>}
                {showRank && showRr && <span className="valorant-compact-dot">·</span>}
                {showRr && <span className="valorant-compact-rr">{compactRrText}</span>}
              </div>
            )}
            {loading && !data && (
              <div className="valorant-compact-status">กำลังโหลดข้อมูล...</div>
            )}
            {error && !data && (
              <div className="valorant-compact-error">{error}</div>
            )}
          </div>

          {showRightStats && (
            <>
              <div className="valorant-compact-divider" aria-hidden="true" />
              <div className="valorant-compact-stats">
                {showLastMatch && (
                  <div className="valorant-compact-stat-row">
                    <span className="valorant-compact-stat-label">{lastMatchPrefix}</span>
                    <span className={`valorant-compact-delta ${pillClass}`}>{lastMatchDeltaText}</span>
                  </div>
                )}
                {showWl && (
                  <div className="valorant-compact-stat-row">
                    <span className="valorant-compact-stat-label">W/L</span>
                    <span className="valorant-compact-wl">{wins}-{losses}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`valorant-card-container theme-${cfg.valorant_theme || 'classic'}`} 
      style={{ ...containerStyle, ...cssVars }}
    >
      <div className={`valorant-card ${!showBg ? 'no-background' : ''}`} style={cardStyle}>
        {/* Tier Emblem */}
        {showBadge && (
          <div className="valorant-badge-wrapper">
            <div className="valorant-badge-glow" />
            <img 
              src={badgeUrl} 
              alt={currentRank}
              className="valorant-badge-img"
              loading="lazy"
              onError={(e) => {
                // Fallback to unranked icon if error loading tier
                (e.target as HTMLImageElement).src = 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png';
              }}
            />
          </div>
        )}

        {/* Info Column */}
        <div className="valorant-info">
          {/* Rank + RR */}
          {(showRank || showRr) && (
            <div className="valorant-rank-row">
              {showRank && (
                <span className={`valorant-rank-name ${showShine ? 'val-text-shine' : ''}`}>
                  {currentRank}
                </span>
              )}
              {showRr && (
                <span className={`valorant-rr ${showShine ? 'val-text-shine' : ''}`}>
                  {currentRr}
                </span>
              )}
            </div>
          )}

          {/* Win / Loss Record */}
          {showWl && (
            <div className="valorant-wl-row">
              <span className="valorant-wl-wins">{wins} Win</span>
              <span className="valorant-wl-divider">/</span>
              <span className="valorant-wl-losses">{losses} Loss</span>
            </div>
          )}

          {/* Last Match Pill */}
          {showLastMatch && (
            <div className={`valorant-last-match-pill ${pillClass}`}>
              {lastMatchText}
            </div>
          )}

          {/* Loading or Error hints if applicable */}
          {loading && !data && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
              <span className="valorant-loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
              กำลังโหลดข้อมูล...
            </div>
          )}
          {error && !data && (
            <div style={{ fontSize: '12px', color: '#f87171' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

