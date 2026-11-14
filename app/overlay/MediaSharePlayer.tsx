'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Donation } from '@/lib/types/database';
import { buildYouTubeEmbedPlayerUrl, ParsedYouTubeUrl } from '@/lib/media-share';

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId?: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number }) => void;
            onAutoplayBlocked?: (event: { target: YTPlayerInstance }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  destroy?: () => void;
  playVideo?: () => void;
  setVolume?: (volume: number) => void;
  unMute?: () => void;
  mute?: () => void;
  getPlayerState?: () => number;
  getIframe?: () => HTMLIFrameElement;
}

const YT_STATE_ENDED = 0;
const YT_STATE_PLAYING = 1;
const YT_STATE_BUFFERING = 3;

let ytApiLoadPromise: Promise<void> | null = null;

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.YT && typeof window.YT.Player === 'function') {
    return Promise.resolve();
  }
  if (ytApiLoadPromise) return ytApiLoadPromise;

  ytApiLoadPromise = new Promise<void>((resolve, reject) => {
    const existingPrev = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => {
      ytApiLoadPromise = null;
      reject(new Error('YouTube IFrame API load timeout'));
    }, 5000);

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      if (typeof existingPrev === 'function') {
        try {
          existingPrev();
        } catch {}
      }
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        ytApiLoadPromise = null;
        reject(new Error('Failed to load YouTube IFrame API'));
      };
      document.head.appendChild(script);
    }
  });

  return ytApiLoadPromise;
}

export interface ActiveMediaItem {
  id: string;
  donation: Donation;
  parsed: ParsedYouTubeUrl;
  maxDuration: number;
  volume: number;
}

interface MediaSharePlayerProps {
  media: ActiveMediaItem;
  onEnded: () => void;
}

