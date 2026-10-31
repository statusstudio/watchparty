import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Minimize2,
  Maximize2,
  Volume2,
  Radio,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../../types/index.js';
import { soundEffects } from '../../services/soundEffects.js';
import { socketService } from '../../services/socket.js';

interface DirectCallModalProps {
  isOpen: boolean;
  callId: string | null;
  isIncoming: boolean;
  caller: UserProfile | null;
  partner: {
    id: string;
    name: string;
    username?: string;
    avatar: string;
    color?: string;
  } | null;
  currentUser: UserProfile;
  initialVideo?: boolean;
  onClose: () => void;
  onCallEnded?: (partnerId: string, durationSeconds: number, status: 'completed' | 'missed' | 'declined') => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const DirectCallModal: React.FC<DirectCallModalProps> = ({
  isOpen,
  callId,
  isIncoming,
  caller,
  partner,
  currentUser,
  initialVideo = false,
  onClose,
  onCallEnded,
}) => {
  const [callState, setCallState] = useState<'incoming' | 'calling' | 'connected' | 'ended'>(
    isIncoming ? 'incoming' : 'calling'
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(initialVideo);
  const [isMinimized, setIsMinimized] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);

  const activePartner = isIncoming ? caller : partner;

  // Cleanup helper
  const cleanUpMedia = useCallback(() => {
    soundEffects.stopRingtone();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (err) {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  // Setup local audio meter
  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (err) {
      console.warn('Audio meter setup error:', err);
    }
  };

  // Start local user media
  const startLocalMedia = async (video: boolean): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: video ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
      });
      localStreamRef.current = stream;
      setupAudioMeter(stream);
      if (localVideoRef.current && video) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Failed to get user media for call:', err);
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้ กรุณาอนุญาตสิทธิ์การใช้งานไมโครโฟนในเบราว์เซอร์');
      return null;
    }
  };

  // Initialize WebRTC PeerConnection
  const initPeerConnection = (stream: MediaStream, targetUserId: string) => {
    if (pcRef.current) {
      pcRef.current.close();
    }
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      }
      if (remoteVideoRef.current && event.track.kind === 'video') {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && callId) {
        socketService.send({
          type: 'CALL_SIGNAL',
          callId,
          targetUserId,
          senderId: currentUser.id,
          data: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    return pc;
  };

  // Accept incoming call
  const handleAcceptIncoming = async () => {
    if (!activePartner || !callId) return;
    soundEffects.stopRingtone();
    soundEffects.playConnectedSound();

    const stream = await startLocalMedia(isVideoOn);
    if (!stream) {
      handleRejectIncoming();
      return;
    }

    const pc = initPeerConnection(stream, activePartner.id);

    // Notify caller that call was accepted
    socketService.send({
      type: 'CALL_ACCEPT',
      callId,
      targetUserId: activePartner.id,
      user: currentUser,
    });

    setCallState('connected');
    startCallTimer();
  };

  // Reject incoming call
  const handleRejectIncoming = () => {
    if (activePartner && callId) {
      socketService.send({
        type: 'CALL_REJECT',
        callId,
        targetUserId: activePartner.id,
        reason: 'declined',
      });
      if (onCallEnded) {
        onCallEnded(activePartner.id, 0, 'declined');
      }
    }
    cleanUpMedia();
    soundEffects.playEndCallSound();
    onClose();
  };

  // Hangup active or outgoing call
  const handleEndCall = () => {
    const finalDuration = duration;
    const finalStatus = callState === 'connected' ? 'completed' : 'missed';

    if (activePartner && callId) {
      socketService.send({
        type: 'CALL_END',
        callId,
        targetUserId: activePartner.id,
      });
      if (onCallEnded) {
        onCallEnded(activePartner.id, finalDuration, finalStatus);
      }
    }
    cleanUpMedia();
    soundEffects.playEndCallSound();
    onClose();
  };

  // Start call timer
  const startCallTimer = () => {
    setDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  // Initial call setup when modal opens
  useEffect(() => {
    if (!isOpen || !activePartner) return;

    if (isIncoming) {
      setCallState('incoming');
      soundEffects.startIncomingRingtone();
    } else {
      setCallState('calling');
      soundEffects.startOutgoingRingtone();

      // Start local media for outgoing call
      startLocalMedia(initialVideo).then((stream) => {
        if (!stream) {
          onClose();
          return;
        }
        // Send call invite to partner
        if (callId) {
          socketService.send({
            type: 'CALL_INVITE',
            callId,
            targetUserId: activePartner.id,
            caller: currentUser,
            isVideo: initialVideo,
          });
        }
      });
    }

    return () => {
      cleanUpMedia();
    };
  }, [isOpen]);

  // WebSocket signaling handler
  useEffect(() => {
    const unsubscribe = socketService.subscribe(async (msg: any) => {
      if (!msg) return;

      // 1. Partner accepted our call
      if (msg.type === 'CALL_ACCEPTED' && msg.callId === callId) {
        soundEffects.stopRingtone();
        soundEffects.playConnectedSound();
        setCallState('connected');
        startCallTimer();

        // Caller initiates the WebRTC offer
        if (localStreamRef.current && activePartner) {
          const pc = initPeerConnection(localStreamRef.current, activePartner.id);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketService.send({
              type: 'CALL_SIGNAL',
              callId: callId || '',
              targetUserId: activePartner.id,
              senderId: currentUser.id,
              data: { type: 'offer', sdp: offer.sdp },
            });
          } catch (err) {
            console.error('Error creating offer:', err);
          }
        }
      }

      // 2. Partner rejected call or busy
      else if (msg.type === 'CALL_REJECTED' && msg.callId === callId) {
        soundEffects.playEndCallSound();
        setCallState('ended');
        if (onCallEnded && activePartner) {
          onCallEnded(activePartner.id, 0, 'declined');
        }
        setTimeout(() => {
          cleanUpMedia();
          onClose();
        }, 1500);
      }

      // 3. Partner ended call
      else if (msg.type === 'CALL_ENDED' && msg.callId === callId) {
        soundEffects.playEndCallSound();
        setCallState('ended');
        const finalSec = duration;
        if (onCallEnded && activePartner) {
          onCallEnded(activePartner.id, finalSec, finalSec > 0 ? 'completed' : 'missed');
        }
        setTimeout(() => {
          cleanUpMedia();
          onClose();
        }, 1000);
      }

      // 4. WebRTC signaling data exchange
      else if (msg.type === 'CALL_SIGNAL' && msg.callId === callId) {
        const { data } = msg;
        const pc = pcRef.current;
        if (!pc) return;

        try {
          if (data.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketService.send({
              type: 'CALL_SIGNAL',
              callId: callId || '',
              targetUserId: msg.senderId,
              senderId: currentUser.id,
              data: { type: 'answer', sdp: answer.sdp },
            });
          } else if (data.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
          } else if (data.type === 'candidate' && data.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        } catch (err) {
          console.error('WebRTC signal handling error:', err);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [callId, activePartner, duration, currentUser.id]);

  // Toggle Mute
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = isMuted; // Toggle enabled
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle Video
  const handleToggleVideo = async () => {
    const nextVideoState = !isVideoOn;
    setIsVideoOn(nextVideoState);

    if (localStreamRef.current) {
      if (nextVideoState) {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
          });
          const videoTrack = videoStream.getVideoTracks()[0];
          localStreamRef.current.addTrack(videoTrack);
          if (pcRef.current) {
            pcRef.current.addTrack(videoTrack, localStreamRef.current);
          }
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        } catch (err) {
          console.warn('Failed to enable camera:', err);
        }
      } else {
        const videoTracks = localStreamRef.current.getVideoTracks();
        videoTracks.forEach((t) => {
          t.stop();
          localStreamRef.current?.removeTrack(t);
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }
    }
  };

  if (!isOpen || !activePartner) return null;

  // Format call duration MM:SS
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const durationStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Hidden audio element for remote stream
  const remoteAudioElem = (
    <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
  );

  // 1. Minimized Floating Widget Mode (Allows user to keep browsing while talking!)
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50 bg-[#0f172a]/95 border border-pink-500/40 rounded-2xl shadow-2xl p-3 flex items-center gap-3 backdrop-blur-md animate-slide-up text-white">
        {remoteAudioElem}
        <div className="relative">
          <img
            src={activePartner.avatar || '/default-avatar.png'}
            alt={activePartner.name}
            className="w-10 h-10 rounded-full object-cover border-2"
            style={{ borderColor: activePartner.color || '#ec4899' }}
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f172a] animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-bold truncate max-w-[120px]">{activePartner.name}</p>
          <p className="text-[10px] text-emerald-400 font-mono font-semibold">{durationStr}</p>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-xl text-white transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/20'
            }`}
            title={isMuted ? 'เปิดไมค์' : 'ปิดไมค์'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="ขยายเต็มจอ"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleEndCall}
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
            title="วางสาย"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Incoming Call Dialog Mode
  if (callState === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white">
        {remoteAudioElem}
        <div className="relative w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
          {/* Animated Ripples */}
          <div className="relative mb-6 mt-4">
            <div className="absolute -inset-4 rounded-full bg-pink-500/20 animate-ping opacity-75" />
            <div className="absolute -inset-2 rounded-full bg-pink-500/30 animate-pulse" />
            <img
              src={activePartner.avatar || '/default-avatar.png'}
              alt={activePartner.name}
              className="relative w-24 h-24 rounded-full object-cover border-4 shadow-xl"
              style={{ borderColor: activePartner.color || '#ec4899' }}
            />
          </div>

          <h3 className="text-xl font-bold text-white mb-1">{activePartner.name}</h3>
          {activePartner.username && (
            <p className="text-xs text-white/50 mb-3">@{activePartner.username}</p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-pink-400 font-semibold mb-8 animate-pulse">
            <Phone className="w-3.5 h-3.5" />
            <span>สายโทรเข้า (Incoming Voice Call)...</span>
          </div>

          {/* Accept / Decline Action Buttons */}
          <div className="flex items-center justify-center gap-8 w-full">
            <button
              onClick={handleRejectIncoming}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 group-active:scale-95 transition-all">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-rose-400">ปฏิเสธ</span>
            </button>

            <button
              onClick={handleAcceptIncoming}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-active:scale-95 transition-all animate-bounce">
                <Phone className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-emerald-400">รับสาย</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Outgoing Calling or Connected Active Call Screen
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in text-white">
      {remoteAudioElem}
      <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center overflow-hidden">
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between text-white/50 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Radio className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
            <span>WatchParty Direct Voice</span>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title="ย่อหน้าต่าง เพื่อใช้งานหน้าอื่นต่อ"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Video Elements (if enabled) */}
        {isVideoOn && (
          <div className="w-full h-48 bg-black/50 rounded-2xl mb-4 overflow-hidden relative border border-white/10">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-20 h-28 object-cover rounded-xl border border-white/30 absolute bottom-2 right-2 shadow-lg"
            />
          </div>
        )}

        {/* Avatar with speaking wave & aura */}
        <div className="relative my-4 flex items-center justify-center">
          {callState === 'connected' && audioLevel > 15 && (
            <div
              className="absolute rounded-full bg-emerald-500/25 transition-all duration-100"
              style={{
                width: `${110 + audioLevel * 0.8}px`,
                height: `${110 + audioLevel * 0.8}px`,
              }}
            />
          )}

          {callState === 'calling' && (
            <div className="absolute -inset-4 rounded-full bg-blue-500/20 animate-ping opacity-60" />
          )}

          <img
            src={activePartner.avatar || '/default-avatar.png'}
            alt={activePartner.name}
            className="relative w-24 h-24 rounded-full object-cover border-4 shadow-2xl"
            style={{
              borderColor:
                callState === 'connected' && audioLevel > 15
                  ? '#10b981'
                  : activePartner.color || '#ec4899',
            }}
          />
        </div>

        {/* Partner Name & Call Status */}
        <h3 className="text-xl font-bold text-white mb-0.5">{activePartner.name}</h3>
        {activePartner.username && (
          <p className="text-xs text-white/40 mb-3">@{activePartner.username}</p>
        )}

        {/* Status / Duration */}
        <div className="mb-8">
          {callState === 'calling' && (
            <p className="text-xs text-blue-400 font-semibold animate-pulse">
              กำลังโทรออก (Calling)...
            </p>
          )}
          {callState === 'connected' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{durationStr}</span>
            </div>
          )}
          {callState === 'ended' && (
            <p className="text-xs text-rose-400 font-semibold">สายถูกตัดแล้ว (Call Ended)</p>
          )}
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center justify-center gap-4 w-full pt-2 border-t border-white/5">
          {/* Mute Mic */}
          <button
            onClick={handleToggleMute}
            disabled={callState !== 'connected'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-white/10 hover:bg-white/15 text-white'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={isMuted ? 'เปิดไมค์' : 'ปิดไมค์'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video */}
          <button
            onClick={handleToggleVideo}
            disabled={callState !== 'connected'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isVideoOn
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                : 'bg-white/10 hover:bg-white/15 text-white'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={isVideoOn ? 'ปิดกล้อง' : 'เปิดกล้อง'}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Hang Up (Red Button) */}
          <button
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
            title="วางสาย"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
