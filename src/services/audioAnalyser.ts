export interface AudioAnalyserCallbacks {
  onVolumeChange?: (volume: number) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export class MicrophoneAnalyser {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isSpeaking = false;
  private speakingThreshold = 0.05; // RMS threshold
  private silenceCounter = 0;
  private callbacks: AudioAnalyserCallbacks = {};

  constructor(callbacks: AudioAnalyserCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public async start(): Promise<MediaStream> {
    if (this.stream) {
      return this.stream;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.4;

      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      this.analyze();
      return this.stream;
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      throw err;
    }
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  public setMute(muted: boolean) {
    if (this.stream) {
      this.stream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
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
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
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
