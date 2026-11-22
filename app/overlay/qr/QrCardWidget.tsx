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

  return (
    <section
      className={`obs-widget qr-card-widget${isRainbow ? ' supporter-beam-rainbow' : ''}`}
      style={{
        fontFamily: `'${appearance.qr_card_font}', sans-serif`,
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
        ['--row-bg' as any]: bg === 'transparent' ? '#0f172a' : bg,
      }}
    >
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
                fontSize: `${appearance.qr_card_title_size}px`,
                fontWeight: 800,
                color: appearance.qr_card_title_color,
                lineHeight: 1.25,
                overflowWrap: 'anywhere',
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
                color: appearance.qr_card_subtitle_color,
                lineHeight: 1.35,
                overflowWrap: 'anywhere',
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
