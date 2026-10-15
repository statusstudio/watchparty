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

  const categories = [
    { id: 'all', label: 'ทั้งหมด', count: rooms.length || 14 },
    { id: 'trending', label: '🔥 กำลังมาแรง' },
    { id: 'lofi', label: '☕ Lofi / Chill' },
    { id: 'tpop', label: '🎵 T-Pop / K-Pop' },
    { id: 'rock', label: '🎸 Rock / Indie' },
    { id: 'acoustic', label: '🌙 Acoustic' },
  ];

  // Fallback demo rooms if room list is empty from server
  const displayRooms: RoomSummary[] = rooms.length > 0 ? rooms : [
    {
      id: 'squad-chill',
      name: 'Squad Chill & Lofi Beats 🎵',
      description: 'ห้องปาร์ตี้หลัก ฟังเพลงชิลล์ๆ คุยงานและเล่นเกม',
      isPrivate: false,
      hasPassword: false,
      ownerId: 'host-1',
      ownerName: 'DJ Panda',
      onlineCount: 18,
      category: 'music',
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
      onlineCount: 34,
      category: 'music',
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
      onlineCount: 12,
      category: 'talk',
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
      onlineCount: 22,
      category: 'gaming',
      currentVideo: {
        videoId: 'anime-1',
        title: 'Yoasobi - Idol (Anime Live Sync)',
        thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      },
      createdAt: Date.now(),
    },
  ];

  const filteredRooms = displayRooms.filter((r) => {
    if (!searchQuery) return true;
    return (
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.currentVideo?.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <main className={`w-full pt-20 flex-1 flex flex-col transition-colors duration-300 ${
      isLight ? 'bg-[#faf8ff] text-[#131b2e]' : 'bg-[#111319] text-[#e2e2ea]'
    }`}>
      <div className="flex flex-col w-full relative overflow-x-hidden min-h-screen pb-24">
        {/* Dynamic Ambient Glow Layer */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[550px] bg-gradient-to-b blur-3xl pointer-events-none -z-10 ${
          isLight ? 'from-[#006194]/10 via-[#00855b]/5 to-transparent' : 'from-[#0075de]/20 via-[#008291]/10 to-transparent'
        }`} />
        <div className={`absolute top-72 -left-48 w-96 h-96 rounded-full blur-[100px] pointer-events-none -z-10 ${
          isLight ? 'bg-[#0075de]/5' : 'bg-[#ffb955]/10'
        }`} />
        <div className={`absolute top-96 -right-48 w-96 h-96 rounded-full blur-[100px] pointer-events-none -z-10 ${
          isLight ? 'bg-[#006947]/5' : 'bg-[#00daf3]/10'
        }`} />

        {/* Hero Header Section */}
        <section className="w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 pt-10 pb-12 flex flex-col items-center text-center relative">
          {/* Animated Live Pill Status */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full shadow-md mb-6 border transition-transform hover:scale-105 ${
            isLight ? 'bg-white border-[#dae2fd] text-[#131b2e]' : 'bg-[#282a30]/80 border-white/[0.06] text-[#e2e2ea]'
          }`}>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
            </span>
            <span className={`font-mono text-xs uppercase tracking-wider font-semibold ${
              isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'
            }`}>
              1,420+ กำลังฟังเพลงพร้อมกันใน 142 ห้องทั่วไทย
            </span>
          </div>

          {/* Center Playful App Icon Badge (Heritage from Pleng.online) */}
          <div className="relative mb-6 group cursor-pointer" onClick={() => onSelectRoom('squad-chill')}>
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#ffb955] via-[#00daf3] to-[#0075de] opacity-40 blur-lg group-hover:opacity-75 transition-all duration-500"></div>
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-[#ffb955] flex flex-col items-center justify-center shadow-xl p-3 transform transition-transform group-hover:-translate-y-1">
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <span className="text-3xl md:text-4xl font-black text-[#291800] tracking-tight leading-none mb-1 select-none">
                  P<span className="text-[#111319]">LENG</span>
                </span>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#111319]"></span>
                  <span className="inline-block w-4 h-1 bg-[#111319] rounded-full"></span>
                  <span className="material-symbols-outlined text-[#111319] text-[18px]">headphones</span>
                </div>
                <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#111319] text-[#ffddb4] font-mono text-[10px] font-bold tracking-tight">
                  pleng.online
                </span>
              </div>
            </div>
          </div>

          {/* Main Typographic Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight">
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${
              isLight ? 'from-[#006194] via-[#0284c7] to-[#005eb4]' : 'from-[#d5e3ff] via-[#00daf3] to-[#0075de]'
            }`}>
              listen to music
            </span>{' '}
            <span className={`inline-flex items-center ${isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'}`}>
              together
              <span className={`w-1.5 h-8 md:h-12 ml-2 inline-block animate-pulse ${
                isLight ? 'bg-[#006194]' : 'bg-[#00daf3]'
              }`}></span>
            </span>
          </h1>

          <p className={`text-base md:text-lg mt-4 max-w-2xl leading-relaxed ${
            isLight ? 'text-[#475569]' : 'text-[#94A3B8]'
          }`}>
            สเปซฟังเพลงออนไลน์ไม่มีโฆษณาคั่น จัดคิว Playlist YouTube และดูคลิปพร้อมเพื่อนแบบเรียลไทม์ ฟังเสียงคมชัด ซิงก์ตรงเป๊ะทุกบีต
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full justify-center max-w-md sm:max-w-none">
            <button
              onClick={onOpenCreateRoom}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#0075de] to-[#005eb4] text-white text-base font-bold shadow-xl hover:shadow-[0_0_35px_-4px_rgba(0,117,222,0.7)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[24px] text-[#00daf3] group-hover:rotate-12 transition-transform">
                music_note
              </span>
              <span>สร้างห้องฟังเพลงใหม่</span>
            </button>

            <button
              onClick={onOpenRoomCodeModal}
              className={`w-full sm:w-auto px-6 py-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-105 border ${
                isLight
                  ? 'bg-white border-[#dae2fd] text-[#131b2e] hover:bg-[#eaedff]'
                  : 'bg-[#282a30] text-[#e2e2ea] hover:bg-[#373940] border-white/[0.04]'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isLight ? 'text-[#707881]' : 'text-[#94A3B8]'}`}>key</span>
              <span>เข้าร่วมด้วยรหัสห้อง (Room Code)</span>
            </button>
          </div>

          <p className={`font-mono text-xs mt-3 ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>
            (ไม่ต้องสมัครสมาชิก แชร์ลิงก์เข้าใช้งานได้ทันที)
          </p>

          {/* 4 Brand Value Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-12 w-full max-w-4xl">
            <div className={`flex items-center gap-3 p-3.5 rounded-2xl text-left border shadow-sm ${
              isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.04]'
            }`}>
              <span className="material-symbols-outlined text-[#00daf3] text-[24px]">block</span>
              <div>
                <p className={`font-bold text-xs ${isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'}`}>ไม่มีโฆษณาคั่น</p>
                <p className={`text-[11px] ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>ฟังยาวไม่สะดุด</p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-3.5 rounded-2xl text-left border shadow-sm ${
              isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.04]'
            }`}>
              <span className="material-symbols-outlined text-[#ffb955] text-[24px]">queue_music</span>
              <div>
                <p className={`font-bold text-xs ${isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'}`}>Playlist YouTube</p>
                <p className={`text-[11px] ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>จัดคิวเพลงอิสระ</p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-3.5 rounded-2xl text-left border shadow-sm ${
              isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.04]'
            }`}>
              <span className="material-symbols-outlined text-[#10B981] text-[24px]">sync</span>
              <div>
                <p className={`font-bold text-xs ${isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'}`}>ซิงก์เสียงสด</p>
                <p className={`text-[11px] ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>Latency ต่ำพิเศษ</p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-3.5 rounded-2xl text-left border shadow-sm ${
              isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.04]'
            }`}>
              <span className="material-symbols-outlined text-[#0075de] text-[24px]">devices</span>
              <div>
                <p className={`font-bold text-xs ${isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'}`}>ทุกอุปกรณ์</p>
                <p className={`text-[11px] ${isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'}`}>มือถือ / คอม / แท็บเล็ต</p>
              </div>
            </div>
          </div>
        </section>

        {/* Explore & Category Pills Section (From Screen 2) */}
        <section className="w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 pb-20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#06B6D4] text-[24px]">podcasts</span>
              <h2 className="text-xl md:text-2xl font-bold dark:text-[#e2e2ea] text-[#131b2e] tracking-tight">
                ห้องสตรีมสดแนะนำ (Active Rooms)
              </h2>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mb-6">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === c.id
                    ? 'dark:bg-[#a8c8ff] dark:text-[#003061] bg-[#006194] text-white font-bold shadow-md'
                    : 'dark:bg-[#282a30] dark:text-[#c1c6d5] dark:hover:text-[#e2e2ea] dark:hover:bg-[#373940] bg-white border border-[#dae2fd] text-[#475569] hover:text-[#131b2e] hover:bg-[#eaedff] shadow-sm'
                }`}
              >
                <span>{c.label}</span>
                {c.count && (
                  <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                    selectedCategory === c.id ? 'bg-black/20' : 'dark:bg-white/10 bg-black/5'
                  }`}>
                    {c.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Rooms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className="group relative rounded-2xl overflow-hidden dark:bg-[#1d1f26] dark:border-white/[0.06] bg-white border border-[#dae2fd] hover:border-[#00daf3]/50 shadow-md dark:shadow-lg hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col transform hover:-translate-y-1"
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
                  <div className="absolute inset-0 bg-gradient-to-t dark:from-[#1d1f26] from-white/80 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#10B981] font-mono text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                      LIVE
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[11px] font-bold">
                    <span className="material-symbols-outlined text-[14px] text-[#06B6D4]">group</span>
                    <span>{room.onlineCount || 1}</span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base dark:text-[#e2e2ea] text-[#131b2e] dark:group-hover:text-[#00daf3] group-hover:text-[#006194] transition-colors line-clamp-1">
                      {room.name}
                    </h3>
                    <p className="text-xs dark:text-[#94A3B8] text-[#64748b] line-clamp-1 mt-1">
                      {room.currentVideo?.title ? `🎵 ${room.currentVideo.title}` : room.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t dark:border-white/[0.04] border-[#dae2fd]/60">
                    <span className="text-[11px] dark:text-[#c1c6d5] text-[#707881] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#ffb955]">person</span>
                      {room.ownerName || 'DJ Host'}
                    </span>

                    <button className="px-3 py-1.5 rounded-full dark:bg-[#0075de]/20 dark:hover:bg-[#0075de] dark:text-[#a8c8ff] dark:hover:text-white bg-[#eef0ff] hover:bg-[#006194] text-[#006194] hover:text-white text-xs font-bold transition-all flex items-center gap-1">
                      <span>เข้าร่วม</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};
