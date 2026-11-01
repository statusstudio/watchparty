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
  private transmissionStream: MediaStream | null = null;
  private transmissionTrack: MediaStreamTrack | null = null;
  private animationFrameId: number | null = null;
  private isSpeaking = false;
  private speakingThreshold = 0.035; // Responsive RMS threshold tuned for human voice vs room/speaker ambience
  private silenceCounter = 0;
  private callbacks: AudioAnalyserCallbacks = {};
  private isMonitorEnabled = false;
  private isExplicitlyMuted = false;

  constructor(callbacks: AudioAnalyserCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public async start(): Promise<MediaStream> {
    if (this.transmissionStream) {
      return this.transmissionStream;
    }

    try {
      // 1. Capture genuine hardware microphone stream with maximal echo cancellation, noise suppression & mono channel
      this.rawStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          channelCount: 1, // Mono channel is required for acoustic echo cancellers to filter speaker bleed
          sampleRate: 48000,
          // Advanced Chromium/WebRTC constraints
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googAudioMirroring: false,
        } as any,
        video: false,
      });

      // 2. Clone audio track for WebRTC transmission.
      // The original track stays enabled=true so AudioContext / Analyser can always measure voice RMS.
      // The transmission track is gated by Voice Activity Detection (VAD) to prevent background music bleed and echo.
      const originalTrack = this.rawStream.getAudioTracks()[0];
      this.transmissionTrack = originalTrack.clone();
      this.transmissionTrack.enabled = false; // Start gated until voice detected
      this.transmissionStream = new MediaStream([this.transmissionTrack]);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // 3. Connect microphone to Analyser for live volume meter and speaking detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.35;

      this.microphone = this.audioContext.createMediaStreamSource(this.rawStream);

      // High-pass filter (120Hz) to cut off speaker sub-bass & rumble from falsely triggering voice detection
      const highpass = this.audioContext.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(120, this.audioContext.currentTime);

      this.microphone.connect(highpass);
      highpass.connect(this.analyser);

      // 4. If sidetone / mic monitor is enabled, connect to destination
      if (this.isMonitorEnabled) {
        this.attachMonitor();
      }

      this.analyze();

      // Return the transmission MediaStream for WebRTC transmission
      return this.transmissionStream;
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      throw err;
    }
  }

  public getStream(): MediaStream | null {
    return this.transmissionStream || this.rawStream;
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
    this.isExplicitlyMuted = muted;
    if (this.transmissionTrack) {
      this.transmissionTrack.enabled = !muted && this.isSpeaking;
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

    // Voice Activity Detection (VAD) with intelligent noise gate:
    if (rms > this.speakingThreshold) {
      this.silenceCounter = 0;
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        // Un-gate track so WebRTC transmits voice immediately
        if (this.transmissionTrack && !this.isExplicitlyMuted) {
          this.transmissionTrack.enabled = true;
        }
        this.callbacks.onSpeakingChange?.(true);
      }
    } else {
      this.silenceCounter++;
      // ~360ms hangover (22 animation frames) so sentence endings are not abruptly cut off
      if (this.silenceCounter > 22 && this.isSpeaking) {
        this.isSpeaking = false;
        // Gate track: completely blocks speaker music bleed & echo when silent
        if (this.transmissionTrack) {
          this.transmissionTrack.enabled = false;
        }
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
    if (this.transmissionTrack) {
      this.transmissionTrack.stop();
      this.transmissionTrack = null;
    }
    this.transmissionStream = null;
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
    this.isExplicitlyMuted = false;
    this.callbacks.onSpeakingChange?.(false);
  }
}
