'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Donation, AlertSettings } from '@/lib/types/database';
import { amountToThaiWords } from '@/lib/thaiNumber';
import { prepareTtsText } from '@/lib/tts-helper';

function playSynthesizedChime(volumePercent: number) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime((volumePercent / 100) * 0.4, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + index * 0.08;
      const duration = 0.6;

      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(0.8, startTime + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (e) {
    console.warn('Audio synthesis warning:', e);
  }
}

export function useAlertQueue(settings: AlertSettings) {
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [alertAnimState, setAlertAnimState] = useState<string>('');
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);

  const queueRef = useRef<Donation[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const isQueuePausedRef = useRef<boolean>(false);
  const settingsRef = useRef<AlertSettings>(settings);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTtsTextRef = useRef<string>('');
  const alertStartTimeRef = useRef<number>(0);
  const alertDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTtsSpeakingRef = useRef<boolean>(false);
  const processedAlertIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const unlockAudio = useCallback(() => {
    setAudioUnlocked(true);
    try {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current
          .play()
          .then(() => {
            audioRef.current?.pause();
            if (audioRef.current) audioRef.current.currentTime = 0;
          })
          .catch(() => {});
      }
      if (ttsAudioRef.current && ttsAudioRef.current.paused && ttsAudioRef.current.src) {
        ttsAudioRef.current
          .play()
          .then(() => {
            ttsAudioRef.current?.pause();
            if (ttsAudioRef.current) ttsAudioRef.current.currentTime = 0;
          })
          .catch(() => {});
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
    } catch {}
  }, []);

  const playAlertSound = useCallback(() => {
    const s = settingsRef.current;
    const vol = parseFloat(String(s.alert_volume ?? 80));
    const soundUrl = (s.alert_sound_url || '/sounds/alert.mp3').trim();
    if (audioRef.current) {
      if (audioRef.current.src !== soundUrl && !audioRef.current.src.endsWith(soundUrl)) {
        audioRef.current.src = soundUrl;
      }
      audioRef.current.volume = Math.min(Math.max(vol / 100, 0), 1);
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        playSynthesizedChime(vol);
      });
    } else {
      playSynthesizedChime(vol);
    }
  }, []);

  const processQueueRef = useRef<() => void>(() => {});

  const dismissAlert = useCallback(() => {
    if (alertDismissTimeoutRef.current) {
      clearTimeout(alertDismissTimeoutRef.current);
      alertDismissTimeoutRef.current = null;
    }
    if (ttsTimeoutRef.current) {
      clearTimeout(ttsTimeoutRef.current);
      ttsTimeoutRef.current = null;
    }
    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.currentTime = 0;
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    isTtsSpeakingRef.current = false;

    setAlertAnimState('hide');
    setTimeout(() => {
      setAlertAnimState('');
      setCurrentAlert(null);
      isPlayingRef.current = false;
      processQueueRef.current();
    }, 580);
  }, []);

  const scheduleAlertDismiss = useCallback(
    (delayMs: number) => {
      if (alertDismissTimeoutRef.current) {
        clearTimeout(alertDismissTimeoutRef.current);
      }
      alertDismissTimeoutRef.current = setTimeout(() => {
        dismissAlert();
      }, Math.max(delayMs, 0));
    },
    [dismissAlert]
  );

  const onTtsEnded = useCallback(() => {
    if (!isPlayingRef.current) return;
    isTtsSpeakingRef.current = false;
    const minDurationMs = Math.max(3, parseFloat(String(settingsRef.current.alert_duration || 8))) * 1000;
    const elapsed = Date.now() - alertStartTimeRef.current;
    const remainingTime = Math.max(1500, minDurationMs - elapsed);
    scheduleAlertDismiss(remainingTime);
  }, [scheduleAlertDismiss]);

  const fallbackWebSpeech = useCallback(
    (textToSpeak: string, volume: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !textToSpeak) {
        onTtsEnded();
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'th-TH';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = volume;

        const voices = window.speechSynthesis.getVoices();
        const thaiVoice = voices.find(v => v.lang.startsWith('th'));
        if (thaiVoice) utterance.voice = thaiVoice;

        utterance.onend = () => onTtsEnded();
        utterance.onerror = () => onTtsEnded();

        window.speechSynthesis.speak(utterance);
      } catch {
        onTtsEnded();
      }
    },
    [onTtsEnded]
  );

  const speakDonation = useCallback(
    (item: Donation): boolean => {
      const s = settingsRef.current;
      if (s.tts_enabled !== 'true' && s.tts_enabled !== true) return false;

      const minAmt = parseFloat(String(s.tts_min_amount || 0));
      const itemAmt = parseFloat(String(item.amount || 0));
      if (itemAmt < minAmt) return false;

      const donorName = item.name?.trim() || 'Anonymous';
      const actionText = (s.alert_action_text || 'โดเนทให้').trim();
      const thaiAmount = amountToThaiWords(itemAmt);
      let textToSpeak = `${donorName} ${actionText} ${thaiAmount}`;
      if (item.message && item.message.trim() !== '') {
        textToSpeak += ` ${item.message.trim()}`;
      }
      textToSpeak = prepareTtsText(textToSpeak);
      currentTtsTextRef.current = textToSpeak;

      const volume = Math.min(Math.max(parseFloat(String(s.alert_volume ?? 80)) / 100, 0), 1);

      if (ttsTimeoutRef.current) {
        clearTimeout(ttsTimeoutRef.current);
      }

      const url = `/api/tts?text=${encodeURIComponent(textToSpeak)}`;

      if (ttsAudioRef.current) {
        ttsAudioRef.current.src = url;
        ttsAudioRef.current.volume = volume;
        ttsAudioRef.current.load();
      }

      ttsTimeoutRef.current = setTimeout(() => {
        if (ttsAudioRef.current) {
          const playPromise = ttsAudioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              fallbackWebSpeech(textToSpeak, volume);
            });
          }
        } else {
          fallbackWebSpeech(textToSpeak, volume);
        }
      }, 1200);

      return true;
    },
    [fallbackWebSpeech]
  );

  const processQueue = useCallback(() => {
    if (isQueuePausedRef.current || isPlayingRef.current || queueRef.current.length === 0) return;

    isPlayingRef.current = true;
    alertStartTimeRef.current = Date.now();
    const item = queueRef.current.shift()!;
    setCurrentAlert(item);

    playAlertSound();
    const willSpeak = speakDonation(item);

    setAlertAnimState('show');

    const minDurationMs = Math.max(3, parseFloat(String(settingsRef.current.alert_duration || 8))) * 1000;

    if (!willSpeak) {
      scheduleAlertDismiss(minDurationMs);
    } else {
      isTtsSpeakingRef.current = true;
      scheduleAlertDismiss(Math.max(minDurationMs, 35000));
    }
  }, [playAlertSound, speakDonation, scheduleAlertDismiss]);

  useEffect(() => {
    processQueueRef.current = processQueue;
  }, [processQueue]);

  const enqueueDonation = useCallback(
    (data: Donation) => {
      if (!data) return;
      const id = String(data.id || `alert-${data.name}-${data.amount}-${Date.now()}`);
      if (processedAlertIds.current.has(id)) {
        return;
      }
      processedAlertIds.current.add(id);
      if (processedAlertIds.current.size > 200) {
        const first = processedAlertIds.current.values().next().value;
        if (first) processedAlertIds.current.delete(first);
      }

      queueRef.current.push({ ...data, id });
      processQueue();
    },
    [processQueue]
  );

  const setQueuePaused = useCallback(
    (paused: boolean) => {
      isQueuePausedRef.current = paused;
      if (!paused) {
        processQueue();
      }
    },
    [processQueue]
  );

  const handleTtsAudioError = useCallback(() => {
    const vol = Math.min(Math.max(parseFloat(String(settingsRef.current.alert_volume ?? 80)) / 100, 0), 1);
    fallbackWebSpeech(currentTtsTextRef.current, vol);
  }, [fallbackWebSpeech]);

  useEffect(() => {
    return () => {
      if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);
      if (alertDismissTimeoutRef.current) clearTimeout(alertDismissTimeoutRef.current);
    };
  }, []);

  return {
    currentAlert,
    alertAnimState,
    audioUnlocked,
    audioRef,
    ttsAudioRef,
    unlockAudio,
    enqueueDonation,
    dismissAlert,
    setQueuePaused,
    onTtsEnded,
    handleTtsAudioError
  };
}

