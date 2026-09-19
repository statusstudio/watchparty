export interface SoundItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const SOUNDBOARD_ITEMS: SoundItem[] = [
  { id: 'airhorn', name: 'แตรแดนซ์ (Airhorn)', icon: '📢', color: '#f59e0b' },
  { id: 'applause', name: 'เสียงปรบมือ (Applause)', icon: '👏', color: '#10b981' },
  { id: 'badumtss', name: 'ตึ่งโป๊ะ (Ba-Dum-Tss)', icon: '🥁', color: '#ec4899' },
  { id: 'wow', name: 'ว้าววว (Wow Chime)', icon: '✨', color: '#8b5cf6' },
  { id: 'ding', name: 'กระดิ่งทอง (Ding)', icon: '🔔', color: '#38bdf8' },
  { id: 'cricket', name: 'จิ้งหรีดกริบ (Cricket)', icon: '🦗', color: '#84cc16' },
  { id: 'siren', name: 'หวอไซเรน (Siren)', icon: '🚨', color: '#ef4444' },
  { id: 'laser', name: 'เลเซอร์ไซไฟ (Pew Pew)', icon: '⚡', color: '#06b6d4' },
];

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public play(soundId: string) {
    try {
      const ctx = this.getContext();
      switch (soundId) {
        case 'airhorn':
          this.playAirhorn(ctx);
          break;
        case 'applause':
          this.playApplause(ctx);
          break;
        case 'badumtss':
          this.playBaDumTss(ctx);
          break;
        case 'wow':
          this.playWow(ctx);
          break;
        case 'ding':
          this.playDing(ctx);
          break;
        case 'cricket':
          this.playCricket(ctx);
          break;
        case 'siren':
          this.playSiren(ctx);
          break;
        case 'laser':
          this.playLaser(ctx);
          break;
        default:
          this.playDing(ctx);
          break;
      }
    } catch (err) {
      console.warn('Error playing sound effect:', err);
    }
  }

  // 1. Iconic Airhorn (two short bursts + one long blast)
  private playAirhorn(ctx: AudioContext) {
    const playBlast = (startTime: number, duration: number) => {
      const freqs = [185, 233, 277, 370]; // Airhorn chord frequencies (F# minor-ish)
      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, startTime);
        osc.frequency.linearRampToValueAtTime(f * 1.02, startTime + duration);

        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    };

    const now = ctx.currentTime;
    playBlast(now, 0.12);
    playBlast(now + 0.16, 0.12);
    playBlast(now + 0.32, 0.38);
  }

  // 2. Applause / Cheering (Filtered pink noise cluster)
  private playApplause(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 1.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
  }

  // 3. Ba-dum-tss (Kick + Snare + Hi-Hat cymbal crash)
  private playBaDumTss(ctx: AudioContext) {
    const now = ctx.currentTime;

    // Drum 1: Ba
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Drum 2: Dum
    const t2 = now + 0.16;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.setValueAtTime(180, t2);
    osc2.frequency.exponentialRampToValueAtTime(55, t2 + 0.14);
    gain2.gain.setValueAtTime(0.4, t2);
    gain2.gain.exponentialRampToValueAtTime(0.01, t2 + 0.14);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.14);

    // Cymbal: Tsss!
    const t3 = now + 0.34;
    const bufferSize = ctx.sampleRate * 0.7;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0.35, t3);
    gain3.gain.exponentialRampToValueAtTime(0.001, t3 + 0.7);
    noise.connect(filter);
    filter.connect(gain3);
    gain3.connect(ctx.destination);
    noise.start(t3);
  }

  // 4. Wow Chime (Sparkly melodic sweep)
  private playWow(ctx: AudioContext) {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  // 5. Ding (Bright notification chime)
  private playDing(ctx: AudioContext) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now); // A6
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  // 6. Cricket (Awkward silence chirp chirps)
  private playCricket(ctx: AudioContext) {
    const now = ctx.currentTime;
    const playChirp = (t: number) => {
      for (let i = 0; i < 3; i++) {
        const pulseTime = t + i * 0.025;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(4600, pulseTime);
        gain.gain.setValueAtTime(0.1, pulseTime);
        gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.018);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(pulseTime);
        osc.stop(pulseTime + 0.018);
      }
    };
    playChirp(now);
    playChirp(now + 0.22);
    playChirp(now + 0.44);
  }

  // 7. Siren (Police/Party Siren)
  private playSiren(ctx: AudioContext) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.35);
    osc.frequency.linearRampToValueAtTime(600, now + 0.7);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  // 8. Laser (Pew Pew)
  private playLaser(ctx: AudioContext) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}

export const soundSynthesizer = new SoundSynthesizer();
