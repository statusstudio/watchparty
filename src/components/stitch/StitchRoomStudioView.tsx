import React, { useState } from 'react';
import { RoomMetadata, RoomMember, ChatMessage, PlaylistItem, UserProfile } from '../../types/index.js';

interface StitchRoomStudioViewProps {
  roomId: string;
  roomMetadata: RoomMetadata;
  members: RoomMember[];
  currentUser: UserProfile;
  playlist: PlaylistItem[];
  currentTrack?: PlaylistItem | null;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onBackToExplore: () => void;
  onOpenLiveStage: () => void;
  onAddSong: (url: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkipNext: () => void;
}

export const StitchRoomStudioView: React.FC<StitchRoomStudioViewProps> = ({
  roomId,
  roomMetadata,
  members,
  currentUser,
  playlist,
  currentTrack,
  chatMessages,
  onSendMessage,
  onBackToExplore,
  onOpenLiveStage,
  onAddSong,
  isPlaying,
  onTogglePlay,
  onSkipNext,
}) => {
  const [songUrlInput, setSongUrlInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [volume, setVolume] = useState(80);
  const [activeTab, setActiveTab] = useState<'chat' | 'queue' | 'members'>('chat');

  const handleAddSongSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songUrlInput.trim()) return;
    onAddSong(songUrlInput.trim());
    setSongUrlInput('');
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const nowPlayingTitle = currentTrack?.title || 'Lofi Hip Hop Radio – beats to relax/study to';
  const nowPlayingArtist = currentTrack?.addedBy || 'ChilledCow Records';
  const nowPlayingThumb = currentTrack?.thumbnail || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA07nQxs20DzMGwnguuZbvY6Z2TlKOi098ud5QwNH5NjmOSOrVSyW3vVMHJQTwA32gad2Wg3EBsraor8kb8wk_6UCA49kZx6xUze-uYOTgQZ1nz2mQ-JbTNl6e0dxP8Z6ynlRzuW-wUZ0hbevMVEArKu6Bo-8ZUG8cQyY46T0fnwMfOopeqVC6fLpx6EKNY_0mhkSEByfAfzkccvjryRygiwYmve7PA45Mn__kpUVF9IrUo0C4sfAbI';

  return (
    <div className="flex h-screen w-screen dark:bg-[#111319] dark:text-[#e2e2ea] bg-[#faf8ff] text-[#131b2e] overflow-hidden select-none transition-colors duration-300">
      {/* Left Sidebar (From Stitch Screen 4) */}
      <aside className="hidden md:flex flex-col justify-between w-64 dark:bg-[#191b22] dark:border-white/[0.06] bg-white border-r border-[#dae2fd] p-4 z-30 transition-colors duration-300">
        <div className="flex flex-col gap-6">
          {/* Studio Brand */}
          <div className="flex items-center gap-3 px-2">
            <span className="w-9 h-9 rounded-xl bg-[#0075de] flex items-center justify-center text-white shadow-[0_0_16px_rgba(0,117,222,0.45)]">
              <span className="material-symbols-outlined text-[22px]">graphic_eq</span>
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-lg dark:text-[#e2e2ea] text-[#131b2e] tracking-tight leading-tight">
                Pleng<span className="dark:text-[#00daf3] text-[#006194]">.online</span>
              </span>
              <span className="font-mono text-[10px] dark:text-[#94A3B8] text-[#64748b] uppercase">Studio Room</span>
            </div>
          </div>

          {/* Sync Latency Indicator */}
          <div className="p-3 rounded-xl dark:bg-[#1d1f26] dark:border-white/[0.04] bg-[#eaedff] border border-[#dae2fd] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
              <div className="flex flex-col">
                <span className="font-mono text-xs dark:text-[#e2e2ea] text-[#131b2e] font-bold">SYNCED</span>
                <span className="font-mono text-[10px] dark:text-[#00daf3] text-[#006194] font-bold">24ms Latency</span>
              </div>
            </div>
            <span className="material-symbols-outlined dark:text-[#94A3B8] text-[#707881] text-[18px]">wifi_tethering</span>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'chat'
                  ? 'bg-[#0075de] text-white font-bold shadow-md'
                  : 'dark:text-[#c1c6d5] text-[#475569] dark:hover:bg-[#282a30] hover:bg-[#eaedff] dark:hover:text-white hover:text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">radio</span>
              <span>Live Stage</span>
            </button>

            <button
              onClick={onBackToExplore}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-[#c1c6d5] text-[#475569] dark:hover:bg-[#282a30] hover:bg-[#eaedff] dark:hover:text-white hover:text-[#131b2e] font-semibold text-sm transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">explore</span>
              <span>Explore Rooms</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'queue'
                  ? 'bg-[#0075de] text-white font-bold shadow-md'
                  : 'dark:text-[#c1c6d5] text-[#475569] dark:hover:bg-[#282a30] hover:bg-[#eaedff] dark:hover:text-white hover:text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">queue_music</span>
              <span>Queue ({playlist.length})</span>
            </button>

            <button
              onClick={onOpenLiveStage}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-[#00daf3] text-[#006194] dark:hover:bg-[#282a30] hover:bg-[#eaedff] font-semibold text-sm transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">mic</span>
              <span>Voice Stage Room</span>
            </button>
          </nav>
        </div>

        {/* DJ Controller User Info */}
        <div className="p-3 rounded-xl dark:bg-[#282a30] bg-[#f2f3ff] flex items-center gap-3 border dark:border-white/[0.04] border-[#dae2fd]">
          <div className="w-9 h-9 rounded-full bg-[#dc9100] flex items-center justify-center text-white font-bold text-xs">
            DJ
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs dark:text-[#e2e2ea] text-[#131b2e] truncate">{currentUser.name}</span>
            <span className="font-mono text-[10px] text-[#ffb955]">Room Host</span>
          </div>
        </div>
      </aside>

      {/* Main Studio Work Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar with YouTube input */}
        <header className="h-16 dark:bg-[#111319]/90 bg-[#faf8ff]/90 border-b dark:border-white/[0.06] border-[#dae2fd] backdrop-blur-md flex items-center justify-between px-6 z-20 transition-colors">
          <form onSubmit={handleAddSongSubmit} className="flex-1 max-w-lg">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 dark:text-[#94A3B8] text-[#707881] text-[18px]">
                link
              </span>
              <input
                type="text"
                value={songUrlInput}
                onChange={(e) => setSongUrlInput(e.target.value)}
                placeholder="วางลิงก์ YouTube เพื่อเล่นเพลงพร้อมเพื่อน..."
                className="w-full pl-9 pr-20 py-2 rounded-xl dark:bg-[#1d1f26] dark:border-white/[0.06] dark:text-[#e2e2ea] bg-white border border-[#dae2fd] text-[#131b2e] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#0075de] shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0075de] text-white text-xs font-bold hover:brightness-110 shadow-sm"
              >
                เพิ่ม
              </button>
            </div>
          </form>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full dark:bg-[#1d1f26] bg-[#eaedff] border dark:border-transparent border-[#dae2fd] text-xs font-mono">
              <span className="material-symbols-outlined text-[#06B6D4] text-[16px]">group</span>
              <span className="dark:text-[#e2e2ea] text-[#131b2e] font-bold">{members.length || 18}</span>
              <span className="dark:text-[#94A3B8] text-[#64748b]">listeners</span>
            </div>

            <button
              onClick={onBackToExplore}
              className="px-3 py-1.5 rounded-full dark:bg-[#282a30] dark:hover:bg-[#373940] dark:text-[#c1c6d5] dark:hover:text-white bg-white border border-[#dae2fd] text-[#131b2e] hover:bg-[#eaedff] text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>ออกห้อง</span>
            </button>
          </div>
        </header>

        {/* Room Header Strip */}
        <div className="px-6 py-3 bg-[#191b22] border-b border-white/[0.04] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[#e2e2ea] flex items-center gap-2">
              {roomMetadata.name}
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-[#0075de]/20 text-[#a8c8ff] font-mono text-[10px] uppercase font-bold">
              ⚡ Ultra-low latency synced
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1d1f26] px-3 py-1.5 rounded-xl border border-white/[0.04]">
              <span className="material-symbols-outlined text-[#94A3B8] text-[18px]">volume_up</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 sm:w-28 h-1 bg-[#33343b] rounded-lg appearance-none cursor-pointer accent-[#0075de]"
              />
              <span className="font-mono text-xs text-[#94A3B8] w-8 text-right">{volume}%</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Player Left (7 cols) + Chat/Queue Right (5 cols) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 md:p-6 overflow-y-auto">
          {/* Left Column: Synced Visual Player */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <div className="relative w-full rounded-2xl overflow-hidden bg-[#0c0e14] border border-white/[0.06] shadow-2xl aspect-video flex flex-col justify-between group">
              <img
                src={nowPlayingThumb}
                alt="Now Playing"
                className="absolute inset-0 w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-700 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-transparent to-black/40"></div>

              {/* Stream Badges */}
              <div className="relative z-10 flex items-center justify-between p-4">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#10B981] font-mono text-xs flex items-center gap-1.5 font-bold shadow-md">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                  STREAM SYNCED
                </span>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[11px]">
                    1080p60
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#0075de]/90 text-white font-mono text-[11px] font-bold">
                    320Kbps HD
                  </span>
                </div>
              </div>

              {/* Center Equalizer Waveform */}
              <div className="relative z-10 flex items-end justify-center gap-1.5 h-10 opacity-75 my-auto pointer-events-none">
                <div className="w-1.5 bg-[#00daf3] rounded-full animate-pulse h-4" />
                <div className="w-1.5 bg-[#a8c8ff] rounded-full animate-bounce h-8" />
                <div className="w-1.5 bg-[#06B6D4] rounded-full animate-pulse h-6" />
                <div className="w-1.5 bg-[#00daf3] rounded-full animate-bounce h-10" />
                <div className="w-1.5 bg-[#ffb955] rounded-full animate-pulse h-5" />
                <div className="w-1.5 bg-[#00daf3] rounded-full animate-bounce h-7" />
                <div className="w-1.5 bg-[#a8c8ff] rounded-full animate-pulse h-3" />
              </div>

              {/* Player Bottom Bar & Controls */}
              <div className="relative z-10 p-4 pt-0 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-4">
                    <span className="font-mono text-[10px] text-[#00daf3] uppercase tracking-wider font-bold">
                      NOW PLAYING
                    </span>
                    <h2 className="text-lg md:text-xl font-bold text-white truncate drop-shadow-md">
                      {nowPlayingTitle}
                    </h2>
                    <p className="text-xs text-[#94A3B8]">{nowPlayingArtist}</p>
                  </div>

                  {/* Play / Next Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onTogglePlay}
                      className="w-10 h-10 rounded-full bg-[#0075de] hover:bg-[#00daf3] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[24px]">
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                    <button
                      onClick={onSkipNext}
                      className="w-9 h-9 rounded-full bg-[#282a30] hover:bg-[#373940] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">skip_next</span>
                    </button>
                  </div>
                </div>

                {/* Progress Scrubber */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#06B6D4]">02:45</span>
                  <div className="relative flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-[65%] bg-gradient-to-r from-[#0075de] via-[#06B6D4] to-[#00daf3] rounded-full"></div>
                  </div>
                  <span className="font-mono text-xs text-[#94A3B8]">04:15</span>
                </div>
              </div>
            </div>

            {/* Quick Action Reactions */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#191b22] border border-white/[0.04]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#c1c6d5]">ส่งอีโมจิสด:</span>
                {['🔥', '❤️', '👏', '🎉', '💃', '🚀'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onSendMessage(emoji)}
                    className="w-8 h-8 rounded-full bg-[#282a30] hover:bg-[#373940] flex items-center justify-center text-sm transition-transform hover:scale-125 active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                onClick={onOpenLiveStage}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#00daf3]/20 to-[#0075de]/20 border border-[#00daf3]/40 text-[#00daf3] text-xs font-bold flex items-center gap-1.5 hover:brightness-125 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">mic</span>
                <span>เปิดหน้าจอ Voice Stage</span>
              </button>
            </div>
          </div>

          {/* Right Column: Realtime Chat & Queue Tabs */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full bg-[#191b22] rounded-2xl border border-white/[0.06] overflow-hidden">
            {/* Tabs Header */}
            <div className="flex items-center border-b border-white/[0.06] bg-[#1d1f26]">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'text-[#00daf3] border-b-2 border-[#00daf3] bg-[#282a30]/50'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>แชตสด ({chatMessages.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('queue')}
                className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'queue'
                    ? 'text-[#00daf3] border-b-2 border-[#00daf3] bg-[#282a30]/50'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">queue_music</span>
                <span>คิวเพลง ({playlist.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'members'
                    ? 'text-[#00daf3] border-b-2 border-[#00daf3] bg-[#282a30]/50'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">group</span>
                <span>ผู้ฟัง ({members.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2">
              {activeTab === 'chat' && (
                <>
                  <div className="flex-1 flex flex-col gap-2">
                    {chatMessages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-[#94A3B8] text-xs py-10">
                        <span className="material-symbols-outlined text-[32px] mb-1 opacity-50">forum</span>
                        <span>ยังไม่มีข้อความ ทักทายเพื่อนในห้องได้เลย!</span>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="font-bold text-[#a8c8ff] shrink-0">
                            {msg.sender?.name || (msg as any).user?.name || 'User'}:
                          </span>
                          <span className="text-[#e2e2ea] break-words">{msg.text}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleChatSubmit} className="pt-2 border-t border-white/[0.06] flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="พิมพ์ข้อความคุยกับเพื่อน..."
                      className="flex-1 px-3 py-2 rounded-xl bg-[#0c0e14] border border-white/[0.06] text-xs text-[#e2e2ea] focus:outline-none focus:ring-1 focus:ring-[#0075de]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-[#0075de] hover:bg-[#00daf3] text-white font-bold text-xs transition-all flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                  </form>
                </>
              )}

              {activeTab === 'queue' && (
                <div className="flex flex-col gap-2">
                  {playlist.length === 0 ? (
                    <div className="text-center text-xs text-[#94A3B8] py-8">
                      คิวเพลงว่างอยู่ วางลิงก์ YouTube ด้านบนเพื่อเพิ่มเพลง
                    </div>
                  ) : (
                    playlist.map((track, i) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-[#1d1f26] border border-white/[0.04]"
                      >
                        <span className="font-mono text-[10px] text-[#94A3B8] w-4">{i + 1}</span>
                        <img src={track.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#e2e2ea] truncate">{track.title}</p>
                          <p className="text-[10px] text-[#94A3B8]">เพิ่มโดย {track.addedBy}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'members' && (
                <div className="flex flex-col gap-2">
                  {members.map((m) => (
                    <div
                      key={m.user.id}
                      className="flex items-center gap-2 p-2 rounded-xl bg-[#1d1f26] border border-white/[0.04]"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#0075de] flex items-center justify-center text-xs font-bold text-white">
                        {m.user.name?.[0] || 'U'}
                      </div>
                      <span className="text-xs font-semibold text-[#e2e2ea]">{m.user.name}</span>
                      {m.role === 'owner' && (
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#dc9100]/20 text-[#ffb955] font-bold">
                          Host 👑
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
