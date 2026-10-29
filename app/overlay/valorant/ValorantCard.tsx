'use client';

import React from 'react';
import { ValorantRankData, ValorantSettings } from '@/lib/types/valorant';
import { valorantDefaults } from '@/lib/valorantSettings';
import './valorant.css';

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

  // Compute card style variables
  const cardStyle: React.CSSProperties = showBg ? {
    backgroundColor: cfg.valorant_bg_color || '#1e293b',
    opacity: Number(opacityVal) < 1 ? Number(opacityVal) : 1,
    borderRadius: `${cfg.valorant_radius || 16}px`,
    borderColor: cfg.valorant_show_border === 'true' ? cfg.valorant_border_color || 'rgba(255,255,255,0.1)' : 'transparent',
    borderWidth: cfg.valorant_show_border === 'true' ? '1px' : '0px',
    borderStyle: 'solid',
    fontFamily: cfg.valorant_font ? `var(--font-${cfg.valorant_font}), sans-serif` : undefined,
  } : {
    backgroundColor: 'transparent',
    backgroundImage: 'none',
    boxShadow: 'none',
    border: 'none',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    padding: '4px',
    fontFamily: cfg.valorant_font ? `var(--font-${cfg.valorant_font}), sans-serif` : undefined,
  };

  const containerStyle: React.CSSProperties = {
    transform: `scale(${scaleVal})`,
  };

  const cssVars = {
    '--accent-color': cfg.valorant_accent_color || '#38bdf8',
    '--text-color': cfg.valorant_text_color || '#ffffff',
    '--bg-opacity': opacityVal,
  } as React.CSSProperties;

  const currentRank = data?.currenttierpatched || 'Unranked';
  const currentRr = data ? `${data.ranking_in_tier}RR` : '0RR';
  const badgeUrl = data?.images?.large || data?.images?.small || 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png';
  const wins = data?.wins ?? 0;
  const losses = data?.losses ?? 0;
  const lastChange = data?.last_match_change ?? 0;

  const lastMatchPrefix = (cfg.valorant_last_match_label || 'เกมล่าสุด').trim();
  let lastMatchText = `${lastMatchPrefix}: 0 RR`;
  let pillClass = 'neutral';
  if (lastChange > 0) {
    lastMatchText = `${lastMatchPrefix}: +${lastChange} RR`;
    pillClass = 'win';
  } else if (lastChange < 0) {
    lastMatchText = `${lastMatchPrefix}: ${lastChange} RR`;
    pillClass = 'loss';
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

