export type SendSignalFn = (targetId: string, data: any) => void;

export class WebRTCVoiceEngine {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private sendSignal: SendSignalFn;
  private myUserId: string;

  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  constructor(myUserId: string, sendSignal: SendSignalFn) {
    this.myUserId = myUserId;
    this.sendSignal = sendSignal;
  }

  public setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
    // Update existing peer connections with new tracks
    this.peerConnections.forEach((pc) => {
      const senders = pc.getSenders();
      if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          const sender = senders.find((s) => s.track?.kind === 'audio');
          if (sender) {
            sender.replaceTrack(audioTrack);
          } else {
            pc.addTrack(audioTrack, stream);
          }
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

    // Add local tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(remoteUserId, {
          candidate: event.candidate,
        });
      }
    };

    // Remote track received
    pc.ontrack = (event) => {
      let audioEl = this.remoteAudioElements.get(remoteUserId);
      if (!audioEl) {
        audioEl = new Audio();
        audioEl.autoplay = true;
        this.remoteAudioElements.set(remoteUserId, audioEl);
      }
      audioEl.srcObject = event.streams[0];
      audioEl.play().catch((e) => console.warn('Autoplay audio blocked:', e));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.cleanupPeer(remoteUserId);
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
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
      // If we received an offer and don't have pc yet, initialize as non-initiator
      if (data.sdp && data.sdp.type === 'offer') {
        await this.connectToPeer(remoteUserId, false);
        pc = this.peerConnections.get(remoteUserId);
      }
    }

    if (!pc) return;

    try {
      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.sendSignal(remoteUserId, { sdp: pc.localDescription });
        }
      } else if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
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
    const audioEl = this.remoteAudioElements.get(remoteUserId);
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      this.remoteAudioElements.delete(remoteUserId);
    }
  }

  public destroy() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.remoteAudioElements.forEach((el) => {
      el.pause();
      el.srcObject = null;
    });
    this.remoteAudioElements.clear();
  }
}
