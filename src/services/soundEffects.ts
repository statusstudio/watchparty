// Web Audio API Ringtone & Call Sound Generator
// Generates tones programmatically so no external audio files are required.

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private ringOscillator: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private ringInterval: any = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Play outgoing ring tone (smooth "tuu... tuu...")
   */
  public startOutgoingRingtone() {
    this.stopRingtone();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const playBeep = () => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // Standard 440Hz tone

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } catch (err) {
        // ignore
      }
    };

    playBeep();
    this.ringInterval = setInterval(playBeep, 3500);
  }

  /**
   * Play incoming ring tone (pleasant melodious chime)
   */
  public startIncomingRingtone() {
    this.stopRingtone();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord

    const playChime = () => {
      try {
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);

          gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.12);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + index * 0.12 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.12 + 0.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + index * 0.12);
          osc.stop(ctx.currentTime + index * 0.12 + 0.65);
        });
      } catch (err) {
        // ignore
      }
    };

    playChime();
    this.ringInterval = setInterval(playChime, 2200);
  }

  /**
   * Stop any playing ringtone
   */
  public stopRingtone() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  /**
   * Play call connected sound
   */
  public playConnectedSound() {
    this.stopRingtone();
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (err) {
      // ignore
    }
  }

  /**
   * Play call ended / busy sound
   */
  public playEndCallSound() {
    this.stopRingtone();
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (err) {
      // ignore
    }
  }
}

export const soundEffects = new SoundEffectsService();
