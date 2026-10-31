import React, { useState, useEffect } from 'react';
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isVinylPlaying, setIsVinylPlaying] = useState<boolean>(true);

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
    { id: 'trending', label: 'กำลังมาแรง', icon: 'local_fire_department', count: 6 },
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
    if (selectedCategory === 'trending') {
      return (r.onlineCount || 0) >= 15;
    }
    if (selectedCategory !== 'all') {
      return (r.category as string) === selectedCategory;
    }
    return true;
  });

  const trendingRooms = [...displayRooms].sort((a, b) => (b.onlineCount || 0) - (a.onlineCount || 0)).slice(0, 5);

  return (
    <main className={`w-full pt-14 sm:pt-16 md:pt-18 flex-1 flex flex-col transition-colors duration-300 ${
      isLight ? 'bg-[#faf8ff] text-[#131b2e]' : 'bg-[#111319] text-[#e2e2ea]'
    }`}>
      <div className="flex flex-col w-full relative overflow-x-hidden min-h-screen pb-28 md:pb-20">
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
        <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-10 pb-8 sm:pb-12 flex flex-col items-center text-center relative">
          {/* Realtime Live Activity Pill */}
          <div className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full shadow-md mb-5 border transition-transform hover:scale-105 select-none ${
            isLight
              ? 'bg-white/90 border-[#dae2fd] text-[#131b2e]'
              : 'bg-[#282a30]/85 border-white/[0.08] text-[#e2e2ea]'
          }`}>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]" />
            </span>
            <span className="font-mono text-[11px] sm:text-xs font-semibold tracking-wide">
              1,420+ กำลังฟังเพลงพร้อมกันใน 142 ห้อง
            </span>
          </div>

          {/* Centerpiece: Remotion-Style Interactive Vinyl Turntable & Soundwave Stage */}
          <div className="relative my-2 sm:my-4 flex items-center justify-center">
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
          <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-8 sm:h-10 my-3 sm:my-4 w-60 sm:w-80 max-w-full">
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

          {/* Subheading */}
          <p className={`text-xs sm:text-base mt-2.5 sm:mt-3 max-w-xl leading-relaxed font-normal ${
            isLight ? 'text-[#475569]' : 'text-[#94A3B8]'
          }`}>
            สเปซฟังเพลงออนไลน์ไม่มีโฆษณาคั่น จัดคิว Playlist YouTube และดูคลิปพร้อมเพื่อนแบบเรียลไทม์
          </p>

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

          {/* 4 Brand Pillars (Compact 2x2 on Mobile, 4x1 on Tablet/Desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mt-8 w-full max-w-3xl">
            <div className={`flex items-center gap-2.5 p-3 rounded-2xl text-left border shadow-xs transition-all hover:-translate-y-0.5 ${
              isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22]/90 border-white/[0.05]'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-[#00daf3]/10 text-[#00daf3] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">block</span>
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-xs truncate ${isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'}`}>ไม่มีโฆษณา</p>
                <p className={`text-[10px] truncate ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>ฟังยาวไม่สะดุด</p>
              </div>
            </div>

            <div className={`flex items-center gap-2.5 p-3 rounded-2xl text-left border shadow-xs transition-all hover:-translate-y-0.5 ${
              isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22]/90 border-white/[0.05]'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-[#ffb955]/10 text-[#ffb955] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">queue_music</span>
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-xs truncate ${isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'}`}>Playlist YouTube</p>
                <p className={`text-[10px] truncate ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>จัดคิวเพลงอิสระ</p>
              </div>
            </div>

            <div className={`flex items-center gap-2.5 p-3 rounded-2xl text-left border shadow-xs transition-all hover:-translate-y-0.5 ${
              isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22]/90 border-white/[0.05]'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">sync</span>
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-xs truncate ${isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'}`}>ซิงก์เสียงสด</p>
                <p className={`text-[10px] truncate ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>ตรงเป๊ะทุกบีต</p>
              </div>
            </div>

            <div className={`flex items-center gap-2.5 p-3 rounded-2xl text-left border shadow-xs transition-all hover:-translate-y-0.5 ${
              isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22]/90 border-white/[0.05]'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-[#0075de]/10 text-[#0075de] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">devices</span>
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-xs truncate ${isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'}`}>ทุกอุปกรณ์</p>
                <p className={`text-[10px] truncate ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>มือถือ / แท็บเล็ต</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            MOBILE HORIZONTAL SWIPE RAIL: 🔥 กำลังมาแรง (Trending Now)
           ======================================================== */}
        <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500 text-[20px] sm:text-[24px]">local_fire_department</span>
              <h2 className="text-base sm:text-xl font-bold dark:text-[#e2e2ea] text-[#131b2e] tracking-tight">
                ห้องกำลังมาแรง (Trending Now)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#0075de] dark:text-[#00daf3] font-semibold">
              ปัดเพื่อดูเพิ่ม ➔
            </span>
          </div>

          {/* Horizontal Snap Scroll Rail for Mobile */}
          <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
            {trendingRooms.map((room) => {
              const isFav = favoriteRoomIds.has(room.id);
              return (
                <div
                  key={`trend-${room.id}`}
                  onClick={() => onSelectRoom(room.id)}
                  className="snap-start shrink-0 w-[240px] sm:w-[280px] rounded-2xl overflow-hidden dark:bg-[#191b22] bg-white border dark:border-white/[0.08] border-[#dae2fd] shadow-md hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer flex flex-col group"
                >
                  {/* Thumbnail with overlay badges */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black/20">
                    <img
                      src={
                        room.currentVideo?.thumbnail ||
                        room.coverImage ||
                        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600/90 text-white font-mono text-[9px] font-bold shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      HOT
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[10px] font-semibold">
                      <span className="material-symbols-outlined text-[13px] text-[#00daf3]">group</span>
                      <span>{room.onlineCount || 1}</span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
                      <span className="text-[11px] font-medium truncate drop-shadow-md">
                        {room.ownerName}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavoriteRoom(e, room.id)}
                        className={`p-1 rounded-full text-xs transition-transform active:scale-90 ${
                          isFav ? 'text-amber-400 fill-current' : 'text-white/80 hover:text-white'
                        }`}
                      >
                        ★
                      </button>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                    <h3 className="font-bold text-xs sm:text-sm dark:text-[#e2e2ea] text-[#131b2e] group-hover:text-[#0075de] dark:group-hover:text-[#00daf3] transition-colors line-clamp-1">
                      {room.name}
                    </h3>
                    <p className="text-[11px] dark:text-[#94A3B8] text-[#64748b] line-clamp-1">
                      {room.currentVideo?.title || room.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================
            EXPLORE & CATEGORY PILLS SECTION (Stitch Style)
           ======================================================== */}
        <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0075de] dark:text-[#00daf3] text-[22px]">
                podcasts
              </span>
              <h2 className="text-lg sm:text-2xl font-bold dark:text-[#e2e2ea] text-[#131b2e] tracking-tight">
                ห้องฟังเพลงทั้งหมด ({filteredRooms.length})
              </h2>
            </div>

            {/* Mobile / Tablet search input */}
            <div className="relative w-full sm:w-64">
              <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[16px] ${
                isLight ? 'text-[#707881]' : 'text-[#94A3B8]'
              }`}>
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อห้อง, ดีเจ, เพลง..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#0075de] shadow-xs ${
                  isLight
                    ? 'bg-white border border-[#dae2fd] text-[#131b2e] placeholder-[#707881]'
                    : 'bg-[#191b22] border border-white/[0.08] text-[#e2e2ea] placeholder-[#8b919e]'
                }`}
              />
            </div>
          </div>

          {/* Category Filter Chips Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'dark:bg-gradient-to-r dark:from-[#0075de] dark:to-[#00daf3] dark:text-white bg-[#006194] text-white font-bold shadow-md'
                    : 'dark:bg-[#191b22] dark:text-[#c1c6d5] dark:hover:text-white dark:hover:bg-[#282a30] bg-white border border-[#dae2fd] text-[#475569] hover:text-[#131b2e] hover:bg-[#eaedff] shadow-xs'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{c.icon}</span>
                <span>{c.label}</span>
                {c.count && (
                  <span className={`px-1.5 py-0.2 rounded-full font-mono text-[9px] font-bold ${
                    selectedCategory === c.id ? 'bg-black/25' : 'dark:bg-white/10 bg-black/5'
                  }`}>
                    {c.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Rooms Grid (1 column on mobile, 2-4 on larger screens) */}
          {filteredRooms.length === 0 ? (
            <div className="text-center py-16 dark:bg-[#191b22] bg-white rounded-2xl border dark:border-white/[0.08] border-[#dae2fd] p-8 space-y-3 max-w-md mx-auto shadow-xs">
              <span className="material-symbols-outlined text-4xl text-[#0075de] dark:text-[#00daf3]">
                music_off
              </span>
              <p className="text-sm font-semibold dark:text-[#e2e2ea] text-[#131b2e]">
                ไม่พบห้องที่ตรงกับการค้นหา "{searchQuery}"
              </p>
              <button
                onClick={onOpenCreateRoom}
                className="mt-2 px-5 py-2 rounded-full text-xs font-semibold bg-[#0075de] text-white hover:brightness-110 cursor-pointer"
              >
                สร้างห้องใหม่เลย 🎵
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredRooms.map((room) => {
                const isFav = favoriteRoomIds.has(room.id);

                return (
                  <div
                    key={room.id}
                    onClick={() => onSelectRoom(room.id)}
                    className="group relative rounded-2xl overflow-hidden dark:bg-[#191b22] dark:border-white/[0.08] bg-white border border-[#dae2fd] hover:border-[#00daf3]/50 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col transform hover:-translate-y-1 active:scale-[0.99]"
                  >
                    {/* Thumbnail Header */}
                    <div className="relative aspect-video w-full dark:bg-[#111319] bg-[#eaedff] overflow-hidden">
                      <img
                        src={
                          room.currentVideo?.thumbnail ||
                          room.coverImage ||
                          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'
                        }
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t dark:from-[#191b22] from-white/90 via-transparent to-black/25" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[#10B981] font-mono text-[9px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                          LIVE
                        </span>
                        {room.isPrivate && (
                          <span className="px-2 py-0.5 rounded-full bg-[#dd5b00]/90 text-white font-mono text-[9px] font-bold flex items-center gap-0.5">
                            🔒 ล็อค
                          </span>
                        )}
                      </div>

                      {/* Top Right: Listeners & Favorite Button */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[10px] font-bold">
                          <span className="material-symbols-outlined text-[13px] text-[#00daf3]">group</span>
                          <span>{room.onlineCount || 1}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavoriteRoom(e, room.id)}
                          title={isFav ? 'เลิกติดตามห้องนี้' : 'บันทึกเป็นห้องโปรด ⭐'}
                          className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border text-xs transition-transform active:scale-90 cursor-pointer ${
                            isFav
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-black/40 text-white/80 hover:text-amber-400 border-white/20'
                          }`}
                        >
                          ★
                        </button>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base dark:text-[#e2e2ea] text-[#131b2e] dark:group-hover:text-[#00daf3] group-hover:text-[#006194] transition-colors line-clamp-1">
                          {room.name}
                        </h3>
                        <p className="text-xs dark:text-[#94A3B8] text-[#64748b] line-clamp-1 mt-0.5">
                          {room.currentVideo?.title ? `🎵 ${room.currentVideo.title}` : room.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t dark:border-white/[0.04] border-[#dae2fd]/60">
                        <span className="text-[11px] dark:text-[#c1c6d5] text-[#707881] flex items-center gap-1 truncate max-w-[140px]">
                          <span className="material-symbols-outlined text-[14px] text-[#ffb955]">person</span>
                          <span className="truncate">{room.ownerName || 'DJ Host'}</span>
                        </span>

                        <span className="px-3 py-1 rounded-full dark:bg-[#0075de]/20 dark:text-[#00daf3] bg-[#eef0ff] text-[#006194] text-xs font-bold transition-all flex items-center gap-1 group-hover:bg-[#0075de] group-hover:text-white">
                          <span>เข้าห้อง</span>
                          <span className="material-symbols-outlined text-[13px] group-hover:translate-x-0.5 transition-transform">
                            arrow_forward
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================
            FEATURE PILLARS & SEO FAQ SECTION (Mobile Accordion)
           ======================================================== */}
        <section className={`w-full border-t px-4 sm:px-6 lg:px-10 py-12 transition-colors ${
          isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22]/70 border-white/[0.06]'
        }`}>
          <div className="max-w-4xl mx-auto space-y-10">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-lg sm:text-2xl font-black dark:text-[#e2e2ea] text-[#131b2e]">
                ทำไมต้องฟังเพลงที่ pleng.online?
              </h2>
              <p className="text-xs sm:text-sm dark:text-[#94A3B8] text-[#64748b] max-w-lg mx-auto">
                ประสบการณ์ฟังเพลงออนไลน์ไม่มีโฆษณาคั่น ซิงค์คลิป YouTube และพูดคุยกับเพื่อนแบบเรียลไทม์ที่ดีที่สุด
              </p>
            </div>

            {/* 3 Core Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-2.5 ${
                isLight ? 'bg-[#faf8ff] border-[#dae2fd]' : 'bg-[#111319] border-white/[0.06]'
              }`}>
                <div className="w-10 h-10 rounded-xl bg-[#0075de]/10 text-[#0075de] dark:text-[#00daf3] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">headphones</span>
                </div>
                <h3 className="font-bold text-sm dark:text-[#e2e2ea] text-[#131b2e]">
                  ไม่มีโฆษณาคั่น 100%
                </h3>
                <p className="text-xs dark:text-[#94A3B8] text-[#64748b] leading-relaxed">
                  เปิดเพลงยาวๆ ต่อเนื่องเพื่อทำงาน อ่านหนังสือ หรือปาร์ตี้ ไม่โดนตัดอารมณ์ด้วยโฆษณาคั่น ซิงค์ตรงเป๊ะทุกคนในห้อง
                </p>
              </div>

              <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-2.5 ${
                isLight ? 'bg-[#faf8ff] border-[#dae2fd]' : 'bg-[#111319] border-white/[0.06]'
              }`}>
                <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">queue_music</span>
                </div>
                <h3 className="font-bold text-sm dark:text-[#e2e2ea] text-[#131b2e]">
                  Playlist YouTube อิสระ
                </h3>
                <p className="text-xs dark:text-[#94A3B8] text-[#64748b] leading-relaxed">
                  สร้างและจัดคิวเพลง YouTube ได้อิสระ ให้เพื่อนๆ ช่วยกันขอเพลง สลับคิว เล่นซ้ำ และสุ่มเพลง ฟังเพลงเป็นกลุ่มได้ไม่จำกัด
                </p>
              </div>

              <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-2.5 ${
                isLight ? 'bg-[#faf8ff] border-[#dae2fd]' : 'bg-[#111319] border-white/[0.06]'
              }`}>
                <div className="w-10 h-10 rounded-xl bg-[#ffb955]/10 text-[#ffb955] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">mic</span>
                </div>
                <h3 className="font-bold text-sm dark:text-[#e2e2ea] text-[#131b2e]">
                  คุยไมค์ 9 ที่นั่ง & Auto Ducking
                </h3>
                <p className="text-xs dark:text-[#94A3B8] text-[#64748b] leading-relaxed">
                  ขึ้นเวทีคุยไมค์สด 9 คนพร้อมกัน มีระบบ Auto Ducking หรี่เสียงเพลงอัตโนมัติขณะมีคนพูด เสียงชัดเจน ไม่ต้องลง Discord
                </p>
              </div>
            </div>

            {/* Interactive FAQ Accordion */}
            <div className="space-y-3 pt-4">
              <div className="text-center space-y-1 mb-4">
                <h3 className="text-base sm:text-lg font-bold dark:text-[#e2e2ea] text-[#131b2e] flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[#0075de] dark:text-[#00daf3]">help</span>
                  <span>คำถามที่พบบ่อย (FAQ)</span>
                </h3>
                <p className="text-xs dark:text-[#94A3B8] text-[#64748b]">ข้อสงสัยเกี่ยวกับการใช้งาน pleng.online</p>
              </div>

              {[
                {
                  q: 'ฟังเพลงออนไลน์ไม่มีโฆษณาที่ pleng.online มีค่าใช้จ่ายหรือไม่?',
                  a: 'ฟรี 100% ไม่มีค่าบริการใดๆ สามารถเปิดห้อง ฟังเพลง และคุยไมค์สดกับเพื่อนได้ทันทีโดยไม่ต้องผูกบัตรเครดิต',
                },
                {
                  q: 'วิธีดู YouTube กับเพื่อนพร้อมกันต้องทำอย่างไร?',
                  a: 'เพียงกดปุ่ม "สร้างห้องฟังเพลงใหม่" จากนั้นคัดลอกลิงก์ห้องส่งให้เพื่อนในแชท เมื่อเพื่อนกดเข้ามา ตัวเล่นคลิป YouTube จะซิงค์ภาพและเสียงให้ตรงกันทุกคนอัตโนมัติ',
                },
                {
                  q: 'จัด Playlist YouTube และฟังเพลงเป็นกลุ่มได้อย่างไร?',
                  a: 'คุณสามารถค้นหาชื่อเพลงหรือวางลิงก์ YouTube เพื่อเพิ่มเพลงลงในคิวเพลย์ลิสต์ (Queue) และเปิดให้ทุกคนในห้องช่วยกันเพิ่มเพลงที่ชอบได้',
                },
                {
                  q: 'ต้องติดตั้งโปรแกรมหรือดาวน์โหลดแอปหรือไม่?',
                  a: 'ไม่ต้องติดตั้งแอปพลิเคชันใดๆ สามารถเปิดฟังเพลงผ่านเว็บบราวเซอร์ เช่น Google Chrome หรือ Safari บนคอมพิวเตอร์และมือถือได้ทันที',
                },
                {
                  q: 'มีระบบลดเสียงเพลงอัตโนมัติขณะพูด (Audio Ducking) หรือไม่?',
                  a: 'มีระบบ Auto Audio Ducking อัจฉริยะ เมื่อมีสมาชิกในห้องเปิดไมค์พูด ระบบจะหรี่เสียง YouTube ลงชั่วคราวอัตโนมัติเพื่อให้ได้ยินเสียงพูดชัดเจน และปรับกลับมาดังเท่าเดิมเมื่อพูดเสร็จ',
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border overflow-hidden transition-all shadow-xs ${
                    isLight ? 'bg-[#faf8ff] border-[#dae2fd]' : 'bg-[#111319] border-white/[0.06]'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold dark:text-[#e2e2ea] text-[#131b2e] hover:text-[#0075de] dark:hover:text-[#00daf3] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 shrink-0 ml-2 ${
                      openFaq === idx ? 'rotate-180 text-[#0075de] dark:text-[#00daf3]' : ''
                    }`}>
                      expand_more
                    </span>
                  </button>
                  {openFaq === idx && (
                    <div className={`px-4 pb-3.5 pt-1 text-xs leading-relaxed border-t ${
                      isLight
                        ? 'border-[#dae2fd]/60 bg-white text-[#475569]'
                        : 'border-white/[0.04] bg-[#191b22] text-[#94A3B8]'
                    }`}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Semantic Footer */}
            <div className="pt-6 border-t dark:border-white/[0.06] border-[#dae2fd] text-center space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {[
                  'ฟังเพลงออนไลน์ไม่มีโฆษณา',
                  'ดู youtube ไม่มีโฆษณา',
                  'ฟังเพลงกับเพื่อน',
                  'ดู youtube กับเพื่อน',
                  'ฟังเพลง playlist youtube',
                  'watch party ไทย',
                  'ห้องฟังเพลงออนไลน์',
                ].map((kw, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                      isLight
                        ? 'bg-[#f2f3ff] border-[#dae2fd] text-[#475569]'
                        : 'bg-[#111319] border-white/[0.06] text-[#94A3B8]'
                    }`}
                  >
                    #{kw}
                  </span>
                ))}
              </div>
              <p className="text-[11px] font-mono dark:text-[#64748b] text-[#94A3B8] pt-1">
                © {new Date().getFullYear()} pleng.online – สเปซฟังเพลงและดูคลิป YouTube กับเพื่อนแบบเรียลไทม์
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
