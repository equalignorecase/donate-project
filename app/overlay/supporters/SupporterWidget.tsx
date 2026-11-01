import { Supporter } from '@/lib/widgets';
import { SupporterAppearance, SupporterMode, supporterModes } from '@/lib/supporterAppearance';
import '../widgets.css';

interface ShineThemeConfig {
  leadEdge: string;
  core: string;
  trailEdge: string;
  glowPrimary: string;
  glowSecondary: string;
  rowBeamGradient: string;
  rowBeamShadow: string;
}

function getShineThemeConfig(theme: string): ShineThemeConfig {
  switch (theme) {
    case 'gold':
      return {
        leadEdge: '#f59e0b',
        core: '#ffffff',
        trailEdge: '#fde047',
        glowPrimary: 'rgba(250, 204, 21, 0.95)',
        glowSecondary: 'rgba(245, 158, 11, 0.75)',
        rowBeamGradient: 'linear-gradient(90deg, transparent 0%, rgba(245, 158, 11, 0.08) 20%, rgba(253, 224, 71, 0.38) 46%, rgba(255, 255, 255, 0.85) 50%, rgba(253, 224, 71, 0.38) 54%, rgba(245, 158, 11, 0.08) 80%, transparent 100%)',
        rowBeamShadow: '0 0 24px 4px rgba(250, 204, 21, 0.45)',
      };
    case 'cyan':
      return {
        leadEdge: '#06b6d4',
        core: '#ffffff',
        trailEdge: '#67e8f9',
        glowPrimary: 'rgba(34, 211, 238, 0.95)',
        glowSecondary: 'rgba(6, 182, 212, 0.75)',
        rowBeamGradient: 'linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.08) 20%, rgba(103, 232, 249, 0.4) 46%, rgba(255, 255, 255, 0.88) 50%, rgba(103, 232, 249, 0.4) 54%, rgba(6, 182, 212, 0.08) 80%, transparent 100%)',
        rowBeamShadow: '0 0 24px 4px rgba(34, 211, 238, 0.45)',
      };
    case 'rose':
      return {
        leadEdge: '#ec4899',
        core: '#ffffff',
        trailEdge: '#f9a8d4',
        glowPrimary: 'rgba(244, 114, 182, 0.95)',
        glowSecondary: 'rgba(236, 72, 153, 0.75)',
        rowBeamGradient: 'linear-gradient(90deg, transparent 0%, rgba(236, 72, 153, 0.08) 20%, rgba(249, 168, 212, 0.4) 46%, rgba(255, 255, 255, 0.88) 50%, rgba(249, 168, 212, 0.4) 54%, rgba(236, 72, 153, 0.08) 80%, transparent 100%)',
        rowBeamShadow: '0 0 24px 4px rgba(244, 114, 182, 0.45)',
      };
    case 'emerald':
      return {
        leadEdge: '#10b981',
        core: '#ffffff',
        trailEdge: '#6ee7b7',
        glowPrimary: 'rgba(52, 211, 153, 0.95)',
        glowSecondary: 'rgba(16, 185, 129, 0.75)',
        rowBeamGradient: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.08) 20%, rgba(110, 231, 183, 0.4) 46%, rgba(255, 255, 255, 0.88) 50%, rgba(110, 231, 183, 0.4) 54%, rgba(16, 185, 129, 0.08) 80%, transparent 100%)',
        rowBeamShadow: '0 0 24px 4px rgba(52, 211, 153, 0.45)',
      };
    case 'rainbow':
      return {
        leadEdge: '#f43f5e',
        core: '#ffffff',
        trailEdge: '#38bdf8',
        glowPrimary: 'rgba(168, 85, 247, 0.95)',
        glowSecondary: 'rgba(56, 189, 248, 0.8)',
        rowBeamGradient: 'linear-gradient(90deg, transparent 0%, rgba(244, 63, 94, 0.22) 22%, rgba(250, 204, 21, 0.38) 38%, rgba(255, 255, 255, 0.9) 50%, rgba(52, 211, 153, 0.38) 62%, rgba(56, 189, 248, 0.28) 78%, transparent 100%)',
        rowBeamShadow: '0 0 26px 5px rgba(168, 85, 247, 0.5)',
      };
    case 'crystal':
    default:
      return {
        leadEdge: '#38bdf8',
        core: '#ffffff',
        trailEdge: '#bae6fd',
        glowPrimary: 'rgba(186, 230, 253, 0.95)',
        glowSecondary: 'rgba(56, 189, 248, 0.75)',
        rowBeamGradient: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.08) 20%, rgba(186, 230, 253, 0.42) 46%, rgba(255, 255, 255, 0.92) 50%, rgba(186, 230, 253, 0.42) 54%, rgba(56, 189, 248, 0.08) 80%, transparent 100%)',
        rowBeamShadow: '0 0 24px 4px rgba(186, 230, 253, 0.48)',
      };
  }
}

