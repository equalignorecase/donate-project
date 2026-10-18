const fs = require('fs');
const path = require('path');

function createWavBuffer(sampleRate, samples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.floor(val), offset);
    offset += 2;
  }

  return buffer;
}

const sampleRate = 44100;

// 1. Coin Sound (Retro 8-bit Coin: B5 -> E6 jump)
function generateCoin() {
  const duration = 0.45;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);
  const split = Math.floor(totalSamples * 0.22);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const freq = i < split ? 987.77 : 1318.51; // B5 -> E6
    const decay = Math.exp(-t * 6.5);
    // Square + subtle harmonics for crisp 8-bit feel
    const wave = Math.sin(2 * Math.PI * freq * t) > 0 ? 0.35 : -0.35;
    samples[i] = wave * decay;
  }
  return samples;
}

// 2. Chime Sound (Soft Glass Chime: Pentatonic harmonics)
function generateChime() {
  const duration = 1.2;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);
  const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let val = 0;
    for (let f = 0; f < freqs.length; f++) {
      const delay = f * 0.08;
      if (t >= delay) {
        const dt = t - delay;
        const env = Math.exp(-dt * 4.5);
        val += Math.sin(2 * Math.PI * freqs[f] * dt) * env * 0.22;
      }
    }
    samples[i] = val;
  }
  return samples;
}

// 3. Level Up Sound (Fantasy Arpeggio Fanfare)
function generateLevelUp() {
  const duration = 1.0;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);
  const notes = [
    { f: 523.25, start: 0.00, end: 0.12 }, // C5
    { f: 659.25, start: 0.10, end: 0.24 }, // E5
    { f: 783.99, start: 0.22, end: 0.38 }, // G5
    { f: 1046.50, start: 0.36, end: 1.00 } // C6 (sustained finish)
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let val = 0;
    for (const n of notes) {
      if (t >= n.start && t <= n.end) {
        const dt = t - n.start;
        const dur = n.end - n.start;
        const env = Math.sin((dt / dur) * Math.PI * 0.5) * Math.exp(-dt * (n.f === 1046.5 ? 2.5 : 5.0));
        // Warm synth wave
        const s = Math.sin(2 * Math.PI * n.f * dt) + 0.3 * Math.sin(4 * Math.PI * n.f * dt);
        val += s * env * 0.3;
      }
    }
    samples[i] = val;
  }
  return samples;
}

// 4. Arcade Pop Sound (Bouncy chirp)
function generateArcade() {
  const duration = 0.5;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const freq = 450 + 950 * Math.sin(t * 12);
    const decay = Math.exp(-t * 7.5);
    const wave = Math.sin(2 * Math.PI * freq * t);
    samples[i] = wave * decay * 0.4;
  }
  return samples;
}

const outDir = path.join(process.cwd(), 'public', 'sounds');

const sounds = [
  { name: 'coin.wav', data: generateCoin() },
  { name: 'chime.wav', data: generateChime() },
  { name: 'level-up.wav', data: generateLevelUp() },
  { name: 'arcade.wav', data: generateArcade() }
];

for (const s of sounds) {
  const buf = createWavBuffer(sampleRate, s.data);
  const filePath = path.join(outDir, s.name);
  fs.writeFileSync(filePath, buf);
  console.log(`Generated ${s.name} (${buf.length} bytes)`);
}
