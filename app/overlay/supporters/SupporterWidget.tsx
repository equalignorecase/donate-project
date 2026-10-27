import { Supporter } from '@/lib/widgets';
import { SupporterAppearance, SupporterMode, supporterModes } from '@/lib/supporterAppearance';
import '../widgets.css';

function buildShimmerGradient(color: string, theme: string) {
  const c = (color || '#ffffff').trim();
  let specularCore = '#ffffff';
  let beamAura = 'rgba(255, 255, 255, 0.9)';

  if (theme === 'gold') {
    specularCore = '#ffffff';
    beamAura = 'rgba(254, 240, 138, 0.95)';
  } else if (theme === 'cyan') {
    specularCore = '#ffffff';
    beamAura = 'rgba(103, 232, 249, 0.95)';
  }

  let baseColor = c;
  if (c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#fff') {
    baseColor = 'rgba(255, 255, 255, 0.52)';
  } else if (c.startsWith('#') && c.length === 7) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    baseColor = `rgba(${r}, ${g}, ${b}, 0.58)`;
  }

  return `linear-gradient(115deg, ${baseColor} 0%, ${baseColor} 30%, ${beamAura} 43%, ${specularCore} 49%, ${specularCore} 51%, ${beamAura} 57%, ${baseColor} 70%, ${baseColor} 100%)`;
}

export default function SupporterWidget({ donors, appearance, mode }: { donors: Supporter[]; appearance: SupporterAppearance; mode: SupporterMode }) {
  const showBg = appearance.supporter_show_bg !== 'false';
  const showDivider = appearance.supporter_show_divider !== 'false';
  const bg = showBg ? `${appearance.supporter_bg_color}${Math.round(Number(appearance.supporter_opacity) * 2.55).toString(16).padStart(2, '0')}` : 'transparent';
  const isShineEnabled = appearance.supporter_shine_sweep !== 'false';
  const shineTheme = appearance.supporter_shine_theme || 'crystal';
  const isBeamEnabled = appearance.supporter_border_beam !== 'false' && mode !== 'recent';
  const beamTarget = appearance.supporter_beam_target || 'top3';
  const beamTheme = appearance.supporter_beam_theme || 'podium';

  const pauseSec = Math.max(1, Math.min(15, Number(appearance.supporter_shine_delay || '3')));
  const sweepSec = 1.3;
  const totalSec = sweepSec + pauseSec;
  const pEnd = Number(((sweepSec / totalSec) * 100).toFixed(2));

  const nameShimmerGradient = isShineEnabled ? buildShimmerGradient(appearance.supporter_text_color, shineTheme) : undefined;
  const amountShimmerGradient = isShineEnabled ? buildShimmerGradient(appearance.supporter_amount_color, shineTheme) : undefined;

  return (
    <section
      className={`obs-widget supporter-widget supporter-layout-${appearance.supporter_layout} ${!showDivider ? 'supporter-no-divider' : ''}`}
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
          @keyframes supporter-text-shine-glide {
            0% {
              background-position: 135% 0;
            }
            ${pEnd}% {
              background-position: -35% 0;
            }
            100% {
              background-position: -35% 0;
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
                // 'podium': rank 1 gold, rank 2 silver, rank 3 bronze
                beamClass = `supporter-beam-row supporter-beam-rank-${index + 1}`;
              }
            }

            const rowBg = appearance.supporter_layout === 'cards'
              ? appearance.supporter_row_color
              : (hasBeam ? (appearance.supporter_row_color || '#1e293b') : 'transparent');

            const rowShineDelay = `${index * 0.32}s`;
            const amountShineDelay = `${index * 0.32 + 0.22}s`;

            return (
              <li
                key={`${index}-${donor.name}`}
                className={`${beamClass} ${isShineEnabled ? `supporter-shine-theme-${shineTheme}` : ''}`}
                style={{
                  background: hasBeam ? undefined : rowBg,
                  borderColor: appearance.supporter_border_color,
                  borderBottomWidth: showDivider ? undefined : 0,
                  borderBottomColor: showDivider ? undefined : 'transparent',
                  ['--row-bg' as any]: rowBg,
                }}
              >
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