function buildShimmerGradient(color: string, theme: string) {
  const baseColor = (color || '#ffffff').trim();
  const cfg = getShineThemeConfig(theme);

  if (theme === 'rainbow') {
    return `linear-gradient(110deg, ${baseColor} 0%, ${baseColor} 26%, #fb7185 36%, #facc15 43%, #ffffff 48%, #ffffff 52%, #34d399 57%, #38bdf8 64%, ${baseColor} 74%, ${baseColor} 100%)`;
  }

  return `linear-gradient(110deg, ${baseColor} 0%, ${baseColor} 28%, ${cfg.leadEdge} 38%, ${cfg.trailEdge} 44%, ${cfg.core} 48%, ${cfg.core} 52%, ${cfg.trailEdge} 56%, ${cfg.leadEdge} 62%, ${baseColor} 72%, ${baseColor} 100%)`;
}

export default function SupporterWidget({ donors, appearance, mode }: { donors: Supporter[]; appearance: SupporterAppearance; mode: SupporterMode }) {
  const showBg = appearance.supporter_show_bg !== 'false';
  const showDivider = appearance.supporter_show_divider !== 'false';
  const bg = showBg ? `${appearance.supporter_bg_color}${Math.round(Number(appearance.supporter_opacity) * 2.55).toString(16).padStart(2, '0')}` : 'transparent';
  const isShineEnabled = appearance.supporter_shine_sweep !== 'false';
  const shineTheme = appearance.supporter_shine_theme || 'crystal';
  const shineIntensity = appearance.supporter_shine_intensity || 'vivid';
  const isBeamEnabled = appearance.supporter_border_beam !== 'false' && mode !== 'recent';
  const beamTarget = appearance.supporter_beam_target || 'top3';
  const beamTheme = appearance.supporter_beam_theme || 'podium';

  const pauseSec = Math.max(1, Math.min(15, Number(appearance.supporter_shine_delay || '3')));
  const sweepSec = 1.65;
  const totalSec = Number((sweepSec + pauseSec).toFixed(2));
  const pEnd = Number(((sweepSec / totalSec) * 100).toFixed(2));
  const pStartGlow = Number((pEnd * 0.14).toFixed(2));
  const pPeakGlow = Number((pEnd * 0.45).toFixed(2));
  const pFadeGlow = Number((pEnd * 0.82).toFixed(2));

  const themeCfg = getShineThemeConfig(shineTheme);
  const nameShimmerGradient = isShineEnabled ? buildShimmerGradient(appearance.supporter_text_color, shineTheme) : undefined;
  const amountShimmerGradient = isShineEnabled ? buildShimmerGradient(appearance.supporter_amount_color, shineTheme) : undefined;

  const idleFilter = shineIntensity === 'neon'
    ? `drop-shadow(0 0 4px ${themeCfg.glowSecondary})`
    : 'drop-shadow(0 0 0px rgba(255,255,255,0))';

  const peakFilter = shineIntensity === 'standard'
    ? `drop-shadow(0 0 6px ${themeCfg.glowPrimary}) brightness(1.18)`
    : shineIntensity === 'neon'
    ? `drop-shadow(0 0 6px #ffffff) drop-shadow(0 0 14px ${themeCfg.glowPrimary}) drop-shadow(0 0 26px ${themeCfg.glowSecondary}) brightness(1.42)`
    : `drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 11px ${themeCfg.glowPrimary}) drop-shadow(0 0 20px ${themeCfg.glowSecondary}) brightness(1.28)`;

  return (
    <section
      className={`obs-widget supporter-widget supporter-layout-${appearance.supporter_layout} ${!showDivider ? 'supporter-no-divider' : ''} ${isShineEnabled ? `supporter-shine-intensity-${shineIntensity}` : ''}`}
      style={{
        fontFamily: `'${appearance.supporter_font}', sans-serif`,
        width: `${appearance.supporter_width}px`,
        maxWidth: '100%',
        padding: `${appearance.supporter_padding}px`,
        borderRadius: `${appearance.supporter_radius}px`,
        borderWidth: appearance.supporter_show_border === 'true' ? 1 : 0,
        borderColor: appearance.supporter_border_color,
        color: appearance.supporter_text_color,
        background: bg
      }}
    >
      {isShineEnabled && (
        <style>{`
          .supporter-shimmer-text {
            animation-duration: ${totalSec}s !important;
          }
          .supporter-row-shine-beam {
            animation-duration: ${totalSec}s !important;
          }
          @keyframes supporter-text-shine-glide {
            0% {
              background-position: 135% 0;
              filter: ${idleFilter};
            }
            ${pStartGlow}% {
              filter: ${idleFilter};
            }
            ${pPeakGlow}% {
              filter: ${peakFilter};
            }
            ${pFadeGlow}% {
              filter: ${idleFilter};
            }
            ${pEnd}% {
              background-position: -35% 0;
              filter: ${idleFilter};
            }
            100% {
              background-position: -35% 0;
              filter: ${idleFilter};
            }
          }
          @keyframes supporter-row-beam-glide {
            0% {
              transform: translate3d(-140%, 0, 0) skewX(-24deg);
              opacity: 0;
            }
            ${Number((pEnd * 0.1).toFixed(2))}% {
              opacity: 1;
            }
            ${Number((pEnd * 0.85).toFixed(2))}% {
              opacity: 1;
            }
            ${pEnd}% {
              transform: translate3d(520%, 0, 0) skewX(-24deg);
              opacity: 0;
            }
            100% {
              transform: translate3d(520%, 0, 0) skewX(-24deg);
              opacity: 0;
            }
          }
        `}</style>
      )}
      {appearance.supporter_show_title === 'true' && (
        <h1
          style={{
            fontSize: `${appearance.supporter_title_size}px`,
            textAlign: (appearance.supporter_title_align as any) || 'center'
          }}
        >
          {appearance.supporter_title.trim() || supporterModes[mode]}
        </h1>
      )}

      {donors.length ? (
        <ol className="supporter-rows" style={{ gap: `${appearance.supporter_row_gap}px` }}>
          {donors.slice(0, Number(appearance.supporter_limit)).map((donor, index) => {
            const hasBeam = isBeamEnabled && (beamTarget === 'top1' ? index === 0 : index < 3);

            let beamClass = '';
            if (hasBeam) {
              if (beamTheme === 'gold') {
                beamClass = 'supporter-beam-row supporter-beam-gold';
              } else if (beamTheme === 'cyan') {
                beamClass = 'supporter-beam-row supporter-beam-cyan';
              } else if (beamTheme === 'rainbow') {
                beamClass = 'supporter-beam-row supporter-beam-rainbow';
              } else {
                beamClass = `supporter-beam-row supporter-beam-rank-${index + 1}`;
              }
            }

            const rowBg = appearance.supporter_layout === 'cards'
              ? appearance.supporter_row_color
              : (hasBeam ? (appearance.supporter_row_color || '#1e293b') : 'transparent');

            const rowShineDelay = `${(index * 0.28).toFixed(2)}s`;
            const amountShineDelay = `${(index * 0.28 + 0.18).toFixed(2)}s`;

            return (
              <li
                key={`${index}-${donor.name}`}
                className={`${beamClass} ${isShineEnabled ? `supporter-shine-row supporter-shine-theme-${shineTheme}` : ''}`}
                style={{
                  background: hasBeam ? undefined : rowBg,
                  borderColor: appearance.supporter_border_color,
                  borderBottomWidth: showDivider ? undefined : 0,
                  borderBottomColor: showDivider ? undefined : 'transparent',
                  ['--row-bg' as any]: rowBg,
                }}
              >
                {isShineEnabled && (
                  <span
                    className="supporter-row-shine-beam"
                    aria-hidden="true"
                    style={{
                      ['--row-shine-delay' as any]: rowShineDelay,
                      ['--shine-beam-bg' as any]: themeCfg.rowBeamGradient,
                      ['--shine-beam-shadow' as any]: themeCfg.rowBeamShadow,
                    }}
                  />
                )}
                {mode !== 'recent' && appearance.supporter_show_rank === 'true' && (
                  <span
                    className="supporter-rank"
                    style={{
                      color: hasBeam ? '#ffffff' : appearance.supporter_rank_color,
                      background: hasBeam
                        ? (index === 0
                            ? 'linear-gradient(135deg, #f59e0b, #b45309)'
                            : index === 1
                            ? 'linear-gradient(135deg, #94a3b8, #475569)'
                            : 'linear-gradient(135deg, #d97706, #78350f)')
                        : (appearance.supporter_show_rank_bg === 'false' ? 'transparent' : (appearance.supporter_rank_bg_color || '#334155')),
                      boxShadow: hasBeam ? '0 2px 6px rgba(0,0,0,0.3)' : undefined,
                    }}
                  >
                    {index + 1}
                  </span>
                )}
                <span className="supporter-name" style={{ fontSize: `${appearance.supporter_name_size}px` }}>
                  <span
                    className={isShineEnabled ? 'supporter-shimmer-text' : undefined}
                    style={isShineEnabled ? {
                      backgroundImage: nameShimmerGradient,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      ['--text-color' as any]: appearance.supporter_text_color,
                      ['--text-shine-delay' as any]: rowShineDelay,
                    } : undefined}
                  >
                    {donor.name}
                  </span>
                </span>
                {appearance.supporter_show_amount === 'true' && (
                  <strong style={{ color: appearance.supporter_amount_color, fontSize: `${appearance.supporter_amount_size}px` }}>
                    <span
                      className={isShineEnabled ? 'supporter-shimmer-text' : undefined}
                      style={isShineEnabled ? {
                        backgroundImage: amountShimmerGradient,
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        ['--text-color' as any]: appearance.supporter_amount_color,
                        ['--text-shine-delay' as any]: amountShineDelay,
                      } : undefined}
                    >
                      ฿{donor.amount.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                    </span>
                  </strong>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p>ยังไม่มีผู้สนับสนุนในช่วงนี้</p>
      )}
    </section>
  );
}
