export type SendSignalFn = (targetId: string, data: any) => void;

interface PeerMetadata {
  pc: RTCPeerConnection;
  remoteUserId: string;
  makingOffer: boolean;
  ignoreOffer: boolean;
  isPolite: boolean;
}

export class WebRTCVoiceEngine {
  private localStream: MediaStream | null = null;
  private peers: Map<string, PeerMetadata> = new Map();
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

  /**
   * Called when local microphone stream is ready or stopped.
   * Updates all active peer connections and renegotiates so that all other peers
   * immediately receive the live audio.
   */
  public async setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
    const audioTrack = stream ? stream.getAudioTracks()[0] : null;

    const peerEntries = Array.from(this.peers.entries());
    await Promise.allSettled(
      peerEntries.map(async ([remoteUserId, meta]) => {
        const pc = meta.pc;
        const transceivers = pc.getTransceivers();
        const audioTransceiver = transceivers.find(
          (t) => t.sender.track?.kind === 'audio' || t.receiver.track?.kind === 'audio'
        );

        try {
          if (audioTrack) {
            // User is on stage with microphone: set direction to sendrecv
            if (audioTransceiver) {
              audioTransceiver.direction = 'sendrecv';
              await audioTransceiver.sender.replaceTrack(audioTrack);
            } else {
              pc.addTrack(audioTrack, stream!);
            }
            await this.renegotiate(remoteUserId);
          } else {
            // User left stage: set direction to recvonly and remove audio track
            if (audioTransceiver) {
              audioTransceiver.direction = 'recvonly';
              await audioTransceiver.sender.replaceTrack(null);
            }
            await this.renegotiate(remoteUserId);
          }
        } catch (err) {
          console.warn(`[WebRTC] Error updating track for peer ${remoteUserId}:`, err);
        }
      })
    );
  }

  /**
   * Initiates renegotiation with a peer (creates fresh SDP offer).
   */
  public async renegotiate(remoteUserId: string) {
    const meta = this.peers.get(remoteUserId);
    if (!meta) return;
    const { pc } = meta;

    if (pc.signalingState !== 'stable') {
      return;
    }

    try {
      meta.makingOffer = true;
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
      });
      if (pc.signalingState !== 'stable') return;
      await pc.setLocalDescription(offer);
      this.sendSignal(remoteUserId, { sdp: pc.localDescription });
    } catch (err) {
      console.error(`[WebRTC] Error renegotiating offer for ${remoteUserId}:`, err);
    } finally {
      meta.makingOffer = false;
    }
  }

  /**
   * Connects to a remote peer (either initiating or preparing to receive).
   */
  public async connectToPeer(remoteUserId: string, isInitiator: boolean) {
    let meta = this.peers.get(remoteUserId);

    if (meta) {
      // Peer connection already exists.
      // If we now have a local microphone stream that hasn't been added yet, add and renegotiate!
      if (this.localStream) {
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
          const transceivers = meta.pc.getTransceivers();
          const audioTransceiver = transceivers.find(
            (t) => t.sender.track?.kind === 'audio' || t.receiver.track?.kind === 'audio'
          );

          if (audioTransceiver) {
            if (audioTransceiver.direction !== 'sendrecv' || audioTransceiver.sender.track !== audioTrack) {
              audioTransceiver.direction = 'sendrecv';
              await audioTransceiver.sender.replaceTrack(audioTrack);
              await this.renegotiate(remoteUserId);
            }
          } else {
            meta.pc.addTrack(audioTrack, this.localStream);
            await this.renegotiate(remoteUserId);
          }
        }
      }
      return;
    }

    const pc = new RTCPeerConnection(this.rtcConfig);
    const isPolite = this.myUserId < remoteUserId;

    meta = {
      pc,
      remoteUserId,
      makingOffer: false,
      ignoreOffer: false,
      isPolite,
    };
    this.peers.set(remoteUserId, meta);

    // If local user has microphone active, add the track immediately
    if (this.localStream && this.localStream.getAudioTracks().length > 0) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      pc.addTrack(audioTrack, this.localStream);
    } else {
      // Audience listener: request audio receiving
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
        audioEl.srcObject = new MediaStream([event.track]);
      }

      audioEl.play().catch((err) => {
        console.warn(`[WebRTC] Audio auto-play blocked for ${remoteUserId}, will play on click:`, err);
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        console.warn(`[WebRTC] Connection to ${remoteUserId} failed, resetting peer...`);
        this.cleanupPeer(remoteUserId);
      }
    };

    if (isInitiator) {
      await this.renegotiate(remoteUserId);
    }
  }

  /**
   * Handles incoming WebRTC signaling data (SDP offer/answer and ICE candidates)
   * with W3C Perfect Negotiation glare handling.
   */
  public async handleSignal(remoteUserId: string, data: any) {
    let meta = this.peers.get(remoteUserId);

    if (!meta) {
      if (data.sdp && data.sdp.type === 'offer') {
        await this.connectToPeer(remoteUserId, false);
        meta = this.peers.get(remoteUserId);
      }
    }

    if (!meta) return;
    const { pc, isPolite } = meta;

    try {
      if (data.sdp) {
        const offerCollision =
          data.sdp.type === 'offer' &&
          (meta.makingOffer || pc.signalingState !== 'stable');

        meta.ignoreOffer = !isPolite && offerCollision;
        if (meta.ignoreOffer) {
          console.log(`[WebRTC] Glare collision: impolite peer ${this.myUserId} ignoring offer from ${remoteUserId}`);
          return;
        }

        if (offerCollision && isPolite) {
          try {
            await pc.setLocalDescription({ type: 'rollback' });
          } catch (e) {
            // Ignore rollback failure on environments that auto-rollback
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        // Drain queued ICE candidates
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
          // If we have local stream, ensure audio track is configured
          if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
              const transceivers = pc.getTransceivers();
              const audioTransceiver = transceivers.find(
                (t) => t.sender.track?.kind === 'audio' || t.receiver.track?.kind === 'audio'
              );
              if (audioTransceiver) {
                audioTransceiver.direction = 'sendrecv';
                await audioTransceiver.sender.replaceTrack(audioTrack);
              }
            }
          }

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
      console.error(`[WebRTC] Error handling signal from ${remoteUserId}:`, err);
    }
  }

  /**
   * Cleans up all peers except those specified in the keep set (e.g. current stage speakers).
   */
  public cleanupPeersExcept(keepUserIds: Set<string>) {
    for (const remoteUserId of Array.from(this.peers.keys())) {
      if (!keepUserIds.has(remoteUserId)) {
        this.cleanupPeer(remoteUserId);
      }
    }
  }

  public cleanupPeer(remoteUserId: string) {
    const meta = this.peers.get(remoteUserId);
    if (meta) {
      meta.pc.close();
      this.peers.delete(remoteUserId);
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
    this.peers.forEach((meta) => meta.pc.close());
    this.peers.clear();
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
