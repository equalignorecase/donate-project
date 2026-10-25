import { GoalAppearance, goalAppearanceDefaults, formatGoalDuration } from '@/lib/goalAppearance';
import { Clock } from 'lucide-react';
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
  const percent = Math.min(100, Math.max(0, (current / safeTarget) * 100));
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

  return (
    <section 
      className={`obs-widget goal-widget${isCardTransparent ? ' goal-widget-no-bg' : ''}`} 
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
      <h1 
        className={`goal-title${isHUD ? ' goal-title-hud' : ''}`}
        style={{ 
          fontSize: `${appearance.goal_title_size}px`,
          textAlign: isFlat ? 'left' : 'center',
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
        {isHUD && !isTextInside && appearance.goal_show_percent === 'true' && <span className="goal-hud-percent" style={{ color: appearance.goal_accent_color }}>{percent.toFixed(1)}%</span>}
      </h1>

      {isShowDuration && durationText && durationPosition === 'top' && (
        <div className="goal-duration-badge-wrapper">
          {renderDurationBadge()}
        </div>
      )}

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
          {appearance.goal_bar_shine === 'true' && hasGloss && (
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

        {/* Text centered inside the bar: e.g. 50฿ (50%) */}
        {isTextInside && (
          <div 
            className="goal-bar-percent" 
            style={{ 
              fontSize: `${appearance.goal_amount_size ?? 19}px` 
            }}
          >
            {money(current)}฿ ({percent.toFixed(0)}%)
          </div>
        )}
      </div>
      {isHUD && <svg className="goal-hud-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{ color: barStart }}><path d="M4 1 H99 V80 L96 99 H1 V20 Z" /><path d="M6 12 H96 V74 L94 88 H4 V26 Z" opacity="0.35" /></svg>}
      </div>

      {!isTextInside && isFlat && !isFloating && (appearance.goal_show_amount === 'true' || appearance.goal_show_percent === 'true') && (
        <div className="goal-compact-meta" style={{ fontSize: `${appearance.goal_amount_size}px` }}>
          {appearance.goal_show_amount === 'true' && <div className="goal-values"><strong>฿{money(current)}</strong><span>/ ฿{money(safeTarget)}</span></div>}
          {appearance.goal_show_percent === 'true' && !isHUD && <span style={{ color: appearance.goal_accent_color }}>{percent.toFixed(1)}%{current >= safeTarget ? ' · ถึงเป้าหมายแล้ว!' : ''}</span>}
        </div>
      )}

      {!isTextInside && isFloating && (appearance.goal_show_amount === 'true' || appearance.goal_show_percent === 'true') && (
        <div className="goal-floating-meta" style={{ fontSize: `${appearance.goal_amount_size}px` }}>
          {appearance.goal_show_percent === 'true' && <span style={{ color: appearance.goal_accent_color }}>{percent.toFixed(1)}%</span>}
          {appearance.goal_show_amount === 'true' && <span className="goal-floating-target">เป้าหมาย ฿{money(safeTarget)}</span>}
        </div>
      )}

      {!isTextInside && !isFlat && appearance.goal_show_percent === 'true' && (
        <div className="goal-percent" style={{ color: appearance.goal_accent_color }}>
          {percent.toFixed(1)}%{current >= safeTarget ? ' · ถึงเป้าหมายแล้ว!' : ''}
        </div>
      )}

      {isShowDuration && durationText && durationPosition === 'bottom' && (
        <div className="goal-duration-badge-wrapper goal-duration-wrapper-bottom">
          {renderDurationBadge()}
        </div>
      )}
    </section>
  );
}
