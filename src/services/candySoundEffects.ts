// Web Audio API Synthesizer for Candy Crush Saga Engine
// High-fidelity, crisp, tactile sounds without any external asset dependencies

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** 1. Crisp Candy Swap Swoosh */
export function playCandySwapSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(360, now + 0.08);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.1);
}

/** 2. Candy Pop / Match with Ascending Pentatonic Musical Scale */
export function playCandyPop(combo: number = 1): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Pentatonic scale (C4, D4, E4, G4, A4, C5, D5, E5, G5, A5)
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
  const freqIndex = Math.min(Math.max(0, combo - 1), scale.length - 1);
  const baseFreq = scale[freqIndex];

  // Chime harmonic
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(baseFreq, now);
  osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.05, now + 0.12);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(baseFreq * 2, now); // 1 octave overtone for glass sparkle

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.18);
  osc2.stop(now + 0.18);
}

/** 3. Striped Candy Laser Beam Sound */
export function playLaserBeamSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.28);
}

/** 4. Wrapped Candy Explosive Blast */
export function playExplosionSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Sub-bass thump
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(120, now);
  subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

  subGain.gain.setValueAtTime(0.35, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

  subOsc.connect(subGain);
  subGain.connect(ctx.destination);

  subOsc.start(now);
  subOsc.stop(now + 0.38);

  // Noise crunch burst
  try {
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  } catch (e) {}
}

/** 5. Color Bomb Rainbow Zap */
export function playColorBombSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.5];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.04;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, start + 0.2);

    gain.gain.setValueAtTime(0.16, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.25);
  });
}

/** 6. Star Chime on Level Cleared */
export function playStarChime(starIdx: number = 1): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const freqs = [523.25, 659.25, 1046.5]; // C5, E5, C6
  const freq = freqs[Math.min(starIdx - 1, freqs.length - 1)];

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + 0.3);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.35);
}

/** 7. Lollipop Hammer Smash */
export function playHammerSmashSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}

/** 8. Victory Fanfare */
export function playVictoryFanfare(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const melody = [
    { freq: 523.25, time: 0.0, dur: 0.15 }, // C5
    { freq: 659.25, time: 0.15, dur: 0.15 }, // E5
    { freq: 783.99, time: 0.3, dur: 0.15 }, // G5
    { freq: 1046.5, time: 0.45, dur: 0.45 }, // C6
  ];

  melody.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + note.time;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, start);

    gain.gain.setValueAtTime(0.22, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + note.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + note.dur);
  });
}

/** 9. Announcer voice */
export function playAnnouncerVoice(voice: 'sweet' | 'tasty' | 'delicious' | 'divine' | 'sugar_crush'): void {
  if (typeof window === 'undefined') return;

  const ctx = getAudioContext();
  if (ctx) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textMap: Record<string, string> = {
        sweet: 'Sweet!',
        tasty: 'Tasty!',
        delicious: 'Delicious!',
        divine: 'Divine!',
        sugar_crush: 'Sugar Crush!',
      };
      const utter = new SpeechSynthesisUtterance(textMap[voice] || voice);
      utter.rate = 1.05;
      utter.pitch = 1.25;
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    }
  } catch (e) {}
}

export function playCountdownBeep(isFinal: boolean = false): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const freq = isFinal ? 880 : 440;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.3 : 0.12));
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + (isFinal ? 0.3 : 0.12));
}

export function playItemRevealSound(): void {
  playColorBombSound();
}
export function playAttackHitSound(): void {
  playLaserBeamSound();
}
export function playHealSound(): void {
  playStarChime(2);
}
export function playShieldSound(): void {
  playColorBombSound();
}
export function playFirestormSound(): void {
  playExplosionSound();
}
