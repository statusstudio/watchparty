export interface AudioAnalyserCallbacks {
  onVolumeChange?: (volume: number) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export class MicrophoneAnalyser {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private monitorGainNode: GainNode | null = null;
  private rawStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isSpeaking = false;
  private speakingThreshold = 0.025; // Responsive RMS threshold for voice detection
  private silenceCounter = 0;
  private callbacks: AudioAnalyserCallbacks = {};
  private isMonitorEnabled = false;

  constructor(callbacks: AudioAnalyserCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public async start(): Promise<MediaStream> {
    if (this.rawStream) {
      return this.rawStream;
    }

    try {
      // 1. Capture genuine hardware microphone stream with browser-level auto gain & noise cancellation
      this.rawStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // 2. Connect microphone to Analyser for live volume meter and speaking detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.4;

      this.microphone = this.audioContext.createMediaStreamSource(this.rawStream);
      this.microphone.connect(this.analyser);

      // 3. If sidetone / mic monitor is enabled, connect to destination
      if (this.isMonitorEnabled) {
        this.attachMonitor();
      }

      this.analyze();

      // Return the genuine native MediaStream for WebRTC transmission
      return this.rawStream;
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      throw err;
    }
  }

  public getStream(): MediaStream | null {
    return this.rawStream;
  }

  /**
   * Enables or disables local mic monitor (sidetone) so the user can hear their own voice in their headphones.
   */
  public setMonitor(enabled: boolean) {
    this.isMonitorEnabled = enabled;
    if (enabled) {
      this.attachMonitor();
    } else {
      this.detachMonitor();
    }
  }

  private attachMonitor() {
    if (!this.audioContext || !this.microphone) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    if (!this.monitorGainNode) {
      this.monitorGainNode = this.audioContext.createGain();
      this.monitorGainNode.gain.value = 1.0;
      this.microphone.connect(this.monitorGainNode);
      this.monitorGainNode.connect(this.audioContext.destination);
    }
  }

  private detachMonitor() {
    if (this.monitorGainNode) {
      try {
        this.monitorGainNode.disconnect();
      } catch (e) {}
      this.monitorGainNode = null;
    }
  }

  public setMute(muted: boolean) {
    if (this.rawStream) {
      this.rawStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (this.monitorGainNode && this.audioContext) {
      this.monitorGainNode.gain.setValueAtTime(muted ? 0 : 1.0, this.audioContext.currentTime);
    }
  }

  private analyze = () => {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    // Calculate RMS volume (normalized 0 to 1)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const val = (dataArray[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / bufferLength);

    this.callbacks.onVolumeChange?.(rms);

    // Check if speaking with slight hysteresis
    if (rms > this.speakingThreshold) {
      this.silenceCounter = 0;
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.callbacks.onSpeakingChange?.(true);
      }
    } else {
      this.silenceCounter++;
      if (this.silenceCounter > 15 && this.isSpeaking) { // ~250ms of silence
        this.isSpeaking = false;
        this.callbacks.onSpeakingChange?.(false);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.analyze);
  };

  public stop() {
    this.detachMonitor();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.rawStream) {
      this.rawStream.getTracks().forEach((track) => track.stop());
      this.rawStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.microphone = null;
    this.isSpeaking = false;
    this.callbacks.onSpeakingChange?.(false);
  }
}
