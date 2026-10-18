'use client';

import React from 'react';
import { AlertSettings } from '@/lib/types/database';
import '@/app/overlay/overlay.css';
import '@/app/overlay/widgets.css';

export const ALERT_ICONS: Record<string, React.ReactNode> = {
  gift: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"></polyline>
      <rect x="2" y="7" width="20" height="5"></rect>
      <line x1="12" y1="22" x2="12" y2="7"></line>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
    </svg>
  ),
  heart: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  ),
  coin: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
      <path d="M12 6v2m0 8v2"></path>
    </svg>
  ),
  star: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  fire: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
    </svg>
  ),
  trophy: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34"></path>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path>
    </svg>
  )
};

export const defaultAlertSettings: AlertSettings = {
  alert_font: 'LINESeedSansTH',
  alert_card_bg: '#ffffff',
  alert_card_blur: 0,
  alert_card_width: 580,
  alert_border_color: '#e2e8f0',
  alert_border_width: 1.5,
  alert_border_radius: 24,
  alert_shadow_show: 'true',
  alert_glow: 'false',
  alert_shimmer_show: 'true',
  alert_shimmer_color: 'linear-gradient(90deg, #0f172a 0%, #2563eb 50%, #059669 100%)',
  alert_icon: 'gift',
  alert_icon_bg: '#f8fafc',
  alert_icon_color: '#0f172a',
  alert_icon_border: '#e2e8f0',
  alert_name_color: '#0f172a',
  alert_action_color: '#64748b',
  alert_action_text: 'โดเนทให้',
  alert_title_size: 26,
  alert_amount_bg: '#ecfdf5',
  alert_amount_color: '#059669',
  alert_amount_border: '#a7f3d0',
  alert_amount_size: 22,
  alert_msg_bg: '#f8fafc',
  alert_msg_color: '#334155',
  alert_msg_border: '#e2e8f0',
  alert_msg_size: 18,
  alert_letter_spacing: 0,
  alert_word_gap: 8,
  alert_text_margin_top: 0,
  alert_text_margin_bottom: 0,
  alert_text_margin_left: 0,
  alert_text_margin_right: 0,
  alert_icon_margin_bottom: 8,
  alert_msg_margin_top: 8,
  alert_line_height: 1.35,
  alert_text_stroke_enabled: 'false',
  alert_text_stroke_color: '#000000',
  alert_text_stroke_width: 1.5,
  alert_card_beam: 'false',
  alert_tiered_enabled: 'true',
  alert_tiered_rare_min: 50,
  alert_tiered_epic_min: 200,
  alert_tiered_legendary_min: 500,
  alert_tiered_rare_color: '#0284c7',
  alert_tiered_epic_color: '#9333ea',
  alert_tiered_legendary_color: '#ea580c',
  alert_text_shadow: 'soft',
  alert_shine_sweep: 'false',
  alert_shine_theme: 'crystal',
  alert_animation: 'slide-down',
  alert_duration: 8
};

export type AlertTier = 'common' | 'rare' | 'epic' | 'legendary';

export function getAlertTier(amount: number, settings?: AlertSettings): AlertTier {
  if (!settings) return 'common';
  if (settings.alert_tiered_enabled === 'false' || settings.alert_tiered_enabled === false) {
    return 'common';
  }
  const rareMin = parseFloat(String(settings.alert_tiered_rare_min ?? 50)) || 50;
  const epicMin = parseFloat(String(settings.alert_tiered_epic_min ?? 200)) || 200;
  const legMin = parseFloat(String(settings.alert_tiered_legendary_min ?? 500)) || 500;

  if (amount >= legMin) return 'legendary';
  if (amount >= epicMin) return 'epic';
  if (amount >= rareMin) return 'rare';
  return 'common';
}

export function getTierTextColor(tier: AlertTier, settings?: AlertSettings): string | null {
  if (!settings || tier === 'common') return null;
  if (tier === 'rare') return settings.alert_tiered_rare_color || '#0284c7';
  if (tier === 'epic') return settings.alert_tiered_epic_color || '#9333ea';
  if (tier === 'legendary') return settings.alert_tiered_legendary_color || '#ea580c';
  return null;
}

