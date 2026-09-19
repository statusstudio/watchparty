import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Volume2,
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
}) => {
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [volumeRms, setVolumeRms] = useState(0);

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
            onLocalStreamReady(stream);
            onShowToast('เชื่อมต่อไมโครโฟนเรียบร้อยแล้ว 🎙️', 'success');
          })
          .catch((err) => {
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
    <div className="bg-[#13141c]/90 backdrop-blur-md rounded-2xl border border-gray-800/80 p-3 shadow-xl shrink-0 transition-all">
      {/* Header & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-800/70">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            <span>ห้องคุยไมค์สด</span>
            <span className="text-[11px] font-normal text-gray-400 hidden sm:inline">
              (Open Voice)
            </span>
          </h2>

          {/* Active Voice Count Badge */}
          <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 text-[10px] font-medium border border-violet-500/20 flex items-center gap-1">
            <Radio className="w-3 h-3 text-violet-400 animate-pulse" />
            <span>{activeSpeakers.length} คนในสาย</span>
          </span>

          {/* Mode Pill */}
          {stageAccessMode === 'everyone' && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20 hidden md:flex items-center gap-1">
              <Users className="w-3 h-3" /> ทุกคนเปิดไมค์ได้
            </span>
          )}
          {stageAccessMode === 'admin_only' && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-medium border border-purple-500/20 hidden md:flex items-center gap-1">
              <Shield className="w-3 h-3" /> เฉพาะแอดมิน
            </span>
          )}
          {stageAccessMode === 'approval' && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20 hidden md:flex items-center gap-1">
              <Hand className="w-3 h-3" /> ต้องขออนุมัติ
            </span>
          )}
        </div>

        {/* Action Controls Dock (Join / Mute / Leave) */}
        <div className="flex items-center gap-2">
          {isSitting ? (
            <>
              {/* Mic Mute / Unmute Button */}
              <button
                type="button"
                onClick={handleMuteToggle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md ${
                  isLocalMuted
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 ring-1 ring-emerald-500/30'
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-800/80 hover:bg-rose-600/20 hover:text-rose-400 text-gray-300 border border-gray-700 hover:border-rose-500/40 transition-colors cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">ออกจากสาย</span>
              </button>
            </>
          ) : (
            <>
              {stageAccessMode === 'approval' && !isAdminOrOwner && !isApprovedSpeaker ? (
                myPendingRequest ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-pulse font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>ขอยกมือแล้ว (รออนุมัติ...)</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleJoinVoice}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                  >
                    <Hand className="w-3.5 h-3.5" />
                    <span>ขอยกมือเปิดไมค์</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleJoinVoice}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold shadow-lg shadow-violet-600/25 transition-all cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 animate-pulse" />
                  <span>เข้าร่วมคุยไมค์</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Host / Admin Pending Requests Notice */}
      {isAdminOrOwner && pendingStageRequests.length > 0 && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Hand className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">
              มีคำขอยกมือเปิดไมค์ ({pendingStageRequests.length} คน)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {pendingStageRequests.map((req) => (
              <div
                key={req.userId}
                className="flex items-center gap-2 bg-[#0f1118] px-2.5 py-1 rounded-lg border border-amber-500/40 text-xs shadow-sm"
              >
                <img
                  src={req.user.avatar}
                  alt={req.user.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-white font-medium text-[11px] truncate max-w-[90px]">
                  {req.user.name}
                </span>
                <div className="flex items-center gap-1 ml-1">
                  <button
                    type="button"
                    onClick={() => onApproveSpeakRequest?.(req.userId, true)}
                    title="อนุมัติให้เปิดไมค์"
                    className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onApproveSpeakRequest?.(req.userId, false)}
                    title="ปฏิเสธคำขอ"
                    className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Active Speakers Grid (No fixed 9 seats limit!) */}
      {activeSpeakers.length === 0 ? (
        <div
          onClick={handleJoinVoice}
          className="py-4 px-4 border border-dashed border-gray-800 hover:border-violet-500/40 hover:bg-violet-500/5 rounded-xl text-center cursor-pointer transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-gray-800/80 group-hover:bg-violet-600/20 flex items-center justify-center mx-auto mb-1.5 transition-colors">
            <Mic className="w-4 h-4 text-gray-500 group-hover:text-violet-400" />
          </div>
          <p className="text-xs font-semibold text-gray-400 group-hover:text-violet-300 transition-colors">
            ยังไม่มีใครอยู่ในสายไมค์
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
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
                className={`relative flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-[#171824]/80 border transition-all cursor-pointer ${
                  isSpeakingNow
                    ? 'border-emerald-500/60 shadow-[0_0_12px_rgba(52,211,153,0.3)] bg-emerald-950/20'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
                title={isMe ? 'คลิกเพื่อแก้ไขโปรไฟล์ของคุณ' : `ดูโปรไฟล์ของ ${seat.user.name}`}
              >
                {/* Avatar with Live Pulse Ring */}
                <div className="relative shrink-0 flex items-center justify-center">
                  {/* Glowing Green Voice Pulse Ring */}
                  {isSpeakingNow && (
                    <div className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping pointer-events-none" />
                  )}
                  {isSpeakingNow && (
                    <div className="absolute -inset-0.5 rounded-full bg-emerald-400/30 blur-[2px] pointer-events-none" />
                  )}

                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 transition-all ${
                      isSpeakingNow ? 'border-emerald-400 scale-105' : ''
                    }`}
                    style={{
                      borderColor: isSpeakingNow ? '#34d399' : seat.user.color,
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
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 border border-[#13141c] flex items-center justify-center shadow-sm">
                      <MicOff className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Speaker Info */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className="text-xs font-bold truncate max-w-[85px] sm:max-w-[120px]"
                      style={{ color: seat.user.color }}
                    >
                      {seat.user.name}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-gray-500 shrink-0">(คุณ)</span>
                    )}
                  </div>

                  {/* Status subtitle */}
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    {isSpeakingNow ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        กำลังพูด...
                      </span>
                    ) : seat.isMuted ? (
                      <span className="text-rose-400">ปิดไมค์</span>
                    ) : (
                      <span className="text-gray-500">พร้อมพูด</span>
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
