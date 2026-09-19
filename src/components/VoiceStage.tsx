import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, LogOut, Sparkles, Volume2, Hand, Shield, Users, CheckCircle2, XCircle, Clock } from 'lucide-react';
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
  onShowToast,
  onRequestToSpeak,
  onApproveSpeakRequest,
  onRevokeSpeakPermission,
}) => {
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [volumeRms, setVolumeRms] = useState(0);

  const analyserRef = useRef<MicrophoneAnalyser | null>(null);

  // Check if current user is sitting on one of the seats
  const mySeat = seats.find((s) => s.user?.id === currentUser.id);
  const isSitting = !!mySeat;

  const isOwner = myRole === 'owner';
  const isAdmin = myRole === 'admin';
  const isAdminOrOwner = isOwner || isAdmin;
  const isApprovedSpeaker = approvedSpeakerIds.includes(currentUser.id);
  const myPendingRequest = pendingStageRequests.find((r) => r.userId === currentUser.id);

  // Manage microphone lifecycle when sitting/leaving
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
            onShowToast('เชื่อมต่อไมโครโฟนขึ้นเวทีเรียบร้อยแล้ว 🎙️', 'success');
          })
          .catch((err) => {
            console.warn('Microphone permission error:', err);
            onShowToast('ไม่สามารถเข้าถึงไมโครโฟนได้ หรือยังไม่ได้อนุญาตสิทธิ์', 'warning');
          });
      }
    } else {
      // Clean up microphone if left stage
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

  const handleSeatClick = (seatNumber: number, seat: StageSeat) => {
    if (seat.user) {
      if (seat.user.id === currentUser.id) {
        // Click own seat -> open profile
        onOpenProfile();
      }
      return;
    }

    // Empty seat clicked
    if (stageAccessMode === 'admin_only' && !isAdminOrOwner) {
      onShowToast('ห้องนี้จำกัดการขึ้นไมค์เฉพาะ Owner และ Admin เท่านั้น 🛡️', 'warning');
      return;
    }

    if (stageAccessMode === 'approval' && !isAdminOrOwner && !isApprovedSpeaker) {
      if (myPendingRequest) {
        onShowToast('คำขอขึ้นไมค์ของคุณอยู่ระหว่างรอเจ้าของห้องอนุมัติ ⏳', 'info');
      } else {
        onRequestToSpeak?.(seatNumber);
        onShowToast(`ส่งคำขอยกมือขึ้นไมค์ที่นั่ง #${seatNumber} แล้ว รอการอนุมัติ... ✋`, 'info');
      }
      return;
    }

    onTakeSeat(seatNumber);
  };

  return (
    <div className="bg-[#151722]/80 backdrop-blur-md rounded-2xl border border-gray-800/80 p-2 sm:p-2.5 shadow-xl shrink-0">
      {/* Stage Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            เวทีไมค์ 9 ที่นั่ง
            <span className="text-[11px] font-normal text-gray-400 hidden sm:inline">
              (Live Voice Stage)
            </span>
          </h2>

          {/* Access Mode Badge */}
          {stageAccessMode === 'everyone' && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20 flex items-center gap-1">
              <Users className="w-3 h-3" /> ทุกคนขึ้นได้
            </span>
          )}
          {stageAccessMode === 'admin_only' && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-medium border border-purple-500/20 flex items-center gap-1">
              <Shield className="w-3 h-3" /> เฉพาะแอดมิน
            </span>
          )}
          {stageAccessMode === 'approval' && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20 flex items-center gap-1">
              <Hand className="w-3 h-3" /> ต้องขออนุญาต
            </span>
          )}
        </div>

        {/* Current user stage action buttons */}
        {isSitting ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleMuteToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-md ${
                isLocalMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 ring-1 ring-emerald-500/30'
              }`}
            >
              {isLocalMuted ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>เปิดไมค์</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 animate-pulse" />
                  <span>ปิดไมค์</span>
                </>
              )}
            </button>

            <button
              onClick={onLeaveSeat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">ลงจากที่นั่ง</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Request to speak / status banner for regular members in approval mode */}
            {stageAccessMode === 'approval' && !isAdminOrOwner && (
              myPendingRequest ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>ขอยกมือแล้ว (รออนุญาต...)</span>
                </div>
              ) : isApprovedSpeaker ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ได้รับอนุญาตแล้ว แตะที่นั่งเพื่อขึ้นพูด</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onRequestToSpeak?.();
                    onShowToast('ส่งคำขอยกมือขึ้นไมค์แล้ว รอเจ้าของห้องอนุญาต... ✋', 'info');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-medium shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>✋ ขอยกมือขึ้นไมค์</span>
                </button>
              )
            )}

            {stageAccessMode === 'admin_only' && !isAdminOrOwner && (
              <span className="text-[11px] text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-500/30">
                🔒 โหมดเฉพาะแอดมินขึ้นไมค์
              </span>
            )}

            {(stageAccessMode === 'everyone' || isAdminOrOwner || (stageAccessMode === 'approval' && isApprovedSpeaker)) && (
              <span className="text-[11px] text-gray-400 bg-gray-900/60 px-2.5 py-1 rounded-lg border border-gray-800">
                แตะที่นั่งว่างเพื่อขึ้นพูด 🎙️
              </span>
            )}
          </div>
        )}
      </div>

      {/* Host / Admin Pending Requests Banner */}
      {isAdminOrOwner && pendingStageRequests.length > 0 && (
        <div className="mb-2 p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
              <Hand className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-amber-300">
              มีคำขอยกมือขึ้นไมค์ ({pendingStageRequests.length} คน)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
                <span className="text-white font-medium text-[11px] truncate max-w-[100px]">
                  {req.user.name}
                </span>
                {req.requestedSeatNumber && (
                  <span className="text-[10px] text-amber-400 font-bold">
                    #{req.requestedSeatNumber}
                  </span>
                )}
                <div className="flex items-center gap-1 ml-1">
                  <button
                    onClick={() => onApproveSpeakRequest?.(req.userId, true, req.requestedSeatNumber)}
                    title="อนุมัติให้ขึ้นไมค์"
                    className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button
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

      {/* 9-Seat Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 sm:gap-3">
        {seats.map((seat) => {
          const isMe = seat.user?.id === currentUser.id;
          const isOccupied = !!seat.user;
          // Determine if speaking: if it's current user, use local live analyser; if peer, use seat.isSpeaking
          const isSpeakingNow = isMe ? localSpeaking && !isLocalMuted : seat.isSpeaking && !seat.isMuted;

          return (
            <div
              key={seat.seatNumber}
              onClick={() => handleSeatClick(seat.seatNumber, seat)}
              className={`relative flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl transition-all cursor-pointer select-none group ${
                isOccupied
                  ? 'bg-[#1a1d2d]/90 border border-gray-700/60 hover:border-gray-600'
                  : 'bg-[#12141d]/60 border border-dashed border-gray-800 hover:border-purple-500/50 hover:bg-purple-500/5'
              }`}
            >
              {/* Seat Number Tag */}
              <span className="absolute top-0.5 left-1.5 text-[8px] sm:text-[9px] font-bold text-gray-400 group-hover:text-gray-300">
                #{seat.seatNumber}
              </span>

              {/* Avatar Container with Voice Ripple Effect */}
              <div className="relative mt-1 mb-1 flex items-center justify-center">
                {/* Glowing Green Voice Ripple Ring */}
                {isSpeakingNow && (
                  <div className="absolute inset-0 -m-1.5 rounded-full border-2 border-emerald-400/90 animate-ping pointer-events-none" />
                )}
                {isSpeakingNow && (
                  <div className="absolute inset-0 -m-1 rounded-full bg-emerald-400/20 blur-[3px] pointer-events-none" />
                )}

                {/* Avatar circle */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center transition-transform border-2 ${
                    isSpeakingNow
                      ? 'scale-105 shadow-[0_0_15px_rgba(52,211,153,0.7)]'
                      : isOccupied
                      ? ''
                      : 'border-dashed border-gray-700/60 group-hover:scale-105 group-hover:border-purple-500/60'
                  }`}
                  style={{
                    borderColor: isSpeakingNow ? '#34d399' : seat.user?.color || '#374151',
                  }}
                >
                  {isOccupied && seat.user ? (
                    <img
                      src={seat.user.avatar}
                      alt={seat.user.name}
                      className="w-full h-full object-cover bg-gray-900"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#0f1118] flex flex-col items-center justify-center text-gray-500 group-hover:text-purple-400 transition-colors">
                      <Mic className="w-4 h-4 mb-0.5 opacity-60 group-hover:opacity-100" />
                      <span className="text-[9px] font-medium leading-none">ว่าง</span>
                    </div>
                  )}
                </div>

                {/* Microphone Status Badge for occupied seats */}
                {isOccupied && (
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-md ${
                      (isMe ? isLocalMuted : seat.isMuted)
                        ? 'bg-rose-500 text-white'
                        : isSpeakingNow
                        ? 'bg-emerald-500 text-white animate-pulse'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {(isMe ? isLocalMuted : seat.isMuted) ? (
                      <MicOff className="w-2.5 h-2.5" />
                    ) : (
                      <Mic className="w-2.5 h-2.5" />
                    )}
                  </div>
                )}
              </div>

              {/* User Name & Tag */}
              <div className="w-full text-center px-1">
                {isOccupied && seat.user ? (
                  <p
                    className="text-[11px] font-semibold text-gray-200 truncate w-full"
                    title={seat.user.name}
                  >
                    {isMe ? `${seat.user.name} (คุณ)` : seat.user.name}
                  </p>
                ) : (
                  <span className="text-[10px] text-gray-400 group-hover:text-gray-300">
                    ขึ้นไมค์
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
