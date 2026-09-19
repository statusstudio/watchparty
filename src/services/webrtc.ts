export type SendSignalFn = (targetId: string, data: any) => void;

export class WebRTCVoiceEngine {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private candidateQueue: Map<string, RTCIceCandidateInit[]> = new Map();
  private sendSignal: SendSignalFn;
  private myUserId: string;

  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
    iceCandidatePoolSize: 10,
  };

  constructor(myUserId: string, sendSignal: SendSignalFn) {
    this.myUserId = myUserId;
    this.sendSignal = sendSignal;
    this.ensureAudioContainer();
    this.setupGlobalAudioUnlock();
  }

  private ensureAudioContainer(): HTMLElement {
    let container = document.getElementById('webrtc-audio-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'webrtc-audio-container';
      container.style.position = 'absolute';
      container.style.width = '0';
      container.style.height = '0';
      container.style.overflow = 'hidden';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }
    return container;
  }

  // On Mobile Safari / Android Chrome, audio playback requires a user interaction
  private setupGlobalAudioUnlock() {
    const unlock = () => {
      this.unlockAudio();
    };
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  public unlockAudio() {
    this.remoteAudioElements.forEach((audioEl) => {
      if (audioEl.paused) {
        audioEl.play().catch(() => {});
      }
    });
  }

  public setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
    this.peerConnections.forEach((pc) => {
      const senders = pc.getSenders();
      const sender = senders.find((s) => s.track?.kind === 'audio');

      if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          if (sender) {
            sender.replaceTrack(audioTrack);
          } else {
            pc.addTrack(audioTrack, stream);
          }
        }
      } else {
        if (sender) {
          sender.replaceTrack(null);
        }
      }
    });
  }

  public async connectToPeer(remoteUserId: string, isInitiator: boolean) {
    if (this.peerConnections.has(remoteUserId)) {
      return;
    }

    const pc = new RTCPeerConnection(this.rtcConfig);
    this.peerConnections.set(remoteUserId, pc);

    // If we have a local mic stream, add the tracks
    if (this.localStream && this.localStream.getAudioTracks().length > 0) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    } else {
      // If we are just listening (audience), tell WebRTC we want to receive audio
      try {
        pc.addTransceiver('audio', { direction: 'recvonly' });
      } catch (e) {
        console.warn('Could not add recvonly transceiver:', e);
      }
    }

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(remoteUserId, {
          candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
        });
      }
    };

    // Remote audio track received from peer
    pc.ontrack = (event) => {
      let audioEl = this.remoteAudioElements.get(remoteUserId);
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.autoplay = true;
        (audioEl as any).playsInline = true;
        audioEl.volume = 1.0;
        audioEl.muted = false;

        const container = this.ensureAudioContainer();
        container.appendChild(audioEl);
        this.remoteAudioElements.set(remoteUserId, audioEl);
      }

      if (event.streams && event.streams[0]) {
        audioEl.srcObject = event.streams[0];
      } else {
        const newStream = new MediaStream([event.track]);
        audioEl.srcObject = newStream;
      }

      audioEl.play().catch((err) => {
        console.warn('Auto-play audio blocked on peer track, will play on next user gesture:', err);
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        console.warn(`WebRTC connection to ${remoteUserId} failed, attempting restart...`);
        this.cleanupPeer(remoteUserId);
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
        });
        await pc.setLocalDescription(offer);
        this.sendSignal(remoteUserId, { sdp: pc.localDescription });
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
      }
    }
  }

  public async handleSignal(remoteUserId: string, data: any) {
    let pc = this.peerConnections.get(remoteUserId);

    if (!pc) {
      if (data.sdp && data.sdp.type === 'offer') {
        await this.connectToPeer(remoteUserId, false);
        pc = this.peerConnections.get(remoteUserId);
      }
    }

    if (!pc) return;

    try {
      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        // Drain queued ICE candidates now that remote description is ready!
        const queued = this.candidateQueue.get(remoteUserId) || [];
        for (const candidate of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('Error adding queued ICE candidate:', e);
          }
        }
        this.candidateQueue.delete(remoteUserId);

        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.sendSignal(remoteUserId, { sdp: pc.localDescription });
        }
      } else if (data.candidate) {
        if (!pc.remoteDescription) {
          // Remote description not ready yet, queue candidate
          const list = this.candidateQueue.get(remoteUserId) || [];
          list.push(data.candidate);
          this.candidateQueue.set(remoteUserId, list);
        } else {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }
    } catch (err) {
      console.error('Error handling WebRTC signal:', err);
    }
  }

  public cleanupPeer(remoteUserId: string) {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remoteUserId);
    }
    this.candidateQueue.delete(remoteUserId);

    const audioEl = this.remoteAudioElements.get(remoteUserId);
    if (audioEl) {
      try {
        audioEl.pause();
        audioEl.srcObject = null;
        audioEl.remove();
      } catch (e) {}
      this.remoteAudioElements.delete(remoteUserId);
    }
  }

  public destroy() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.candidateQueue.clear();
    this.remoteAudioElements.forEach((el) => {
      try {
        el.pause();
        el.srcObject = null;
        el.remove();
      } catch (e) {}
    });
    this.remoteAudioElements.clear();
  }
}
