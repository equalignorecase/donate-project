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
  alert_card_bg: 'transparent',
  alert_card_blur: 0,
  alert_card_width: 580,
  alert_border_color: 'transparent',
  alert_border_width: 0,
  alert_border_radius: 0,
  alert_shadow_show: 'false',
  alert_glow: 'false',
  alert_shimmer_show: 'false',
  alert_shimmer_color: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
  alert_icon: 'heart',
  alert_icon_bg: '#f8fafc',
  alert_icon_color: '#38bdf8',
  alert_icon_border: '#e2e8f0',
  alert_name_color: '#38bdf8',
  alert_action_color: '#e2e8f0',
  alert_action_text: 'โดเนทให้',
  alert_title_size: 28,
  alert_amount_bg: 'transparent',
  alert_amount_color: '#38bdf8',
  alert_amount_border: 'transparent',
  alert_amount_size: 26,
  alert_msg_bg: 'transparent',
  alert_msg_color: '#ffffff',
  alert_msg_border: 'transparent',
  alert_msg_size: 18,
  alert_letter_spacing: 0,
  alert_word_gap: 8,
  alert_text_margin_top: 0,
  alert_text_margin_bottom: 0,
  alert_text_margin_left: 0,
  alert_text_margin_right: 0,
  alert_icon_margin_bottom: 5,
  alert_msg_margin_top: 0,
  alert_line_height: 1.35,
  alert_text_stroke_enabled: 'true',
  alert_text_stroke_color: '#000000',
  alert_text_stroke_width: 1,
  alert_card_beam: 'false',
  alert_card_beam_color: 'auto',
  alert_confetti_enabled: 'true',
  alert_particle_style: 'confetti',
  alert_tiered_enabled: 'true',
  alert_tiered_rare_min: 50,
  alert_tiered_epic_min: 200,
  alert_tiered_legendary_min: 500,
  alert_tiered_common_color: '#22c55e',
  alert_tiered_common_from: '#22c55e',
  alert_tiered_common_to: '#10b981',
  alert_tiered_rare_color: '#00c6ff',
  alert_tiered_rare_from: '#00c6ff',
  alert_tiered_rare_to: '#0072ff',
  alert_tiered_epic_color: '#a855f7',
  alert_tiered_epic_from: '#da22ff',
  alert_tiered_epic_to: '#9733ee',
  alert_tiered_legendary_color: '#f59e0b',
  alert_tiered_legendary_from: '#f12711',
  alert_tiered_legendary_to: '#f5af19',
  alert_text_shadow: 'soft',
  alert_text_gradient_enabled: 'true',
  alert_text_gradient_preset: 'neon_pink',
  alert_text_gradient_from: '#f857a6',
  alert_text_gradient_to: '#ff5858',
  alert_text_gradient_angle: 135,
  alert_shine_sweep: 'true',
  alert_shine_theme: 'crystal',
  alert_animation: 'bounce',
  alert_duration: 8,
  alert_volume: 80,
  tts_enabled: 'true',
  tts_min_amount: 0
};

export interface TextGradientPreset {
  id: string;
  name: string;
  nameTh: string;
  from: string;
  to: string;
  angle: number;
}

export const TEXT_GRADIENT_PRESETS: TextGradientPreset[] = [
  { id: 'sunset', name: 'Sunset Glow', nameTh: 'อาทิตย์อัสดง (Sunset)', from: '#ff512f', to: '#dd2476', angle: 135 },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', nameTh: 'ไซเบอร์พังก์ (Cyan/Blue)', from: '#00f2fe', to: '#4facfe', angle: 135 },
  { id: 'golden', name: 'Golden Hour', nameTh: 'ทองคำอร่าม (Golden)', from: '#f6d365', to: '#fda085', angle: 135 },
  { id: 'neon_pink', name: 'Neon Rose', nameTh: 'กุหลาบนีออน (Rose Pink)', from: '#f857a6', to: '#ff5858', angle: 135 },
  { id: 'emerald', name: 'Emerald Aura', nameTh: 'มรกตประกาย (Emerald)', from: '#0ba360', to: '#3cba92', angle: 135 },
  { id: 'cosmic', name: 'Cosmic Violet', nameTh: 'คอสมิกม่วง (Cosmic)', from: '#7f00ff', to: '#e100ff', angle: 135 },
  { id: 'flame', name: 'Fire Flame', nameTh: 'เพลิงสุริยัน (Fire Flame)', from: '#f83600', to: '#fe8c00', angle: 135 },
  { id: 'ocean', name: 'Deep Ocean', nameTh: 'มหาสมุทรสีคราม (Ocean)', from: '#2e86de', to: '#54a0ff', angle: 135 }
];

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
  if (!settings) return null;
  if (tier === 'common') return settings.alert_tiered_common_color || '#22c55e';
  if (tier === 'rare') return settings.alert_tiered_rare_color || '#00c6ff';
  if (tier === 'epic') return settings.alert_tiered_epic_color || '#a855f7';
  if (tier === 'legendary') return settings.alert_tiered_legendary_color || '#f59e0b';
  return null;
}

