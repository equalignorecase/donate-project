'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode } from 'lucide-react';
import { QrCardAppearance, qrCardDefaults } from '@/lib/qrCardAppearance';
import '../widgets.css';

function hexToRgba(hex: string, alpha: number): string {
  const clean = (hex || '#0f172a').replace('#', '');
  if (clean.length !== 6) return `rgba(15, 23, 42, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const SHINE_THEME_MAP: Record<string, { beamBg: string; beamShadow: string; textStops: string }> = {
  gold: {
    beamBg: 'linear-gradient(90deg, transparent 0%, rgba(245, 158, 11, 0.12) 20%, rgba(253, 224, 71, 0.45) 46%, rgba(255, 255, 255, 0.9) 50%, rgba(253, 224, 71, 0.45) 54%, rgba(245, 158, 11, 0.12) 80%, transparent 100%)',
    beamShadow: '0 0 24px 4px rgba(250, 204, 21, 0.45)',
    textStops: '#f59e0b 40%, #ffffff 50%, #fde047 60%',
  },
  cyan: {
    beamBg: 'linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.12) 20%, rgba(103, 232, 249, 0.45) 46%, rgba(255, 255, 255, 0.9) 50%, rgba(103, 232, 249, 0.45) 54%, rgba(6, 182, 212, 0.12) 80%, transparent 100%)',
    beamShadow: '0 0 24px 4px rgba(34, 211, 238, 0.45)',
    textStops: '#06b6d4 40%, #ffffff 50%, #67e8f9 60%',
  },
  rose: {
    beamBg: 'linear-gradient(90deg, transparent 0%, rgba(236, 72, 153, 0.12) 20%, rgba(249, 168, 212, 0.45) 46%, rgba(255, 255, 255, 0.9) 50%, rgba(249, 168, 212, 0.45) 54%, rgba(236, 72, 153, 0.12) 80%, transparent 100%)',
    beamShadow: '0 0 24px 4px rgba(244, 114, 182, 0.45)',
    textStops: '#ec4899 40%, #ffffff 50%, #f9a8d4 60%',
  },
  emerald: {
    beamBg: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.12) 20%, rgba(110, 231, 183, 0.45) 46%, rgba(255, 255, 255, 0.9) 50%, rgba(110, 231, 183, 0.45) 54%, rgba(16, 185, 129, 0.12) 80%, transparent 100%)',
    beamShadow: '0 0 24px 4px rgba(52, 211, 153, 0.45)',
    textStops: '#10b981 40%, #ffffff 50%, #6ee7b7 60%',
  },
  rainbow: {
    beamBg: 'linear-gradient(90deg, transparent 0%, rgba(244, 63, 94, 0.25) 22%, rgba(250, 204, 21, 0.4) 38%, rgba(255, 255, 255, 0.92) 50%, rgba(52, 211, 153, 0.4) 62%, rgba(56, 189, 248, 0.3) 78%, transparent 100%)',
    beamShadow: '0 0 26px 5px rgba(168, 85, 247, 0.5)',
    textStops: '#f43f5e 36%, #facc15 44%, #ffffff 50%, #34d399 56%, #38bdf8 64%',
  },
  crystal: {
    beamBg: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.12) 20%, rgba(186, 230, 253, 0.45) 46%, rgba(255, 255, 255, 0.92) 50%, rgba(186, 230, 253, 0.45) 54%, rgba(56, 189, 248, 0.12) 80%, transparent 100%)',
    beamShadow: '0 0 24px 4px rgba(186, 230, 253, 0.48)',
    textStops: '#38bdf8 40%, #ffffff 50%, #bae6fd 60%',
  },
};

export default function QrCardWidget({
  appearance = qrCardDefaults,
}: {
  appearance?: QrCardAppearance;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [fallbackOrigin, setFallbackOrigin] = useState<string>('https://example.com');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      setFallbackOrigin(window.location.origin);
    }
  }, []);

  const isQrMode = appearance.qr_card_mode !== 'image';
  const targetUrl = appearance.qr_card_qr_url.trim() || `${fallbackOrigin}/donate`;
  const fgColor = appearance.qr_card_qr_fg_color || '#0f172a';
  const bgColor = appearance.qr_card_qr_bg_color || '#ffffff';

  useEffect(() => {
    if (!isQrMode) return;
    let active = true;
    QRCode.toDataURL(targetUrl, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then(url => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [isQrMode, targetUrl, fgColor, bgColor]);

  const opacity = Math.max(0, Math.min(100, Number(appearance.qr_card_opacity ?? 90))) / 100;
  const showBg = appearance.qr_card_show_bg !== 'false' && opacity > 0;
  const bg = showBg ? hexToRgba(appearance.qr_card_bg_color, opacity) : 'transparent';
  const showBorder = appearance.qr_card_show_border !== 'false';
  const isRainbow = appearance.qr_card_rainbow_border === 'true' && showBorder;
  const isHorizontal = appearance.qr_card_layout === 'horizontal';
  const textAlign = (appearance.qr_card_text_align as 'left' | 'center' | 'right') || 'center';
  const mediaSize = Number(appearance.qr_card_media_size || 180);
  const mediaRadius = Number(appearance.qr_card_media_radius || 16);
  const mediaPadding = Number(appearance.qr_card_media_padding ?? 10);
  const padding = Number(appearance.qr_card_padding ?? 20);
  const gap = Number(appearance.qr_card_gap ?? 14);
  const textGap = Number(appearance.qr_card_text_gap ?? 6);
  const radius = Number(appearance.qr_card_radius ?? 24);
  const width = Number(appearance.qr_card_width ?? 320);

  const imageSrc = isQrMode ? qrDataUrl : appearance.qr_card_image_url.trim();
  const showBadge = appearance.qr_card_show_badge !== 'false' && Boolean(appearance.qr_card_badge_text.trim());
  const showTitle = appearance.qr_card_show_title !== 'false' && Boolean(appearance.qr_card_title.trim());
  const showSubtitle = appearance.qr_card_show_subtitle !== 'false' && Boolean(appearance.qr_card_subtitle.trim());
  const hasText = showBadge || showTitle || showSubtitle;

  const isShineEnabled = appearance.qr_card_shine_sweep !== 'false';
  const shineOnCard = isShineEnabled && appearance.qr_card_shine_card !== 'false';
  const shineOnTitle = isShineEnabled && appearance.qr_card_shine_title !== 'false';
  const shineOnSubtitle = isShineEnabled && appearance.qr_card_shine_subtitle === 'true';
  const hasAnyShine = shineOnCard || shineOnTitle || shineOnSubtitle;
  const shineTheme = appearance.qr_card_shine_theme || 'crystal';
  const shineCfg = SHINE_THEME_MAP[shineTheme] || SHINE_THEME_MAP.crystal;
  const pauseSec = Math.max(1, Math.min(15, Number(appearance.qr_card_shine_delay || '3')));
  const sweepSec = 1.65;
  const totalSec = Number((sweepSec + pauseSec).toFixed(2));
  const pEnd = Number(((sweepSec / totalSec) * 100).toFixed(2));
  const titleBaseColor = appearance.qr_card_title_color || '#ffffff';
  const subtitleBaseColor = appearance.qr_card_subtitle_color || '#cbd5e1';
  const buildTextShimmer = (baseColor: string) => ({
    backgroundImage: `linear-gradient(110deg, ${baseColor} 0%, ${baseColor} 32%, ${shineCfg.textStops}, ${baseColor} 68%, ${baseColor} 100%)`,
    backgroundSize: '250% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: `qr-card-text-shine ${totalSec}s cubic-bezier(0.22, 1, 0.36, 1) infinite`,
  });

  const sectionFontFamily =
    appearance.qr_card_font === 'LINESeedSansTH-ExtraBold'
      ? `'QrCardExtraBold', sans-serif`
      : `'${appearance.qr_card_font}', sans-serif`;

  return (
    <section
      className={`obs-widget qr-card-widget${isRainbow ? ' supporter-beam-rainbow' : ''}`}
      style={{
        fontFamily: sectionFontFamily,
        width: `${width}px`,
        maxWidth: '100%',
        padding: `${padding}px`,
        borderRadius: `${radius}px`,
        borderWidth: showBorder ? (isRainbow ? 2 : 1.5) : 0,
        borderStyle: 'solid',
        borderColor: isRainbow ? 'transparent' : (showBorder ? appearance.qr_card_border_color : 'transparent'),
        background: isRainbow ? undefined : bg,
        boxShadow: showBg ? '0 14px 36px rgba(0, 0, 0, 0.38)' : 'none',
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${gap}px`,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        ['--row-bg' as any]: bg === 'transparent' ? '#0f172a' : bg,
      }}
    >
      <style>{`
        @font-face {
          font-family: 'QrCardExtraBold';
          src: url('/font/LINESeedSansTH-ExtraBold.ttf') format('truetype');
          font-weight: 100 900;
          font-style: normal;
          font-display: swap;
        }
      `}</style>
      {hasAnyShine && (
        <style>{`
          @keyframes qr-card-beam-glide {
            0% { transform: translate3d(-140%, 0, 0) skewX(-24deg); opacity: 0; }
            ${Number((pEnd * 0.1).toFixed(2))}% { opacity: 0.95; }
            ${Number((pEnd * 0.85).toFixed(2))}% { opacity: 0.95; }
            ${pEnd}% { transform: translate3d(520%, 0, 0) skewX(-24deg); opacity: 0; }
            100% { transform: translate3d(520%, 0, 0) skewX(-24deg); opacity: 0; }
          }
          @keyframes qr-card-text-shine {
            0% { background-position: 135% 0; }
            ${pEnd}% { background-position: -35% 0; }
            100% { background-position: -35% 0; }
          }
        `}</style>
      )}
      {shineOnCard && (
        <span
          className="qr-card-shine-beam"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-45%',
            left: 0,
            width: '28%',
            minWidth: '90px',
            height: '190%',
            pointerEvents: 'none',
            zIndex: 0,
            background: shineCfg.beamBg,
            boxShadow: shineCfg.beamShadow,
            animation: `qr-card-beam-glide ${totalSec}s cubic-bezier(0.22, 1, 0.36, 1) infinite`,
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* Media Box: QR Code or Uploaded Image */}
      <div
        style={{
          width: `${mediaSize}px`,
          height: `${mediaSize}px`,
          flexShrink: 0,
          borderRadius: `${mediaRadius}px`,
          padding: `${isQrMode ? mediaPadding : 0}px`,
          background: isQrMode ? bgColor : 'transparent',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isQrMode ? '0 6px 18px rgba(0,0,0,0.22)' : undefined,
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={appearance.qr_card_title || 'QR Code'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: isQrMode ? 'contain' : 'cover',
              display: 'block',
              borderRadius: isQrMode ? `${Math.max(0, mediaRadius - 4)}px` : `${mediaRadius}px`,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.06)',
              border: '1.5px dashed rgba(255,255,255,0.25)',
              borderRadius: `${mediaRadius}px`,
              color: 'rgba(255,255,255,0.55)',
              fontSize: '12px',
              textAlign: 'center',
              padding: '12px',
            }}
          >
            <QrCode size={28} />
            <span>{isQrMode ? 'กำลังสร้าง QR…' : 'ยังไม่มีรูปภาพ'}</span>
          </div>
        )}
      </div>

      {/* Text Block */}
      {hasText && (
        <div
          style={{
            flex: isHorizontal ? 1 : undefined,
            minWidth: 0,
            width: isHorizontal ? undefined : '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems:
              textAlign === 'left'
                ? 'flex-start'
                : textAlign === 'right'
                ? 'flex-end'
                : 'center',
            textAlign,
            gap: `${textGap}px`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {showBadge && (
            <span
              style={{
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                background: appearance.qr_card_badge_bg_color,
                color: appearance.qr_card_badge_text_color,
                lineHeight: 1.35,
              }}
            >
              {appearance.qr_card_badge_text}
            </span>
          )}
          {showTitle && (
            <h2
              style={{
                margin: 0,
                fontFamily:
                  appearance.qr_card_font === 'LINESeedSansTH' || appearance.qr_card_font === 'LINESeedSansTH-ExtraBold'
                    ? `'QrCardExtraBold', 'LINESeedSansTH', sans-serif`
                    : undefined,
                fontSize: `${appearance.qr_card_title_size}px`,
                fontWeight: 800,
                color: titleBaseColor,
                lineHeight: 1.25,
                overflowWrap: 'anywhere',
                ...(shineOnTitle ? buildTextShimmer(titleBaseColor) : {}),
              }}
            >
              {appearance.qr_card_title}
            </h2>
          )}
          {showSubtitle && (
            <p
              style={{
                margin: 0,
                fontSize: `${appearance.qr_card_subtitle_size}px`,
                fontWeight: 500,
                color: subtitleBaseColor,
                lineHeight: 1.35,
                overflowWrap: 'anywhere',
                ...(shineOnSubtitle ? buildTextShimmer(subtitleBaseColor) : {}),
              }}
            >
              {appearance.qr_card_subtitle}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