export default function MediaSharePlayer({ media, onEnded }: MediaSharePlayerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const finishedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const [remaining, setRemaining] = useState<number>(media.maxDuration);
  const [isMutedFallback, setIsMutedFallback] = useState<boolean>(media.volume <= 0);
  const [needsManualPlay, setNeedsManualPlay] = useState<boolean>(false);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  const handleUnmute = useCallback(() => {
    const player = playerRef.current;
    if (!player || media.volume <= 0) return;
    try {
      player.unMute?.();
      player.setVolume?.(media.volume);
      player.playVideo?.();
      setIsMutedFallback(false);
      setNeedsManualPlay(false);
    } catch {}
  }, [media.volume]);

  // If browser forced muted autoplay, any gesture on the overlay immediately restores sound
  useEffect(() => {
    if (!isMutedFallback || media.volume <= 0) return;
    const onGesture = () => handleUnmute();
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [isMutedFallback, media.volume, handleUnmute]);

  useEffect(() => {
    finishedRef.current = false;
    setRemaining(media.maxDuration);
    setIsMutedFallback(media.volume <= 0);
    setNeedsManualPlay(false);

    let cancelled = false;
    let countdownInterval: number | null = null;
    let manualHintTimeout: number | null = null;
    let stallTimeout: number | null = null;
    let countdownStarted = false;
    let playingMuted = media.volume <= 0;

    const clearFallbackTimers = () => {
      if (manualHintTimeout !== null) {
        window.clearTimeout(manualHintTimeout);
        manualHintTimeout = null;
      }
    };

    const clearAllTimers = () => {
      clearFallbackTimers();
      if (countdownInterval !== null) {
        window.clearInterval(countdownInterval);
        countdownInterval = null;
      }
      if (stallTimeout !== null) {
        window.clearTimeout(stallTimeout);
        stallTimeout = null;
      }
    };

    const finishOnce = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      clearAllTimers();
      onEndedRef.current();
    };

    const startCountdownOnce = () => {
      if (cancelled || countdownStarted) return;
      countdownStarted = true;
      clearFallbackTimers();
      setNeedsManualPlay(false);
      if (stallTimeout !== null) {
        window.clearTimeout(stallTimeout);
        stallTimeout = null;
      }

      countdownInterval = window.setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            finishOnce();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const destroyCurrentPlayer = () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy?.();
        } catch {}
        playerRef.current = null;
      }
      if (hostRef.current) {
        hostRef.current.innerHTML = '';
      }
    };

    const mountDirectIframeFallback = () => {
      if (cancelled || !hostRef.current) return;
      clearFallbackTimers();
      destroyCurrentPlayer();
      setIsMutedFallback(media.volume <= 0);

      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.src = buildYouTubeEmbedPlayerUrl({
        videoId: media.parsed.videoId,
        startSeconds: media.parsed.startSeconds,
        origin: window.location.origin,
        muted: media.volume <= 0,
      });

      hostRef.current.appendChild(iframe);
      startCountdownOnce();
    };

    const mountPlayer = (muted: boolean) => {
      if (cancelled || !hostRef.current || !window.YT?.Player) return;
      clearFallbackTimers();
      destroyCurrentPlayer();

      const slot = document.createElement('div');
      slot.style.width = '100%';
      slot.style.height = '100%';
      hostRef.current.appendChild(slot);

      playerRef.current = new window.YT.Player(slot, {
        videoId: media.parsed.videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: muted ? 1 : 0,
          enablejsapi: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          ...(media.parsed.startSeconds > 0 ? { start: media.parsed.startSeconds } : {}),
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            try {
              const iframe = event.target.getIframe?.();
              if (iframe) {
                iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
              }

              if (muted) {
                setIsMutedFallback(true);
                event.target.mute?.();
                event.target.playVideo?.();
                if (event.target.getPlayerState?.() === YT_STATE_PLAYING) {
                  startCountdownOnce();
                  return;
                }

                manualHintTimeout = window.setTimeout(() => {
                  if (cancelled || countdownStarted) return;
                  const state = event.target.getPlayerState?.();
                  if (state !== YT_STATE_PLAYING && state !== YT_STATE_BUFFERING) {
                    setNeedsManualPlay(true);
                  }
                }, 1500);
              } else {
                event.target.unMute?.();
                event.target.setVolume?.(media.volume);
                event.target.playVideo?.();
              }
            } catch {}
          },
          onAutoplayBlocked: (event) => {
            if (cancelled) return;
            if (playingMuted) {
              setNeedsManualPlay(true);
              return;
            }
            // Retry on the same iframe: rebuilding it interrupts buffering and loses its permissions.
            playingMuted = true;
            setIsMutedFallback(true);
            event.target.mute?.();
            event.target.playVideo?.();
          },
          onStateChange: (event) => {
            if (cancelled) return;
            if (event.data === YT_STATE_PLAYING) {
              startCountdownOnce();
            } else if (event.data === YT_STATE_ENDED) {
              finishOnce();
            }
          },
          onError: () => {
            finishOnce();
          },
        },
      });

      // Set allow synchronously right after YT.Player creates the iframe in DOM
      try {
        const createdIframe = playerRef.current.getIframe?.();
        if (createdIframe) {
          createdIframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
        }
      } catch {}
    };

    // Guard so an unplayable/blocked embed never stalls the alert queue forever
    stallTimeout = window.setTimeout(() => {
      finishOnce();
    }, 15000);

    loadYouTubeIframeApi()
      .then(() => {
        if (cancelled || !hostRef.current || !window.YT?.Player) return;
        mountPlayer(media.volume <= 0);
      })
      .catch(() => {
        // Fallback when content blocker / Orion shield blocks youtube.com/iframe_api
        mountDirectIframeFallback();
      });

    return () => {
      cancelled = true;
      clearAllTimers();
      destroyCurrentPlayer();
    };
  }, [media]);

  const progressPct = Math.max(0, Math.min(100, (remaining / Math.max(1, media.maxDuration)) * 100));
  const formattedAmount = Number(media.donation.amount || 0).toLocaleString('th-TH', {
    maximumFractionDigits: 2,
  });

  return (
    <div
      style={{
        width: 'min(560px, 88vw)',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        boxShadow: '0 24px 55px rgba(0, 0, 0, 0.45)',
        fontFamily: 'var(--alert-font, sans-serif)',
        color: '#ffffff',
        animation: 'fadeIn 0.35s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '10px 14px',
          background: 'rgba(30, 41, 59, 0.92)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 8px',
              borderRadius: '999px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            YouTube
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {media.donation.name || 'ผู้สนับสนุน'} · ฿{formattedAmount}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isMutedFallback && media.volume > 0 && (
            <button
              type="button"
              onClick={handleUnmute}
              title="Browser ปิดเสียง Autoplay ชั่วคราว — คลิกเพื่อเปิดเสียง"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                borderRadius: '999px',
                border: '1px solid rgba(251, 191, 36, 0.45)',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fde68a',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <VolumeX size={13} />
              <span>คลิกเปิดเสียง</span>
            </button>
          )}
          {!isMutedFallback && media.volume > 0 && (
            <span
              title="กำลังเล่นเสียงปกติ"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: 'rgba(148, 163, 184, 0.9)',
              }}
            >
              <Volume2 size={14} />
            </span>
          )}
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              padding: '2px 9px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              flexShrink: 0,
            }}
          >
            {remaining}s
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          background: '#000000',
        }}
      >
        <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
        {needsManualPlay && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '12px',
              transform: 'translateX(-50%)',
              padding: '6px 12px',
              borderRadius: '999px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              color: '#f8fafc',
              fontSize: '12px',
              fontWeight: 600,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Orion/Browser ปิด Auto-Play อยู่ — กด Play หรือเปิดสิทธิ์ Auto-Play ของ localhost
          </div>
        )}
      </div>

      <div style={{ height: '4px', width: '100%', background: 'rgba(255, 255, 255, 0.12)' }}>
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, #38bdf8, #a855f7)',
            transition: 'width 0.9s linear',
          }}
        />
      </div>
    </div>
  );
}
