import React, { useState } from 'react';
import { UserProfile, StageSeat } from '../../types/index.js';

interface StitchLiveStageViewProps {
  onBack: () => void;
  currentUser: UserProfile;
  listenersCount?: number;
  theme?: 'dark' | 'light';
}

export const StitchLiveStageView: React.FC<StitchLiveStageViewProps> = ({
  onBack,
  currentUser,
  listenersCount = 14,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [isMicOn, setIsMicOn] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [reactions, setReactions] = useState<{ id: number; emoji: string }[]>([]);

  // 9 Voice Seats (matching the Stitch design)
  const [seats, setSeats] = useState<StageSeat[]>([
    {
      seatNumber: 1,
      user: { id: 'dj-1', name: 'DJ Panda 👑', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', color: '#ffb955' },
      isMuted: false,
      isSpeaking: true,
    },
    {
      seatNumber: 2,
      user: { id: 'sp-2', name: 'GuitarBoy 🎸', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100', color: '#00daf3' },
      isMuted: true,
      isSpeaking: false,
    },
    {
      seatNumber: 3,
      user: { id: 'sp-3', name: 'Mew Vocalist 🎤', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', color: '#a8c8ff' },
      isMuted: false,
      isSpeaking: true,
    },
    { seatNumber: 4, user: null, isMuted: true, isSpeaking: false },
    { seatNumber: 5, user: null, isMuted: true, isSpeaking: false },
    { seatNumber: 6, user: null, isMuted: true, isSpeaking: false },
    { seatNumber: 7, user: null, isMuted: true, isSpeaking: false },
    { seatNumber: 8, user: null, isMuted: true, isSpeaking: false },
    { seatNumber: 9, user: null, isMuted: true, isSpeaking: false },
  ]);

  const handleTakeSeat = (seatNum: number) => {
    setSeats((prev) =>
      prev.map((s) =>
        s.seatNumber === seatNum && !s.user
          ? { ...s, user: currentUser, isMuted: !isMicOn, isSpeaking: false }
          : s
      )
    );
  };

  const handleSendReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    setReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col relative select-none pb-28 transition-colors duration-300 ${
      isLight ? 'bg-[#faf8ff] text-[#131b2e]' : 'bg-[#111319] text-[#e2e2ea]'
    }`}>
      {/* Ambient Radial Glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[350px] bg-gradient-to-b blur-3xl pointer-events-none -z-10 ${
        isLight ? 'from-[#0075de]/10 via-[#00daf3]/5 to-transparent' : 'from-[#0075de]/20 via-[#00daf3]/10 to-transparent'
      }`} />

      {/* Floating Reaction Bubbles Animation */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-24 right-10 text-3xl animate-float-up pointer-events-none"
            style={{ right: `${20 + Math.random() * 60}px` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top Header */}
      <header className={`fixed top-0 inset-x-0 h-16 backdrop-blur-xl border-b z-40 px-4 md:px-8 flex items-center justify-between transition-colors ${
        isLight ? 'bg-[#faf8ff]/90 border-[#dae2fd]' : 'bg-[#111319]/80 border-white/[0.06]'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm border ${
              isLight ? 'bg-white border-[#dae2fd] text-[#131b2e]' : 'bg-[#1d1f26] border-white/10 text-[#e2e2ea]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div>
            <h1 className={`font-bold text-base md:text-lg ${isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'}`}>Live Stage Room</h1>
            <p className={`text-[11px] font-mono ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>Audio Stage · Hi-Fi WebRTC Voice</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSendReaction('🎉')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm border ${
              isLight ? 'bg-white border-[#dae2fd] text-[#006194]' : 'bg-[#1d1f26] border-white/10 text-[#00daf3]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 max-w-4xl mx-auto w-full px-4 flex flex-col gap-5">
        {/* Live Info Strip */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
            </span>
            <span className="font-mono text-xs text-[#10B981] font-bold tracking-wider">LIVE STAGE</span>
            <span className={`text-xs ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>· 👥 {listenersCount} คนกำลังฟัง</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-[11px] font-bold ${
            isLight ? 'bg-[#eaedff] border-[#dae2fd] text-[#006194]' : 'bg-[#1d1f26] border-white/[0.04] text-[#00daf3]'
          }`}>
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            <span>Ultra-low latency</span>
          </div>
        </div>

        {/* Visual Synchronized Audio Stage Card */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-[#0c0e14] border border-white/[0.06] shadow-2xl aspect-video flex flex-col justify-between group">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDc1EaxECW5yWpBKLbTEqeilATKJ0HfDpBvJ74UPwlQbKS4DyahK8KTdZG8KOpHfUGMuKdgCxi0t99LVhHa8eyM87Iineqz13mv1qKUaoo5IAPRoMlapc66OWnPlX5u58XnzVnp25vPs4woPdnefLQidvbqh0igtdYiZVXREG-qqIJVqUOOT3_-FbHUtba-y-05roXD4Yv_16vely7zMVVYw6EBfkwOBF9ajUj3bA1pP9hrfifl6VBP"
            alt="Stage Visualizer"
            className="absolute inset-0 w-full h-full object-cover opacity-70 transform group-hover:scale-102 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-black/20 to-transparent"></div>

          {/* Holographic Sound Waveforms */}
          <div className="relative z-10 flex items-end justify-center gap-2 h-14 my-auto pointer-events-none opacity-85">
            <div className="w-2 bg-[#00daf3] rounded-full animate-bounce h-6"></div>
            <div className="w-2 bg-[#a8c8ff] rounded-full animate-pulse h-10"></div>
            <div className="w-2 bg-[#06B6D4] rounded-full animate-bounce h-14"></div>
            <div className="w-2 bg-[#ffb955] rounded-full animate-pulse h-8"></div>
            <div className="w-2 bg-[#10B981] rounded-full animate-bounce h-12"></div>
            <div className="w-2 bg-[#00daf3] rounded-full animate-pulse h-5"></div>
            <div className="w-2 bg-[#a8c8ff] rounded-full animate-bounce h-9"></div>
          </div>

          <div className="relative z-10 p-4 flex items-center justify-between bg-black/60 backdrop-blur-md border-t border-white/[0.06]">
            <div>
              <p className="font-bold text-sm text-white">Lofi Hip Hop Radio - beats to relax/study</p>
              <p className="text-xs text-[#94A3B8]">ChilledCow Records · 24/7 Live Stream</p>
            </div>
            <span className="font-mono text-xs text-[#00daf3] font-bold">LIVE ON STAGE</span>
          </div>
        </div>

        {/* 9 Speaker Seats (From Stitch Screen 6) */}
        <section className={`rounded-2xl p-5 shadow-lg border transition-colors ${
          isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.06]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'}`}>
              <span className={`material-symbols-outlined text-[20px] ${isLight ? 'text-[#006194]' : 'text-[#00daf3]'}`}>mic</span>
              <span>เวทีคุยสด 9 ที่นั่ง (Speakers Stage)</span>
            </h2>
            <span className={`text-xs ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>คลิกที่นั่งว่างเพื่อขึ้นพูด</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-4">
            {seats.map((seat) => (
              <div
                key={seat.seatNumber}
                onClick={() => !seat.user && handleTakeSeat(seat.seatNumber)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  seat.user
                    ? isLight ? 'bg-[#f8f9fe] border-[#dae2fd]' : 'bg-[#1d1f26] border-white/[0.06]'
                    : isLight
                      ? 'bg-[#f2f3ff]/60 border-dashed border-[#dae2fd] hover:border-[#0075de] hover:bg-[#eaedff] cursor-pointer'
                      : 'bg-[#111319]/50 border-dashed border-white/[0.1] hover:border-[#00daf3] hover:bg-[#1d1f26] cursor-pointer'
                }`}
              >
                {seat.user ? (
                  <div className="relative">
                    <img
                      src={
                        seat.user.avatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                      }
                      alt={seat.user.name}
                      className={`w-14 h-14 rounded-full object-cover border-2 ${
                        seat.isSpeaking ? 'border-[#10B981] animate-pulse ring-4 ring-[#10B981]/30' : 'border-white/10'
                      }`}
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-[12px] shadow-md ${
                        seat.isMuted ? 'bg-[#ffb4ab] text-[#690005]' : 'bg-[#10B981]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {seat.isMuted ? 'mic_off' : 'mic'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center group-hover:text-white ${
                    isLight ? 'bg-[#eaedff] text-[#707881]' : 'bg-[#282a30] text-[#94A3B8]'
                  }`}>
                    <span className="material-symbols-outlined text-[24px]">add</span>
                  </div>
                )}

                <span className={`text-xs font-semibold mt-2 truncate max-w-[90px] ${
                  isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'
                }`}>
                  {seat.user ? seat.user.name : `ที่นั่ง ${seat.seatNumber}`}
                </span>
                <span className={`text-[10px] ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>
                  {seat.user ? (seat.isSpeaking ? 'กำลังพูด...' : 'เปิดไมค์') : 'กดเพื่อขึ้นพูด'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Floating Bottom Action Dock (Screen 6) */}
      <div className="fixed bottom-4 inset-x-0 flex items-center justify-center px-4 z-40 pointer-events-none">
        <div className={`flex items-center gap-3 px-5 py-3 rounded-full border backdrop-blur-2xl shadow-xl pointer-events-auto transition-colors ${
          isLight ? 'bg-white/95 border-[#dae2fd]' : 'bg-[#1d1f26]/95 border-white/[0.1] shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
        }`}>
          {/* Mic Toggle Button */}
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all shadow-lg active:scale-90 ${
              isMicOn
                ? 'bg-[#10B981] text-white shadow-[#10B981]/40'
                : 'bg-[#ffb4ab] text-[#690005] shadow-[#ffb4ab]/30'
            }`}
            title={isMicOn ? 'ปิดไมค์' : 'เปิดไมค์'}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isMicOn ? 'mic' : 'mic_off'}
            </span>
          </button>

          {/* Raise Hand Button */}
          <button
            onClick={() => {
              setIsHandRaised(!isHandRaised);
              handleSendReaction(isHandRaised ? '🖐️' : '✋');
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isHandRaised ? 'bg-[#ffb955] text-[#291800] font-bold' : 'dark:bg-[#282a30] dark:text-[#e2e2ea] bg-[#f2f3ff] text-[#131b2e]'
            }`}
            title="ยกมือขอขึ้นพูด"
          >
            <span className="material-symbols-outlined text-[24px]">pan_tool</span>
          </button>

          {/* Reaction Triggers */}
          {['❤️', '🔥', '👏', '🎵'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              className="w-10 h-10 rounded-full dark:bg-[#282a30] dark:hover:bg-[#373940] bg-[#f2f3ff] hover:bg-[#eaedff] flex items-center justify-center text-lg active:scale-90 transition-transform shadow-sm"
            >
              {emoji}
            </button>
          ))}

          {/* Leave Stage / Back Button */}
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-full bg-[#ffb4ab]/20 text-[#ba1a1a] dark:text-[#ffb4ab] hover:bg-[#ffb4ab] hover:text-[#690005] text-xs font-bold transition-all ml-1"
          >
            ลงจากเวที
          </button>
        </div>
      </div>
    </div>
  );
};