export interface AlertCardProps {
  settings?: AlertSettings;
  alert?: {
    name?: string;
    amount?: number | string;
    message?: string;
  } | null;
  animState?: string | boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function AlertCard({
  settings = defaultAlertSettings,
  alert,
  animState = '',
  className = '',
  style = {}
}: AlertCardProps) {
  const s = { ...defaultAlertSettings, ...settings };

  // Text Shadow presets for superior legibility on both cards and live gameplay
  const shadowMode = s.alert_text_shadow || 'soft';
  let textShadowStyle = 'none';
  if (shadowMode === 'soft') {
    textShadowStyle = '0 1px 3px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08)';
  } else if (shadowMode === 'game') {
    textShadowStyle = '0 2px 4px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.75), 0 0 16px rgba(0, 0, 0, 0.5)';
  } else if (shadowMode !== 'none' && typeof shadowMode === 'string') {
    textShadowStyle = shadowMode;
  }

  const isStrokeEnabled = s.alert_text_stroke_enabled === 'true' || s.alert_text_stroke_enabled === true;
  const strokeStyle: React.CSSProperties = {
    textShadow: textShadowStyle !== 'none' ? textShadowStyle : undefined,
    ...(isStrokeEnabled ? {
      WebkitTextStroke: `${s.alert_text_stroke_width || 1}px ${s.alert_text_stroke_color || '#000000'}`,
      paintOrder: 'stroke fill'
    } : {})
  };

  const iconKey = s.alert_icon || 'gift';
  const IconComponent = ALERT_ICONS[iconKey] || ALERT_ICONS.gift;

  const isIconTransparent = s.alert_icon_bg === 'transparent';
  const isCardTransparent = s.alert_card_bg === 'transparent';
  const isTextShineEnabled = s.alert_shine_sweep !== 'false' && s.alert_shine_sweep !== false;
  const shineTheme = s.alert_shine_theme || 'crystal';

  const cardShadow = (s.alert_shadow_show === 'false' || s.alert_shadow_show === false)
    ? 'none'
    : (s.alert_glow === 'true' || s.alert_glow === true)
      ? `0 25px 50px -12px rgba(0,0,0,0.3), 0 0 35px ${s.alert_border_color && s.alert_border_color !== 'transparent' ? s.alert_border_color : '#2563eb'}66`
      : '0 25px 50px -12px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.04)';

  const stateClass = typeof animState === 'boolean'
    ? (animState ? 'show' : 'hide')
    : (animState || '');

  const animClass = `anim-${s.alert_animation || 'slide-down'}`;

  const donorName = (alert?.name || '').trim() || 'ผู้สนับสนุน';
  const actionText = (s.alert_action_text || 'โดเนทให้').trim();
  const rawAmount = alert?.amount !== undefined ? alert.amount : 0;
  const numAmount = typeof rawAmount === 'number' ? rawAmount : (parseFloat(String(rawAmount)) || 0);
  const formattedAmount = numAmount.toLocaleString('th-TH');
  const message = (alert?.message || '').trim();

  const isAmountTransparent = s.alert_amount_bg === 'transparent';
  const isMsgTransparent = s.alert_msg_bg === 'transparent';

  const tier = getAlertTier(numAmount, s);
  const isTiered = s.alert_tiered_enabled !== 'false' && s.alert_tiered_enabled !== false;
  const tierColor = isTiered ? getTierTextColor(tier, s) : null;
  const donorNameColor = tierColor || s.alert_name_color || '#0f172a';
  const amountColor = tierColor || s.alert_amount_color || '#059669';

  // Tiered Icon and Amount Box styling (harmonious palette with soft tint)
  const iconColor = tierColor || s.alert_icon_color || '#0f172a';
  const iconBg = isIconTransparent
    ? 'transparent'
    : (tierColor ? `${tierColor}14` : (s.alert_icon_bg || '#f8fafc'));
  const iconBorder = isIconTransparent
    ? 'none'
    : (tierColor ? `1.5px solid ${tierColor}3d` : `1.5px solid ${s.alert_icon_border || '#e2e8f0'}`);
  const iconShadow = isIconTransparent
    ? 'none'
    : (tierColor ? `0 4px 14px ${tierColor}20` : '0 4px 12px rgba(15, 23, 42, 0.05)');

  const amountBg = isAmountTransparent
    ? 'transparent'
    : (tierColor ? `${tierColor}14` : (s.alert_amount_bg || '#ecfdf5'));
  const amountBorder = isAmountTransparent
    ? 'none'
    : (tierColor ? `1.5px solid ${tierColor}3d` : `1.5px solid ${s.alert_amount_border || '#a7f3d0'}`);

  return (
    <div
      className={`alert-wrapper ${animClass} ${stateClass} ${className}`.trim()}
      style={{
        width: `${s.alert_card_width || 580}px`,
        maxWidth: '100%',
        fontFamily: s.alert_font ? `'${s.alert_font}', sans-serif` : undefined,
        ...style
      }}
    >
      <div
        className={`alert-card ${isTextShineEnabled ? `supporter-shine-theme-${shineTheme}` : ''}`}
        style={{
          background: s.alert_card_bg || '#ffffff',
          backdropFilter: s.alert_card_blur ? `blur(${s.alert_card_blur}px)` : 'none',
          WebkitBackdropFilter: s.alert_card_blur ? `blur(${s.alert_card_blur}px)` : 'none',
          border: isCardTransparent ? 'none' : `${s.alert_border_width ?? 1.5}px solid ${s.alert_border_color || '#e2e8f0'}`,
          borderRadius: `${s.alert_border_radius ?? 24}px`,
          boxShadow: isCardTransparent ? 'none' : cardShadow
        }}
      >
        {s.alert_shimmer_show !== 'false' && s.alert_shimmer_show !== false && (
          <div
            className="alert-shimmer"
            style={{
              background: s.alert_shimmer_color || 'linear-gradient(90deg, #0f172a 0%, #2563eb 50%, #059669 100%)'
            }}
          />
        )}

        <div
          className="alert-icon-wrap"
          style={{
            background: iconBg,
            color: iconColor,
            border: iconBorder,
            boxShadow: iconShadow,
            marginBottom: `${s.alert_icon_margin_bottom ?? 8}px`
          }}
        >
          {IconComponent}
        </div>

        <div
          className="alert-title alert-headline"
          style={{
            fontSize: `${s.alert_title_size || 26}px`,
            marginTop: `${s.alert_text_margin_top ?? 0}px`,
            marginBottom: `${s.alert_text_margin_bottom ?? 0}px`,
            marginLeft: `${s.alert_text_margin_left ?? 0}px`,
            marginRight: `${s.alert_text_margin_right ?? 0}px`,
            letterSpacing: `${s.alert_letter_spacing ?? 0}px`,
            gap: `${s.alert_word_gap ?? 8}px`,
            lineHeight: s.alert_line_height ? Number(s.alert_line_height) : 1.35,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <span
            className="donator-name"
            style={{
              color: donorNameColor,
              letterSpacing: `${s.alert_letter_spacing ?? 0}px`,
              ...strokeStyle
            }}
          >
            <span
              className={isTextShineEnabled ? 'supporter-shimmer-text' : undefined}
              style={isTextShineEnabled ? {
                ['--text-color' as any]: donorNameColor,
                ['--text-shine-delay' as any]: '0s',
                ...strokeStyle
              } : undefined}
            >
              {donorName}
            </span>
          </span>

          <span
            className="alert-action-text"
            style={{
              color: s.alert_action_color || '#64748b',
              letterSpacing: `${s.alert_letter_spacing ?? 0}px`,
              ...strokeStyle
            }}
          >
            {actionText}
          </span>

          <span
            className="alert-amount-wrap"
            style={{
              background: amountBg,
              color: amountColor,
              border: amountBorder,
              fontSize: `${s.alert_amount_size || 22}px`,
              boxShadow: 'none',
              padding: isAmountTransparent ? '0' : '2px 14px',
              letterSpacing: `${s.alert_letter_spacing ?? 0}px`
            }}
          >
            <span
              className="alert-amount-val"
              style={{
                color: amountColor,
                ...strokeStyle
              }}
            >
              <span
                className={isTextShineEnabled ? 'supporter-shimmer-text' : undefined}
                style={isTextShineEnabled ? {
                  ['--text-color' as any]: amountColor,
                  ['--text-shine-delay' as any]: '0.2s',
                  ...strokeStyle
                } : undefined}
              >
                {formattedAmount}
              </span>
            </span>
            <span className="alert-currency" style={{ color: amountColor, ...strokeStyle }}>บาท</span>
          </span>
        </div>

        {message !== '' && (
          <div
            className="alert-message"
            style={{
              background: s.alert_msg_bg || '#f8fafc',
              color: s.alert_msg_color || '#334155',
              fontSize: `${s.alert_msg_size || 18}px`,
              border: isMsgTransparent ? 'none' : `1px solid ${s.alert_msg_border || '#e2e8f0'}`,
              padding: isMsgTransparent ? '4px 0' : '12px 18px',
              letterSpacing: `${s.alert_letter_spacing ?? 0}px`,
              marginTop: `${s.alert_msg_margin_top ?? 8}px`,
              ...strokeStyle
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