const CONFETTI_PARTICLES = Array.from({ length: 30 }, (_, i) => {
  const angle = (i / 30) * Math.PI * 2 + (Math.sin(i * 13) * 0.25);
  const dist = 140 + (i % 5) * 38;
  const popX = Math.round(Math.cos(angle) * dist);
  const popY = Math.round(Math.sin(angle) * (dist * 0.65) - 30);
  const rotMid = Math.round((i * 45) % 360 - 180);
  const rotEnd = Math.round(rotMid + (i % 2 === 0 ? 360 : -360));
  const delay = ((i % 6) * 0.04).toFixed(2);
  const type: 'ribbon' | 'dot' | 'star' = i % 4 === 0 ? 'star' : i % 2 === 0 ? 'ribbon' : 'dot';
  return { id: i, popX, popY, rotMid, rotEnd, delay, type };
});

function getParticleColor(index: number, tier: AlertTier, style: string): string {
  if (style === 'gold_sparkle') {
    const colors = ['#f59e0b', '#fbbf24', '#d97706', '#ffffff', '#fef08a', '#eab308'];
    return colors[index % colors.length];
  }
  if (style === 'hearts') {
    const colors = ['#f43f5e', '#ec4899', '#fb7185', '#fda4af', '#ffffff', '#e11d48'];
    return colors[index % colors.length];
  }
  if (style === 'fire_sparks') {
    const colors = ['#ef4444', '#f97316', '#ea580c', '#f59e0b', '#dc2626', '#ffedd5'];
    return colors[index % colors.length];
  }
  // Default 'confetti'
  if (tier === 'legendary') {
    const colors = ['#f59e0b', '#ef4444', '#f97316', '#fbbf24', '#ffffff', '#e11d48'];
    return colors[index % colors.length];
  }
  if (tier === 'epic') {
    const colors = ['#a855f7', '#ec4899', '#c084fc', '#38bdf8', '#ffffff', '#8b5cf6'];
    return colors[index % colors.length];
  }
  if (tier === 'rare') {
    const colors = ['#0ea5e9', '#38bdf8', '#06b6d4', '#10b981', '#ffffff', '#3b82f6'];
    return colors[index % colors.length];
  }
  if (tier === 'common') {
    const colors = ['#22c55e', '#10b981', '#4ade80', '#86efac', '#ffffff', '#16a34a'];
    return colors[index % colors.length];
  }
  const colors = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
  return colors[index % colors.length];
}

function getParticleType(index: number, style: string): 'ribbon' | 'dot' | 'star' | 'heart' | 'fire' {
  if (style === 'hearts') {
    return index % 3 === 0 ? 'heart' : index % 2 === 0 ? 'star' : 'dot';
  }
  if (style === 'fire_sparks') {
    return index % 3 === 0 ? 'fire' : index % 2 === 0 ? 'star' : 'dot';
  }
  if (style === 'gold_sparkle') {
    return index % 2 === 0 ? 'star' : 'dot';
  }
  return index % 4 === 0 ? 'star' : index % 2 === 0 ? 'ribbon' : 'dot';
}

