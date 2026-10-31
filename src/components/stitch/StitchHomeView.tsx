import React, { useState } from 'react';
import { RoomSummary, UserProfile } from '../../types/index.js';

interface StitchHomeViewProps {
  rooms: RoomSummary[];
  currentUser: UserProfile;
  onSelectRoom: (roomId: string) => void;
  onOpenCreateRoom: () => void;
  onOpenRoomCodeModal: () => void;
  theme?: 'dark' | 'light';
}

export const StitchHomeView: React.FC<StitchHomeViewProps> = ({
  rooms,
  currentUser,
  onSelectRoom,
  onOpenCreateRoom,
  onOpenRoomCodeModal,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVinylPlaying, setIsVinylPlaying] = useState<boolean>(true);
  const [isRoomsSheetOpen, setIsRoomsSheetOpen] = useState<boolean>(false);

  // Favorites tracking with localStorage
  const [favoriteRoomIds, setFavoriteRoomIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`fav_rooms_${currentUser?.id || 'guest'}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  const handleToggleFavoriteRoom = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    setFavoriteRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      localStorage.setItem(`fav_rooms_${currentUser?.id || 'guest'}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const categories = [
    { id: 'all', label: 'ทั้งหมด', icon: 'auto_awesome', count: rooms.length || 14 },
    { id: 'lofi', label: 'Lofi / Chill', icon: 'coffee', count: 4 },
    { id: 'tpop', label: 'T-Pop / K-Pop', icon: 'music_note', count: 8 },
    { id: 'rock', label: 'Rock / Indie', icon: 'electric_guitar', count: 3 },
    { id: 'acoustic', label: 'Acoustic', icon: 'nightlight', count: 2 },
  ];

  // Fallback demo rooms if server room list is empty
  const displayRooms: RoomSummary[] = rooms.length > 0 ? rooms : [
    {
      id: 'squad-chill',
      name: 'Squad Chill & Lofi Beats 🎵',
      description: 'ห้องปาร์ตี้หลัก ฟังเพลงชิลล์ๆ คุยงานและเล่นเกม',
      isPrivate: false,
      hasPassword: false,
      ownerId: 'host-1',
      ownerName: 'DJ Panda',
      onlineCount: 24,
      category: 'lofi' as any,
      currentVideo: {
        videoId: 'jfKfPfyJRdk',
        title: 'Lofi Hip Hop Radio – beats to relax/study to',
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      },
      createdAt: Date.now(),
    },
    {
      id: 'tpop-hits',
      name: 'T-POP Hits 2026 Non-Stop 🇹🇭',
      description: 'รวมเพลงฮิตติดชาร์ตไทย ฟังต่อเนื่องเพลินๆ',
      isPrivate: false,
      hasPassword: false,
      ownerId: 'host-2',
      ownerName: 'Mew',
      onlineCount: 38,
      category: 'tpop' as any,
      currentVideo: {
        videoId: 'tpop-1',
        title: 'Three Man Down - ฝนตกไหม (Official Music Video)',
        thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      },
      createdAt: Date.now(),
    },
    {
      id: 'indie-cafe',
      name: 'Midnight Indie & Acoustic Cafe ☕',
      description: 'ร้านกาแฟยามค่ำคืนกับเสียงกีตาร์โปร่ง',
      isPrivate: false,
      hasPassword: false,
      ownerId: 'host-3',
      ownerName: 'GuitarBoy',
      onlineCount: 16,
      category: 'acoustic' as any,
      currentVideo: {
        videoId: 'indie-1',
        title: 'Acoustic Guitar Sessions Live',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      },
      createdAt: Date.now(),
    },
    {
      id: 'anime-vibes',
      name: 'Anime OST & J-Rock Energy ⚡',
      description: 'รวมเพลงประกอบอนิเมะและร็อคญี่ปุ่นสุดมันส์',
      isPrivate: false,
      hasPassword: false,
      ownerId: 'host-4',
      ownerName: 'Kuro',
      onlineCount: 29,
      category: 'rock' as any,
      currentVideo: {
        videoId: 'anime-1',
        title: 'Yoasobi - Idol (Anime Live Sync)',
        thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      },
      createdAt: Date.now(),
    },
  ];

  const filteredRooms = displayRooms.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.currentVideo?.title.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'all') {
      return (r.category as string) === selectedCategory;
    }
    return true;
  });

  const totalListeners = displayRooms.reduce((acc, r) => acc + (r.onlineCount || 1), 0);

  return (
    <main className={`w-full pt-14 sm:pt-16 md:pt-18 flex-1 flex flex-col justify-center transition-colors duration-300 ${
      isLight ? 'bg-[#faf8ff] text-[#131b2e]' : 'bg-[#111319] text-[#e2e2ea]'
    }`}>
      <div className="flex flex-col w-full relative overflow-x-hidden min-h-[calc(100vh-4rem)] pb-24 md:pb-12 justify-center">
        {/* Dynamic Ambient Glow Mesh Background */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1280px] h-[650px] bg-gradient-to-b blur-[100px] pointer-events-none -z-10 opacity-70 ${
          isLight
            ? 'from-[#006194]/15 via-[#00855b]/10 to-transparent'
            : 'from-[#0075de]/25 via-[#00daf3]/15 to-transparent'
        }`} />
        <div className={`absolute top-48 -left-36 w-80 sm:w-96 h-80 sm:h-96 rounded-full blur-[110px] pointer-events-none -z-10 ${
          isLight ? 'bg-[#0075de]/10' : 'bg-[#00daf3]/15'
        }`} />
        <div className={`absolute top-72 -right-36 w-80 sm:w-96 h-80 sm:h-96 rounded-full blur-[110px] pointer-events-none -z-10 ${
          isLight ? 'bg-[#ffb955]/15' : 'bg-[#ffb955]/15'
        }`} />

        {/* ========================================================
            REMOTION CINEMATIC MOTION HERO SECTION (Mobile-First)
           ======================================================== */}
        <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col items-center text-center relative my-auto">
          {/* Centerpiece: Remotion-Style Interactive Vinyl Turntable & Soundwave Stage */}
          <div className="relative my-2 sm:my-3 flex items-center justify-center">
            {/* Concentric Audio Radar Wave Pulsing */}
            <div className={`absolute w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full border pointer-events-none animate-ripple-pulse ${
              isLight ? 'border-[#0075de]/30' : 'border-[#00daf3]/40'
            }`} />
            <div className={`absolute w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full border pointer-events-none animate-ripple-pulse [animation-delay:1.2s] ${
              isLight ? 'border-[#00855b]/20' : 'border-[#0075de]/30'
            }`} />

            {/* Floating Music Notes Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              <span className="absolute -top-6 -left-8 text-xl sm:text-2xl animate-[remotionFloatNote_3.5s_ease-in-out_infinite] select-none">
                🎵
              </span>
              <span className="absolute top-2 -right-10 text-lg sm:text-xl animate-[remotionFloatNote_4s_ease-in-out_infinite_1s] select-none">
                ✨
              </span>
              <span className="absolute -bottom-4 -left-6 text-base sm:text-xl animate-[remotionFloatNote_3s_ease-in-out_infinite_1.8s] select-none">
                🎧
              </span>
              <span className="absolute -bottom-6 right-4 text-sm sm:text-base animate-[remotionFloatNote_3.8s_ease-in-out_infinite_2.4s] select-none">
                🔥
              </span>
            </div>

            {/* 3D Vinyl Disc Stage */}
            <div
              onClick={() => setIsVinylPlaying(!isVinylPlaying)}
              title="แตะเพื่อเริ่ม / หยุดแผ่นเสียงจำลอง"
              className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full p-2.5 shadow-[0_12px_45px_rgba(0,0,0,0.4)] cursor-pointer group transition-transform hover:scale-105 active:scale-95"
            >
              {/* Spinning Vinyl Record Body */}
              <div
                className={`w-full h-full rounded-full relative flex items-center justify-center ${
                  isLight ? 'vinyl-grooves-light' : 'vinyl-grooves'
                } ${isVinylPlaying ? 'animate-vinyl-spin' : ''}`}
                style={{
                  boxShadow: isLight
                    ? 'inset 0 0 16px rgba(0,0,0,0.4), 0 6px 20px rgba(0,97,148,0.25)'
                    : 'inset 0 0 20px rgba(0,0,0,0.8), 0 8px 30px rgba(0,218,243,0.3)',
                }}
              >
                {/* Vinyl Light Sheen (Reflection angle) */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none opacity-40"
                  style={{
                    background:
                      'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.35) 45deg, transparent 90deg, transparent 180deg, rgba(255,255,255,0.35) 225deg, transparent 270deg)',
                  }}
                />

                {/* Center Pleng.online Record Badge */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-[#ffb955] via-[#ff9800] to-[#ffd54f] flex flex-col items-center justify-center p-1 shadow-inner relative z-10 select-none">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#111319] border-2 border-[#ffb955] flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ffb955]" />
                  </div>
                  <span className="font-black text-[9px] sm:text-[10px] text-[#291800] tracking-tighter mt-0.5 leading-none">
                    PLENG
                  </span>
                  <span className="text-[7px] sm:text-[8px] font-mono text-[#4e2d00] font-bold tracking-tight">
                    33⅓ RPM
                  </span>
                </div>
              </div>

              {/* Tonearm Needle Graphic Overlay */}
              <div
                className={`absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-12 h-16 sm:w-16 sm:h-20 pointer-events-none transition-transform duration-500 origin-top-right ${
                  isVinylPlaying ? 'rotate-0' : '-rotate-25 opacity-70'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-zinc-400 border border-zinc-200 shadow-md ml-auto" />
                <div className="w-1 h-12 bg-gradient-to-b from-zinc-400 via-zinc-300 to-zinc-500 rounded-full ml-auto mr-1 transform rotate-12 shadow-sm" />
                <div className="w-2.5 h-4 bg-zinc-600 rounded-sm ml-auto mr-0.5 -mt-1 shadow-md" />
              </div>
            </div>
          </div>

          {/* Dynamic Audio Equalizer Bars Visualizer (Remotion Style) */}
          <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-8 sm:h-10 my-2 sm:my-3 w-60 sm:w-80 max-w-full">
            {[45, 80, 60, 95, 30, 75, 50, 90, 40, 85, 70, 100, 65, 85, 45, 90, 55, 75, 40, 95, 60, 85, 50, 70].map(
              (baseHeight, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all duration-150"
                  style={{
                    background:
                      i % 3 === 0
                        ? 'linear-gradient(to top, #0075de, #00daf3)'
                        : i % 3 === 1
                        ? 'linear-gradient(to top, #005eb4, #00daf3)'
                        : 'linear-gradient(to top, #ff9800, #ffb955)',
                    animation: isVinylPlaying
                      ? `remotionEqualizer ${0.7 + (i % 6) * 0.15}s ease-in-out infinite alternate`
                      : 'none',
                    animationDelay: `${(i * 0.08).toFixed(2)}s`,
                    height: isVinylPlaying ? `${baseHeight}%` : '20%',
                  }}
                />
              )
            )}
          </div>

          {/* Main Kinetic Typographic Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight max-w-3xl leading-[1.15] mt-1">
            <span className={isLight ? 'shimmer-gradient-light-text' : 'shimmer-gradient-text'}>
              listen to music
            </span>{' '}
            <span className={`inline-flex items-center ${isLight ? 'text-[#131b2e]' : 'text-white'}`}>
              together
              <span
                className={`w-1.5 sm:w-2 h-7 sm:h-10 ml-2 inline-block animate-pulse rounded-xs ${
                  isLight ? 'bg-[#006194]' : 'bg-[#00daf3]'
                }`}
              />
            </span>
          </h1>

          {/* Primary Mobile Action Buttons (Thumb Zone Focused) */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3.5 mt-6 w-full max-w-sm sm:max-w-md justify-center">
            {/* Create Room Primary Hero Button */}
            <button
              onClick={onOpenCreateRoom}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#0075de] via-[#005eb4] to-[#00daf3] text-white text-sm sm:text-base font-bold shadow-[0_8px_25px_rgba(0,117,222,0.45)] hover:shadow-[0_12px_35px_rgba(0,218,243,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[22px] group-hover:rotate-45 transition-transform">
                add_circle
              </span>
              <span>สร้างห้องฟังเพลงใหม่</span>
            </button>

            {/* Room Code Secondary Button */}
            <button
              onClick={onOpenRoomCodeModal}
              className={`w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xs hover:scale-105 active:scale-95 border cursor-pointer ${
                isLight
                  ? 'bg-white border-[#dae2fd] text-[#131b2e] hover:bg-[#eaedff]'
                  : 'bg-[#191b22] text-[#e2e2ea] hover:bg-[#282a30] border-white/[0.08]'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${isLight ? 'text-[#006194]' : 'text-[#00daf3]'}`}>
                key
              </span>
              <span>เข้าร่วมด้วยรหัส (Room Code)</span>
            </button>
          </div>

          <p className={`font-mono text-[11px] mt-2.5 ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>
            (ไม่ต้องสมัครสมาชิก แชร์ลิงก์เข้าใช้งานได้ทันที)
          </p>

          {/* ========================================================
              FLOATING INTERACTIVE ROOMS CARD (การ์ดลอย "ห้องฟังเพลงทั้งหมด")
             ======================================================== */}
          <div className="w-full max-w-md mx-auto mt-7">
            <button
              type="button"
              onClick={() => setIsRoomsSheetOpen(true)}
              className={`w-full p-4 rounded-3xl border shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-between gap-3 text-left group relative overflow-hidden ${
                isLight
                  ? 'bg-white/85 border-[#dae2fd] shadow-[0_12px_36px_rgba(0,117,222,0.14)] hover:border-[#0075de]/50'
                  : 'bg-[#191b22]/90 border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.55)] hover:border-[#00daf3]/50'
              }`}
            >
              {/* Ambient Glow Orb */}
              <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-[#00daf3]/15 blur-2xl pointer-events-none" />

              {/* Left: Icon + Title + Status */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0075de] to-[#00daf3] flex items-center justify-center text-white shadow-[0_0_16px_rgba(0,117,222,0.45)] shrink-0 group-hover:rotate-6 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">podcasts</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className={`font-black text-sm sm:text-base truncate ${isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'}`}>
                      ห้องฟังเพลงทั้งหมด
                    </h2>
                    <span className="flex h-2 w-2 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>
                    {displayRooms.length} ห้องกำลังเปิดเพลง • แตะเพื่อเปิดดูรายชื่อห้อง
                  </p>
                </div>
              </div>

              {/* Right: Preview Avatars + Arrow Button */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex -space-x-2 overflow-hidden hidden xs:flex">
                  {displayRooms.slice(0, 3).map((r, i) => (
                    <img
                      key={i}
                      src={
                        r.coverImage ||
                        r.currentVideo?.thumbnail ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                      }
                      alt=""
                      className="w-7 h-7 rounded-full border-2 dark:border-[#191b22] border-white object-cover"
                    />
                  ))}
                </div>
                <div className="w-8 h-8 rounded-full dark:bg-white/10 bg-black/5 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <span className="material-symbols-outlined text-[18px] text-[#0075de] dark:text-[#00daf3]">
                    arrow_forward
                  </span>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* ========================================================
            MOTION ROOMS DRAWER / MODAL (แสดงรายชื่อห้องเมื่อแตะการ์ด)
           ======================================================== */}
        {isRoomsSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop Blur */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setIsRoomsSheetOpen(false)}
            />

            {/* Motion Sheet Container */}
            <div
              className={`relative w-full sm:max-w-3xl max-h-[85vh] sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300 z-10 ${
                isLight
                  ? 'bg-white border-[#dae2fd] text-[#131b2e]'
                  : 'bg-[#191b22] border-white/[0.08] text-[#e2e2ea]'
              }`}
            >
              {/* Drag Handle Bar (Mobile) */}
              <div className="w-12 h-1.5 rounded-full bg-zinc-500/30 mx-auto mt-3 mb-1 sm:hidden shrink-0" />

              {/* Sheet Header */}
              <div className="px-5 py-3 border-b dark:border-white/[0.06] border-[#dae2fd]/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#0075de] dark:text-[#00daf3] text-[22px]">
                    podcasts
                  </span>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg tracking-tight">
                      ห้องฟังเพลงทั้งหมด ({filteredRooms.length})
                    </h2>
                    <p className={`text-[11px] ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>
                      เลือกห้องเพื่อเริ่มฟังเพลงพร้อมกันแบบเรียลไทม์
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRoomsSheetOpen(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-black/5 hover:bg-black/10 text-zinc-600'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300'
                  }`}
                  title="ปิด"
                >
                  ✕
                </button>
              </div>

              {/* Search & Genre Filter Chips */}
              <div className="p-4 border-b dark:border-white/[0.04] border-[#dae2fd]/40 flex flex-col gap-3 shrink-0">
                {/* Search Input */}
                <div className="relative w-full">
                  <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[16px] ${
                    isLight ? 'text-[#707881]' : 'text-[#94A3B8]'
                  }`}>
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อห้อง, ดีเจ, หรือเพลง..."
                    className={`w-full pl-8 pr-3 py-2 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#0075de] shadow-xs ${
                      isLight
                        ? 'bg-[#f6f5f4] border border-[#dae2fd] text-[#131b2e] placeholder-[#707881]'
                        : 'bg-[#111319] border border-white/[0.08] text-[#e2e2ea] placeholder-[#8b919e]'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Genre Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        selectedCategory === c.id
                          ? 'dark:bg-[#0075de] dark:text-white bg-[#006194] text-white font-bold shadow-xs'
                          : 'dark:bg-[#111319] dark:text-[#c1c6d5] dark:hover:text-white bg-white border border-[#dae2fd] text-[#475569] hover:bg-[#eaedff]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{c.icon}</span>
                      <span>{c.label}</span>
                      {c.count && (
                        <span className={`px-1 py-0.2 rounded-full font-mono text-[9px] ${
                          selectedCategory === c.id ? 'bg-black/20 text-white' : 'dark:bg-white/10 bg-black/5'
                        }`}>
                          {c.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Room List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredRooms.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <span className="material-symbols-outlined text-4xl text-[#0075de] dark:text-[#00daf3]">
                      music_off
                    </span>
                    <p className="text-sm font-semibold">
                      ไม่พบห้องที่ตรงกับการค้นหา "{searchQuery}"
                    </p>
                    <button
                      onClick={() => {
                        setIsRoomsSheetOpen(false);
                        onOpenCreateRoom();
                      }}
                      className="mt-2 px-5 py-2 rounded-full text-xs font-semibold bg-[#0075de] text-white hover:brightness-110 cursor-pointer"
                    >
                      สร้างห้องใหม่เลย 🎵
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {filteredRooms.map((room) => {
                      const isFav = favoriteRoomIds.has(room.id);

                      return (
                        <div
                          key={room.id}
                          onClick={() => {
                            setIsRoomsSheetOpen(false);
                            onSelectRoom(room.id);
                          }}
                          className={`group rounded-2xl overflow-hidden border p-3 flex gap-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                            isLight
                              ? 'bg-[#faf8ff] hover:bg-white border-[#dae2fd] hover:border-[#0075de]/40 hover:shadow-md'
                              : 'bg-[#111319] hover:bg-[#1d1f26] border-white/[0.06] hover:border-[#00daf3]/40 hover:shadow-lg'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-black/20">
                            <img
                              src={
                                room.currentVideo?.thumbnail ||
                                room.coverImage ||
                                'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'
                              }
                              alt={room.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-black/60 text-[#10B981] font-mono text-[8px] font-bold">
                              <span className="w-1 h-1 rounded-full bg-[#10B981] animate-ping" />
                              LIVE
                            </div>

                            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 text-white font-mono text-[9px] font-semibold">
                              <span className="material-symbols-outlined text-[11px] text-[#00daf3]">group</span>
                              <span>{room.onlineCount || 1}</span>
                            </div>
                          </div>

                          {/* Content Details */}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <h3 className="font-bold text-xs sm:text-sm truncate group-hover:text-[#0075de] dark:group-hover:text-[#00daf3] transition-colors">
                                  {room.name}
                                </h3>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleFavoriteRoom(e, room.id)}
                                  className={`p-1 rounded-full text-xs transition-transform active:scale-90 ${
                                    isFav ? 'text-amber-400' : 'text-zinc-400 hover:text-amber-400'
                                  }`}
                                >
                                  ★
                                </button>
                              </div>

                              <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>
                                {room.currentVideo?.title ? `🎵 ${room.currentVideo.title}` : room.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t dark:border-white/[0.04] border-[#dae2fd]/40 mt-1">
                              <span className={`text-[10px] truncate max-w-[100px] flex items-center gap-1 ${
                                isLight ? 'text-[#707881]' : 'text-[#c1c6d5]'
                              }`}>
                                <span className="material-symbols-outlined text-[12px] text-[#ffb955]">person</span>
                                <span className="truncate">{room.ownerName || 'DJ Host'}</span>
                              </span>

                              <span className="px-2.5 py-0.5 rounded-full dark:bg-[#0075de]/20 dark:text-[#00daf3] bg-[#eef0ff] text-[#006194] text-[10px] font-bold group-hover:bg-[#0075de] group-hover:text-white transition-all flex items-center gap-0.5">
                                <span>เข้าห้อง</span>
                                <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
