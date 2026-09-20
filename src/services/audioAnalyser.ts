export interface AudioAnalyserCallbacks {
  onVolumeChange?: (volume: number) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export class MicrophoneAnalyser {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private rawStream: MediaStream | null = null;
  private processedStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isSpeaking = false;
  private speakingThreshold = 0.025; // Responsive RMS threshold for voice detection
  private silenceCounter = 0;
  private callbacks: AudioAnalyserCallbacks = {};
  private micGain = 2.0; // Default: 200% Gain Boost for clear, audible voice

  constructor(callbacks: AudioAnalyserCallbacks = {}, initialGain = 2.0) {
    this.callbacks = callbacks;
    this.micGain = initialGain;
  }

  public async start(): Promise<MediaStream> {
    if (this.processedStream) {
      return this.processedStream;
    }

    try {
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

      // 1. Create Web Audio GainNode to amplify the microphone
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(this.micGain, this.audioContext.currentTime);

      // 2. Create MediaStream destination for WebRTC output
      this.destination = this.audioContext.createMediaStreamDestination();
      this.microphone = this.audioContext.createMediaStreamSource(this.rawStream);

      // 3. Route: mic input -> gain boost -> destination stream
      this.microphone.connect(this.gainNode);
      this.gainNode.connect(this.destination);

      // 4. Connect to analyser for RMS visualizer & speaking detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.4;
      this.gainNode.connect(this.analyser);

      this.processedStream = this.destination.stream;
      this.analyze();
      return this.processedStream;
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      throw err;
    }
  }

  public getStream(): MediaStream | null {
    return this.processedStream || this.rawStream;
  }

  /**
   * Sets microphone gain boost multiplier in real-time (e.g. 0.5 = 50%, 1.0 = 100%, 2.5 = 250%).
   */
  public setGain(multiplier: number) {
    this.micGain = Math.max(0.1, Math.min(4.0, multiplier));
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setTargetAtTime(this.micGain, this.audioContext.currentTime, 0.02);
    }
  }

  public getGain(): number {
    return this.micGain;
  }

  public setMute(muted: boolean) {
    if (this.rawStream) {
      this.rawStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (this.processedStream) {
      this.processedStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setTargetAtTime(muted ? 0 : this.micGain, this.audioContext.currentTime, 0.02);
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
    if (this.rawStream) {
      this.rawStream.getTracks().forEach((track) => track.stop());
      this.rawStream = null;
    }
    if (this.processedStream) {
      this.processedStream.getTracks().forEach((track) => track.stop());
      this.processedStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
    this.destination = null;
    this.analyser = null;
    this.microphone = null;
    this.isSpeaking = false;
    this.callbacks.onSpeakingChange?.(false);
  }
}