export function AlertConfetti({
  active,
  tier = 'common',
  style = 'confetti'
}: {
  active: boolean;
  tier?: AlertTier;
  style?: string;
}) {
  const [burstKey, setBurstKey] = React.useState(0);

  React.useEffect(() => {
    if (active) {
      setBurstKey(k => k + 1);
    }
  }, [active]);

  if (style === 'none' || (!active && burstKey === 0)) return null;

  return (
    <div key={burstKey} className="alert-confetti-container" aria-hidden="true">
      {CONFETTI_PARTICLES.map((p) => {
        const type = getParticleType(p.id, style);
        const color = getParticleColor(p.id, tier, style);
        const popY = (style === 'hearts' || style === 'fire_sparks') ? p.popY - 50 : p.popY;
        return (
          <div
            key={p.id}
            className={`alert-confetti-item alert-confetti-${type}`}
            style={{
              ['--pop-x' as any]: `${p.popX}px`,
              ['--pop-y' as any]: `${popY}px`,
              ['--rot-mid' as any]: `${p.rotMid}deg`,
              ['--rot-end' as any]: `${p.rotEnd}deg`,
              animationDelay: `${p.delay}s`,
              backgroundColor: (type === 'ribbon' || type === 'dot') ? color : undefined,
              color: color
            }}
          >
            {type === 'star' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            )}
            {type === 'heart' && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill={color}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            )}
            {type === 'fire' && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill={color}>
                <path d="M12 2c-.5 2.5-2 4.9-4 6.5-2 1.6-3 3.5-3 5.5a7 7 0 1 0 14 0c0-2-1-3.9-3-5.5-2-1.6-3.5-4-4-6.5z" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
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

  const isBeamEnabled = s.alert_card_beam === 'true' || s.alert_card_beam === true;
  const isConfettiEnabled = s.alert_confetti_enabled === 'true' || s.alert_confetti_enabled === true;

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
  const useTierSolidColor = Boolean(tierColor);
  const donorNameColor = tierColor || s.alert_name_color || '#0f172a';
  const amountColor = tierColor || s.alert_amount_color || '#059669';

  // Text Gradient logic
  const isGradientEnabled = s.alert_text_gradient_enabled === 'true' || s.alert_text_gradient_enabled === true;
  let gradientFrom = s.alert_text_gradient_from || '#ff512f';
  let gradientTo = s.alert_text_gradient_to || '#dd2476';

  if (isTiered) {
    if (tier === 'common') {
      gradientFrom = s.alert_tiered_common_from || s.alert_tiered_common_color || '#22c55e';
      gradientTo = s.alert_tiered_common_to || '#10b981';
    } else if (tier === 'rare') {
      gradientFrom = s.alert_tiered_rare_from || s.alert_tiered_rare_color || '#00c6ff';
      gradientTo = s.alert_tiered_rare_to || '#0072ff';
    } else if (tier === 'epic') {
      gradientFrom = s.alert_tiered_epic_from || s.alert_tiered_epic_color || '#da22ff';
      gradientTo = s.alert_tiered_epic_to || '#9733ee';
    } else if (tier === 'legendary') {
      gradientFrom = s.alert_tiered_legendary_from || s.alert_tiered_legendary_color || '#f12711';
      gradientTo = s.alert_tiered_legendary_to || '#f5af19';
    }
  }

  // Active Accent Color: Tier Color (when tiered) > Gradient Start Color (when gradient enabled) > User Icon Color
  const activeAccent = isTiered
    ? (tierColor || gradientFrom)
    : (isGradientEnabled ? gradientFrom : (s.alert_icon_color || '#0f172a'));

  // Beam Color logic
  const beamColorMode = s.alert_card_beam_color || 'auto';
  let resolvedBeamColor = '#38bdf8';
  if (beamColorMode !== 'auto' && beamColorMode.startsWith('#')) {
    resolvedBeamColor = beamColorMode;
  } else if (activeAccent && activeAccent !== '#0f172a') {
    resolvedBeamColor = activeAccent;
  } else if (s.alert_border_color && s.alert_border_color !== 'transparent') {
    resolvedBeamColor = s.alert_border_color;
  }

  // Tiered / Gradient Icon and Amount Box styling
  const iconColor = activeAccent;
  const iconBg = isIconTransparent
    ? 'transparent'
    : (activeAccent && activeAccent !== '#0f172a'
        ? `${activeAccent}14`
        : (s.alert_icon_bg || '#f8fafc'));
  const iconBorder = isIconTransparent
    ? 'none'
    : (activeAccent && activeAccent !== '#0f172a'
        ? `1.5px solid ${activeAccent}3d`
        : `1.5px solid ${s.alert_icon_border || '#e2e8f0'}`);
  const iconShadow = isIconTransparent
    ? 'none'
    : (activeAccent && activeAccent !== '#0f172a'
        ? `0 4px 14px ${activeAccent}20`
        : '0 4px 12px rgba(15, 23, 42, 0.05)');

  const amountBg = isAmountTransparent
    ? 'transparent'
    : (activeAccent && activeAccent !== '#0f172a'
        ? `${activeAccent}14`
        : (s.alert_amount_bg || '#ecfdf5'));
  const amountBorder = isAmountTransparent
    ? 'none'
    : (activeAccent && activeAccent !== '#0f172a'
        ? `1.5px solid ${activeAccent}3d`
        : `1.5px solid ${s.alert_amount_border || '#a7f3d0'}`);

  const gradientAngle = Number(s.alert_text_gradient_angle) || 135;
  const staticGradient = `linear-gradient(${gradientAngle}deg, ${gradientFrom} 0%, ${gradientTo} 100%)`;

  let shineHighlight = '#ffffff';
  let shineGlow = 'rgba(255, 255, 255, 0.85)';
  if (shineTheme === 'gold') {
    shineHighlight = '#fde68a';
    shineGlow = 'rgba(245, 158, 11, 0.85)';
  } else if (shineTheme === 'cyan') {
    shineHighlight = '#67e8f9';
    shineGlow = 'rgba(6, 182, 212, 0.85)';
  }

  const shimmerGradient = `linear-gradient(115deg, ${gradientFrom} 0%, ${gradientTo} 32%, ${shineHighlight} 50%, ${gradientFrom} 68%, ${gradientTo} 100%)`;

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
      {/* Confetti & Particle Burst outside card */}
      {isConfettiEnabled && s.alert_particle_style !== 'none' && (
        <AlertConfetti
          active={stateClass === 'show'}
          tier={tier}
          style={s.alert_particle_style || 'confetti'}
        />
      )}

      {/* Main Alert Card */}
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
        {/* 360° Neon Border Beam */}
        {isBeamEnabled && !isCardTransparent && (
          <div
            className="alert-card-beam-wrap"
            aria-hidden="true"
            style={{
              borderRadius: `${s.alert_border_radius ?? 24}px`,
              ['--beam-width' as any]: `${Math.max(Number(s.alert_border_width) || 0, 2.5)}px`
            }}
          >
            <div
              className="alert-card-beam-spinner"
              style={{ ['--beam-color' as any]: resolvedBeamColor }}
            />
          </div>
        )}

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
              color: useTierSolidColor || !isGradientEnabled ? donorNameColor : undefined,
              letterSpacing: `${s.alert_letter_spacing ?? 0}px`,
              ...strokeStyle,
              ...(isGradientEnabled && !useTierSolidColor && !isTextShineEnabled ? {
                backgroundImage: staticGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block'
              } : {})
            }}
          >
            <span
              className={isTextShineEnabled ? 'supporter-shimmer-text' : undefined}
              style={isTextShineEnabled ? {
                ...(useTierSolidColor ? {
                  ['--text-color' as any]: donorNameColor,
                } : isGradientEnabled ? {
                  backgroundImage: shimmerGradient,
                  ['--shine-glow' as any]: shineGlow,
                } : {
                  ['--text-color' as any]: donorNameColor,
                }),
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
              color: useTierSolidColor || !isGradientEnabled ? amountColor : undefined,
              border: amountBorder,
              fontSize: `${s.alert_amount_size || 22}px`,
              boxShadow: 'none',
              padding: isAmountTransparent ? '0' : '2px 14px',
              letterSpacing: `${s.alert_letter_spacing ?? 0}px`
            }}
          >
            <span
              className={isTextShineEnabled ? 'supporter-shimmer-text' : undefined}
              style={{
                color: useTierSolidColor || !isGradientEnabled ? amountColor : undefined,
                display: 'inline-block',
                ...strokeStyle,
                ...(isGradientEnabled && !useTierSolidColor && !isTextShineEnabled ? {
                  backgroundImage: staticGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } : {}),
                ...(isTextShineEnabled ? {
                  ...(useTierSolidColor ? {
                    ['--text-color' as any]: amountColor,
                  } : isGradientEnabled ? {
                    backgroundImage: shimmerGradient,
                    ['--shine-glow' as any]: shineGlow,
                  } : {
                    ['--text-color' as any]: amountColor,
                  }),
                  ['--text-shine-delay' as any]: '0.2s',
                  ...strokeStyle
                } : {})
              }}
            >
              <span className="alert-amount-val" style={{ color: useTierSolidColor || !isGradientEnabled ? amountColor : 'inherit' }}>{formattedAmount}</span>
              {' '}
              <span className="alert-currency" style={{ color: useTierSolidColor || !isGradientEnabled ? amountColor : 'inherit', opacity: 1 }}>บาท</span>
            </span>
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
