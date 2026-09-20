import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Volume2,
  Sliders,
  Headphones,
  Hand,
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  Crown,
} from 'lucide-react';
import { StageSeat, UserProfile, StageAccessMode, StageRequest, UserRole } from '../types/index.js';
import { MicrophoneAnalyser } from '../services/audioAnalyser.js';

interface VoiceStageProps {
  seats: StageSeat[];
  currentUser: UserProfile;
  myRole?: UserRole;
  stageAccessMode?: StageAccessMode;
  pendingStageRequests?: StageRequest[];
  approvedSpeakerIds?: string[];
  onTakeSeat: (seatNumber: number) => void;
  onLeaveSeat: () => void;
  onToggleMute: (isMuted: boolean) => void;
  onSpeakingState: (isSpeaking: boolean) => void;
  onLocalStreamReady: (stream: MediaStream | null) => void;
  onOpenProfile: () => void;
  onSelectUser?: (user: UserProfile) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
  onRequestToSpeak?: (seatNumber?: number) => void;
  onApproveSpeakRequest?: (targetUserId: string, approved: boolean, seatNumber?: number) => void;
  onRevokeSpeakPermission?: (targetUserId: string) => void;
  onVoiceVolumeChange?: (volume: number) => void;
}

export const VoiceStage: React.FC<VoiceStageProps> = ({
  seats,
  currentUser,
  myRole = 'member',
  stageAccessMode = 'everyone',
  pendingStageRequests = [],
  approvedSpeakerIds = [],
  onTakeSeat,
  onLeaveSeat,
  onToggleMute,
  onSpeakingState,
  onLocalStreamReady,
  onOpenProfile,
  onSelectUser,
  onShowToast,
  onRequestToSpeak,
  onApproveSpeakRequest,
  onRevokeSpeakPermission,
  onVoiceVolumeChange,
}) => {
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [volumeRms, setVolumeRms] = useState(0);
  const [isConnectingMic, setIsConnectingMic] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isMonitorEnabled, setIsMonitorEnabled] = useState(false);

  // User-configurable incoming voice volume (0.0 to 1.0)
  const [incomingVolume, setIncomingVolume] = useState<number>(() => {
    const saved = localStorage.getItem('watchparty_voice_volume');
    return saved ? parseFloat(saved) : 1.0;
  });

  const analyserRef = useRef<MicrophoneAnalyser | null>(null);

  // Active speakers currently in voice
  const activeSpeakers = seats.filter((s) => s.user !== null);
  const mySeat = seats.find((s) => s.user?.id === currentUser.id);
  const isSitting = !!mySeat;

  const isOwner = myRole === 'owner';
  const isAdmin = myRole === 'admin';
  const isAdminOrOwner = isOwner || isAdmin;
  const isApprovedSpeaker = approvedSpeakerIds.includes(currentUser.id);
  const myPendingRequest = pendingStageRequests.find((r) => r.userId === currentUser.id);

  // Manage microphone lifecycle when joining / leaving voice
  useEffect(() => {
    if (isSitting) {
      if (!analyserRef.current) {
        setIsConnectingMic(true);
        const analyser = new MicrophoneAnalyser({
          onVolumeChange: (vol) => {
            setVolumeRms(vol);
          },
          onSpeakingChange: (speaking) => {
            setLocalSpeaking(speaking);
            onSpeakingState(speaking);
          },
        });

        analyserRef.current = analyser;
        analyser
          .start()
          .then((stream) => {
            setIsConnectingMic(false);
            onLocalStreamReady(stream);
            onShowToast('เชื่อมต่อไมโครโฟนเรียบร้อยแล้ว 🎙️', 'success');
          })
          .catch((err) => {
            setIsConnectingMic(false);
            console.warn('Microphone permission error:', err);
            onShowToast('ไม่สามารถเข้าถึงไมโครโฟนได้ หรือยังไม่ได้อนุญาตสิทธิ์', 'warning');
          });
      }
    } else {
      // Clean up microphone if left voice
      if (analyserRef.current) {
        analyserRef.current.stop();
        analyserRef.current = null;
        onLocalStreamReady(null);
        setLocalSpeaking(false);
        setVolumeRms(0);
      }
    }

    return () => {
      if (analyserRef.current && !isSitting) {
        analyserRef.current.stop();
        analyserRef.current = null;
      }
    };
  }, [isSitting, onLocalStreamReady, onSpeakingState, onShowToast]);

  const handleToggleMonitor = () => {
    const next = !isMonitorEnabled;
    setIsMonitorEnabled(next);
    analyserRef.current?.setMonitor(next);
    if (next) {
      onShowToast('เปิดฟังเสียงไมค์ตัวเองแล้ว 🎧 (แนะนำใส่หูฟังเพื่อป้องกันเสียงสะท้อนลำโพง)', 'info');
    } else {
      onShowToast('ปิดฟังเสียงตัวเองแล้ว (เพื่อนในห้องยังได้ยินเสียงคุณตามปกติ)', 'info');
    }
  };

  const handleIncomingVolumeChange = (newVol: number) => {
    setIncomingVolume(newVol);
    onVoiceVolumeChange?.(newVol);
    localStorage.setItem('watchparty_voice_volume', newVol.toString());
  };

  const handleMuteToggle = () => {
    const nextMute = !isLocalMuted;
    setIsLocalMuted(nextMute);
    analyserRef.current?.setMute(nextMute);
    onToggleMute(nextMute);
    if (nextMute) {
      setLocalSpeaking(false);
      onSpeakingState(false);
    }
  };

  const handleJoinVoice = () => {
    if (stageAccessMode === 'admin_only' && !isAdminOrOwner) {
      onShowToast('ห้องนี้จำกัดการเปิดไมค์เฉพาะ Owner และ Admin เท่านั้น 🛡️', 'warning');
      return;
    }

    if (stageAccessMode === 'approval' && !isAdminOrOwner && !isApprovedSpeaker) {
      if (myPendingRequest) {
        onShowToast('คำขอเปิดไมค์ของคุณอยู่ระหว่างรอเจ้าของห้องอนุมัติ ⏳', 'info');
      } else {
        onRequestToSpeak?.();
        onShowToast('ส่งคำขอยกมือเปิดไมค์แล้ว รอการอนุมัติ... ✋', 'info');
      }
      return;
    }

    // Allocate next available slot or join
    const emptySeat = seats.find((s) => s.user === null);
    const targetSeatNumber = emptySeat ? emptySeat.seatNumber : seats.length + 1;
    onTakeSeat(targetSeatNumber);
  };

  return (
    <div className="bg-white rounded-xl border border-[#e6e6e6] p-3 shadow-xs shrink-0 transition-all">
      {/* Header & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-[#e6e6e6]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#1aae39] animate-pulse" />
          <h2 className="text-xs sm:text-sm font-bold text-[#000000] tracking-tight flex items-center gap-1.5">
            <span>ห้องคุยไมค์สด</span>
            <span className="text-[11px] font-normal text-[#615d59] hidden sm:inline">
              (Open Voice)
            </span>
          </h2>

          {/* Active Voice Count Badge */}
          <span className="px-2 py-0.5 rounded-full bg-[#0075de]/10 text-[#0075de] text-[10px] font-medium border border-[#0075de]/20 flex items-center gap-1">
            <Radio className="w-3 h-3 text-[#0075de] animate-pulse" />
            <span>{activeSpeakers.length} คนในสาย</span>
          </span>

          {/* Mode Pill */}
          {stageAccessMode === 'everyone' && (
            <span className="px-2 py-0.5 rounded-full bg-[#f6f5f4] text-[#31302e] text-[10px] font-medium border border-[#e6e6e6] hidden md:flex items-center gap-1">
              <Users className="w-3 h-3 text-[#2a9d99]" /> ทุกคนเปิดไมค์ได้
            </span>
          )}
          {stageAccessMode === 'admin_only' && (
            <span className="px-2 py-0.5 rounded-full bg-[#d6b6f6]/20 text-[#391c57] text-[10px] font-medium border border-[#d6b6f6]/40 hidden md:flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#391c57]" /> เฉพาะแอดมิน
            </span>
          )}
          {stageAccessMode === 'approval' && (
            <span className="px-2 py-0.5 rounded-full bg-[#dd5b00]/10 text-[#dd5b00] text-[10px] font-medium border border-[#dd5b00]/20 hidden md:flex items-center gap-1">
              <Hand className="w-3 h-3 text-[#dd5b00]" /> ต้องขออนุมัติ
            </span>
          )}
        </div>

        {/* Action Controls Dock (Join / Mute / Audio Settings / Leave) */}
        <div className="flex items-center gap-2">
          {/* Audio & Mic Settings Toggle Button */}
          <button
            type="button"
            onClick={() => setIsAudioSettingsOpen(!isAudioSettingsOpen)}
            title="ตั้งค่าระดับเสียงไมค์ ฟังเสียงตัวเอง และความดังเพื่อนในห้อง"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-xs ${
              isAudioSettingsOpen
                ? 'bg-[#0075de] text-white border-[#0075de]'
                : 'bg-white hover:bg-[#f6f5f4] text-[#615d59] border-[#e6e6e6]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ตั้งค่าเสียงไมค์</span>
            {isMonitorEnabled && (
              <span className="w-2 h-2 rounded-full bg-[#1aae39] animate-ping" />
            )}
          </button>

          {isSitting ? (
            <>
              {/* Mic Mute / Unmute Button */}
              <button
                type="button"
                onClick={handleMuteToggle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                  isLocalMuted
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                    : 'bg-[#1aae39]/10 text-[#1aae39] border border-[#1aae39]/30 hover:bg-[#1aae39]/20'
                }`}
              >
                {isLocalMuted ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>ไมค์ปิดอยู่</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 animate-pulse" />
                    <span>เปิดไมค์อยู่</span>
                  </>
                )}
              </button>

              {/* Leave Voice Button */}
              <button
                type="button"
                onClick={onLeaveSeat}
                title="ออกจากสายไมค์"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-rose-50 hover:text-rose-600 text-[#615d59] border border-[#e6e6e6] hover:border-rose-200 transition-colors cursor-pointer shadow-xs"
              >
                <PhoneOff className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">ออกจากสาย</span>
              </button>
            </>
          ) : (
            <>
              {stageAccessMode === 'approval' && !isAdminOrOwner && !isApprovedSpeaker ? (
                myPendingRequest ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#dd5b00]/10 border border-[#dd5b00]/30 text-[#dd5b00] text-xs font-medium animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                    <span>ขอยกมือแล้ว (รออนุมัติ...)</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleJoinVoice}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#dd5b00] hover:bg-[#c25000] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <Hand className="w-3.5 h-3.5" />
                    <span>ขอยกมือเปิดไมค์</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleJoinVoice}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-bold shadow-[0_1px_2px_rgba(0,117,222,0.2)] transition-all cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>เข้าร่วมคุยไมค์</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Audio & Mic Settings Expandable Panel */}
      {isAudioSettingsOpen && (
        <div className="mb-3 p-3 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] shadow-xs animate-fade-in space-y-3">
          <div className="flex items-center justify-between border-b border-[#e6e6e6] pb-2">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#0075de]" />
              <span className="text-xs font-bold text-[#000000]">ตั้งค่าระดับเสียงและการได้ยิน 🎚️</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAudioSettingsOpen(false)}
              className="text-[#a39e98] hover:text-[#000000] text-xs px-2 py-0.5 rounded hover:bg-black/5 cursor-pointer"
            >
              ✕ ปิด
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* 1. Sidetone / Mic Monitor & Live Signal Meter */}
            <div className="p-2.5 rounded-lg bg-white border border-[#e6e6e6] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#000000] flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-[#0075de]" />
                  ฟังเสียงไมค์ตัวเอง (Mic Monitor)
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isMonitorEnabled ? 'bg-[#1aae39]/15 text-[#1aae39]' : 'bg-gray-100 text-[#615d59]'
                }`}>
                  {isMonitorEnabled ? 'เปิดฟังอยู่ 🎧' : 'ปิดอยู่'}
                </span>
              </div>

              <p className="text-[11px] text-[#615d59] leading-relaxed">
                โดยปกติระบบจะส่งเสียงไมค์ไปยังเพื่อนในห้องเท่านั้น และจะไม่เปิดออกลำโพงของตัวเองเพื่อป้องกันเสียงสะท้อน (Echo)
              </p>

              {/* Mic Monitor Button */}
              <button
                type="button"
                onClick={handleToggleMonitor}
                disabled={!isSitting}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 ${
                  !isSitting
                    ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border border-gray-200'
                    : isMonitorEnabled
                    ? 'bg-[#1aae39] text-white hover:bg-[#158f2e]'
                    : 'bg-[#0075de] hover:bg-[#005bab] text-white'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>{isMonitorEnabled ? 'กำลังฟังเสียงตัวเองอยู่ (แตะเพื่อปิด)' : 'แตะที่นี่เพื่อฟังเสียงไมค์ตัวเอง (ทดสอบเสียง)'}</span>
              </button>

              {/* Live RMS Meter for instant testing */}
              {isSitting ? (
                <div className="space-y-1 pt-1 border-t border-[#f0f0f0]">
                  <div className="flex items-center justify-between text-[10px] text-[#615d59]">
                    <span>สัญญาณไมค์เข้าเครื่อง (Live Meter):</span>
                    <span className={localSpeaking ? 'text-[#1aae39] font-bold flex items-center gap-1' : 'text-[#a39e98]'}>
                      {localSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-[#1aae39] animate-pulse" />}
                      {localSpeaking ? 'ตรวจพบเสียงพูด 🎙️' : 'รอเสียงพูด...'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#e6e6e6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1aae39] transition-all duration-75"
                      style={{ width: `${Math.min(100, Math.round(volumeRms * 400))}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-[#a39e98] italic pt-1 border-t border-[#f0f0f0]">
                  (ต้องกด "เข้าร่วมคุยไมค์" ด้านบนก่อน จึงจะสามารถเปิดทดสอบไมค์ได้)
                </p>
              )}
            </div>

            {/* 2. Incoming Voice Volume & Audio Ducking */}
            <div className="p-2.5 rounded-lg bg-white border border-[#e6e6e6] space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#000000] flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#1aae39]" />
                    ระดับเสียงเพื่อนในห้องไมค์
                  </span>
                  <span className="font-mono text-[#1aae39] font-bold bg-[#1aae39]/10 px-1.5 py-0.5 rounded text-[11px]">
                    {Math.round(incomingVolume * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#a39e98]">0%</span>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={incomingVolume}
                    onChange={(e) => handleIncomingVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-[#e6e6e6] rounded-lg appearance-none cursor-pointer accent-[#1aae39]"
                  />
                  <span className="text-[10px] text-[#a39e98]">100%</span>
                </div>
              </div>

              {/* Audio Ducking Explanation Banner */}
              <div className="p-2 rounded-lg bg-[#f6f5f4] border border-[#e6e6e6] flex items-start gap-2 text-[11px] text-[#615d59] leading-relaxed">
                <Headphones className="w-4 h-4 text-[#0075de] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#000000]">ระบบลดเสียงเพลงอัตโนมัติ (Audio Ducking):</strong> เมื่อมีคนพูดไมค์บนเวที ระบบจะหรี่เสียง YouTube ลงเหลือ 15% ทันทีเพื่อให้เสียงพูดฟังง่าย ไม่โดนดนตรีกลบ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Host / Admin Pending Requests Notice */}
      {isAdminOrOwner && pendingStageRequests.length > 0 && (
        <div className="mb-3 p-2.5 rounded-xl bg-[#dd5b00]/10 border border-[#dd5b00]/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Hand className="w-4 h-4 text-[#dd5b00]" />
            <span className="text-xs font-semibold text-[#dd5b00]">
              มีคำขอยกมือเปิดไมค์ ({pendingStageRequests.length} คน)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {pendingStageRequests.map((req) => (
              <div
                key={req.userId}
                className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-[#e6e6e6] text-xs shadow-xs"
              >
                <img
                  src={req.user.avatar}
                  alt={req.user.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-[#31302e] font-medium text-[11px] truncate max-w-[90px]">
                  {req.user.name}
                </span>
                <div className="flex items-center gap-1 ml-1">
                  <button
                    type="button"
                    onClick={() => onApproveSpeakRequest?.(req.userId, true)}
                    title="อนุมัติให้เปิดไมค์"
                    className="p-1 rounded bg-[#1aae39]/15 hover:bg-[#1aae39]/25 text-[#1aae39] transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onApproveSpeakRequest?.(req.userId, false)}
                    title="ปฏิเสธคำขอ"
                    className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-600 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Active Speakers Grid */}
      {activeSpeakers.length === 0 ? (
        <div
          onClick={handleJoinVoice}
          className="py-4 px-4 border border-dashed border-[#e6e6e6] hover:border-[#0075de]/40 hover:bg-[#f6f5f4] rounded-xl text-center cursor-pointer transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-[#f6f5f4] group-hover:bg-[#0075de]/10 flex items-center justify-center mx-auto mb-1.5 transition-colors">
            <Mic className="w-4 h-4 text-[#a39e98] group-hover:text-[#0075de]" />
          </div>
          <p className="text-xs font-semibold text-[#615d59] group-hover:text-[#0075de] transition-colors">
            ยังไม่มีใครอยู่ในสายไมค์
          </p>
          <p className="text-[11px] text-[#a39e98] mt-0.5">
            คลิกที่นี่หรือกดปุ่ม "เข้าร่วมคุยไมค์" ด้านบนเพื่อเริ่มคุยกับเพื่อนได้ทันที
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
          {activeSpeakers.map((seat) => {
            if (!seat.user) return null;
            const isMe = seat.user.id === currentUser.id;
            const isSpeakingNow = isMe
              ? localSpeaking && !isLocalMuted
              : seat.isSpeaking && !seat.isMuted;

            return (
              <div
                key={seat.user.id}
                onClick={() => {
                  if (isMe) {
                    onOpenProfile();
                  } else if (onSelectUser && seat.user) {
                    onSelectUser(seat.user);
                  }
                }}
                className={`relative flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer shadow-xs ${
                  isSpeakingNow
                    ? 'border-[#1aae39]/60 shadow-[0_0_10px_rgba(26,174,57,0.25)] bg-[#1aae39]/5'
                    : 'bg-[#f6f5f4] hover:bg-white border-[#e6e6e6]'
                }`}
                title={isMe ? 'คลิกเพื่อแก้ไขโปรไฟล์ของคุณ' : `ดูโปรไฟล์ของ ${seat.user.name}`}
              >
                {/* Avatar with Live Pulse Ring */}
                <div className="relative shrink-0 flex items-center justify-center">
                  {/* Glowing Green Voice Pulse Ring */}
                  {isSpeakingNow && (
                    <div className="absolute -inset-1 rounded-full border-2 border-[#1aae39] animate-ping pointer-events-none" />
                  )}

                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 transition-all ${
                      isSpeakingNow ? 'border-[#1aae39] scale-105' : ''
                    }`}
                    style={{
                      borderColor: isSpeakingNow ? '#1aae39' : seat.user.color || '#e6e6e6',
                    }}
                  >
                    <img
                      src={seat.user.avatar}
                      alt={seat.user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Mute badge overlay */}
                  {seat.isMuted && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 border border-white flex items-center justify-center shadow-xs">
                      <MicOff className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Speaker Info */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className="text-xs font-bold truncate max-w-[85px] sm:max-w-[120px] text-[#000000]"
                    >
                      {seat.user.name}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-[#a39e98] shrink-0">(คุณ)</span>
                    )}
                  </div>

                  {/* Status subtitle */}
                  <span className="text-[10px] text-[#615d59] flex items-center gap-1">
                    {isMe && isConnectingMic ? (
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        เปิดไมค์...
                      </span>
                    ) : isSpeakingNow ? (
                      <span className="text-[#1aae39] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1aae39] animate-pulse" />
                        กำลังพูด...
                      </span>
                    ) : seat.isMuted ? (
                      <span className="text-rose-500">ปิดไมค์</span>
                    ) : (
                      <span className="text-[#a39e98]">พร้อมพูด</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
