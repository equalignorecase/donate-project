/**
 * Synthesizes a triumphant victory brass fanfare using Web Audio API.
 * Zero external audio files required, instant latency-free playback.
 */
export function playGoalFanfare(volume = 0.5): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Arpeggio notes: C4, E4, G4, C5, then long final chord (C5, E5, G5)
    const now = ctx.currentTime;
    const arpeggio = [
      { note: 261.63, start: now + 0.0, dur: 0.14 }, // C4
      { note: 329.63, start: now + 0.15, dur: 0.14 }, // E4
      { note: 392.00, start: now + 0.30, dur: 0.16 }, // G4
      { note: 523.25, start: now + 0.48, dur: 0.22 }, // C5
    ];

    arpeggio.forEach(({ note, start, dur }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, start);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, start);

      noteGain.gain.setValueAtTime(0, start);
      noteGain.gain.linearRampToValueAtTime(0.4, start + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(start);
      osc.stop(start + dur);
    });

    // Final Grand Chord: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const chordStart = now + 0.72;
    const chordDur = 1.6;
    const chordNotes = [523.25, 659.25, 783.99, 1046.50];

    chordNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = idx === 3 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, chordStart);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, chordStart);

      noteGain.gain.setValueAtTime(0, chordStart);
      noteGain.gain.linearRampToValueAtTime(0.35 / (idx + 1), chordStart + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, chordStart + chordDur);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(chordStart);
      osc.stop(chordStart + chordDur);
    });

    // Clean up audio context
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, (chordStart + chordDur + 0.5) * 1000);
  } catch (err) {
    console.warn('Could not play goal fanfare audio:', err);
  }
}

