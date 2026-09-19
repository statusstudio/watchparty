import React, { useState } from 'react';
import {
  Search,
  Plus,
  Tv,
  Lock,
  Globe,
  Users,
  Play,
  Crown,
  Sparkles,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { RoomSummary, UserProfile, RoomCategory } from '../types/index.js';
import { ROOM_CATEGORIES } from '../data/presets.js';

interface HomeViewProps {
  rooms: RoomSummary[];
  currentUser: UserProfile;
  onSelectRoom: (roomId: string) => void;
  onOpenCreateRoom: () => void;
  onOpenAuth: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  rooms,
  currentUser,
  onSelectRoom,
  onOpenCreateRoom,
  onOpenAuth,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'my'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | RoomCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickRoomCode, setQuickRoomCode] = useState('');

  const isGoogleLoggedIn = currentUser.provider === 'google';

  const filteredRooms = rooms.filter((r) => {
    if (filterTab === 'my') {
      if (r.ownerId !== currentUser.id) return false;
    }
    if (selectedCategory !== 'all') {
      if ((r.category || 'general') !== selectedCategory) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        r.ownerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickRoomCode.trim();
    if (!trimmed) return;

    // Handle full URL or room code
    const match = trimmed.match(/room=([a-zA-Z0-9_-]+)/);
    const targetRoomId = match ? match[1] : trimmed;
    onSelectRoom(targetRoomId);
  };

  return (
    <div className="min-h-full flex flex-col bg-[#0f0f13] text-gray-100 overflow-y-auto">
      {/* Hero Section */}
      <section className="relative px-4 py-8 md:py-12 max-w-6xl mx-auto w-full text-center">
        {/* Decorative Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Featured Photo with Glowing Aura */}
          <div className="relative inline-block mx-auto group">
            {/* Glowing Gradient Aura */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-amber-400 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse" />

            {/* Image Frame */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
              <img
                src="/tengpan.jpg"
                alt="เตงป่านดื้อ"
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Cute Badge */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[11px] font-bold shadow-lg flex items-center gap-1 border border-white/30 whitespace-nowrap">
              <span>💖 เตงป่านดื้อ</span>
            </div>
          </div>

          <div className="pt-2">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span className="text-white">เตง</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-amber-300">
                ป่านดื้อ
              </span>
              <span className="text-2xl sm:text-4xl animate-bounce">✨</span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            ห้องดู YouTube ซิงค์ตรงกัน พร้อมเวทีไมค์ 9 ที่นั่ง & ซาวด์บอร์ดสด
          </div>

          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            สร้างห้องปาร์ตี้ส่วนตัว ล็อครหัสผ่าน หรือเข้าร่วมห้องสาธารณะเพื่อฟังเพลงและคุยไมค์กับเพื่อนแบบเรียลไทม์
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenCreateRoom}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              สร้างห้องปาร์ตี้ใหม่
            </button>

            {!isGoogleLoggedIn && (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>เข้าสู่ระบบด้วย Gmail</span>
              </button>
            )}
          </div>

          {/* Quick Join via Room Code */}
          <form onSubmit={handleQuickJoin} className="pt-3 max-w-md mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                value={quickRoomCode}
                onChange={(e) => setQuickRoomCode(e.target.value)}
                placeholder="มีรหัสห้อง? วางรหัสหรือลิงก์เพื่อเข้าทันที..."
                className="w-full pl-3.5 pr-24 py-2.5 bg-[#151722] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!quickRoomCode.trim()}
                className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>เข้าห้อง</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Rooms Directory Section */}
      <section className="flex-1 max-w-6xl mx-auto w-full px-4 pb-12">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              ห้องสาธารณะทั้งหมด ({rooms.length})
            </button>

            <button
              onClick={() => setFilterTab('my')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                filterTab === 'my'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              ห้องของฉัน ({rooms.filter((r) => r.ownerId === currentUser.id).length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อห้องหรือเจ้าของ..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#151722] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-[#151722] text-gray-400 hover:text-gray-200 border border-gray-800'
            }`}
          >
            🔥 ทั้งหมด
          </button>
          {ROOM_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-[#151722] text-gray-400 hover:text-gray-200 border border-gray-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Room Grid */}
        {filteredRooms.length === 0 ? (
          <div className="text-center py-16 bg-[#151722]/50 border border-gray-800/80 rounded-2xl p-8 space-y-3">
            <Radio className="w-10 h-10 text-gray-600 mx-auto animate-pulse" />
            <p className="text-sm font-semibold text-gray-300">
              {filterTab === 'my'
                ? 'คุณยังไม่ได้สร้างห้องปาร์ตี้'
                : 'ไม่พบห้องที่ตรงกับการค้นหา'}
            </p>
            <p className="text-xs text-gray-500">
              กดปุ่มด้านล่างเพื่อสร้างห้องปาร์ตี้ห้องแรกของคุณได้เลย
            </p>
            <button
              onClick={onOpenCreateRoom}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
            >
              + สร้างห้องปาร์ตี้ตอนนี้
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => {
              const isMine = room.ownerId === currentUser.id;
              const catObj = ROOM_CATEGORIES.find((c) => c.id === room.category);

              return (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room.id)}
                  className="bg-[#151722] border border-gray-800/80 hover:border-purple-500/50 rounded-2xl overflow-hidden shadow-lg transition-all hover:-translate-y-1 group cursor-pointer flex flex-col"
                >
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={room.coverImage || room.currentVideo?.thumbnail || 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80'}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151722] via-transparent to-black/40" />

                    {/* Online count badge */}
                    <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white flex items-center gap-1">
                      <Users className="w-3 h-3 text-cyan-400" />
                      <span>{room.onlineCount} คน</span>
                    </div>

                    {/* Privacy badge */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-semibold flex items-center gap-1">
                      {room.isPrivate ? (
                        <>
                          <Lock className="w-3 h-3 text-purple-400" />
                          <span className="text-purple-300">ล็อครหัส</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300">สาธารณะ</span>
                        </>
                      )}
                    </div>

                    {/* Category badge */}
                    <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-purple-300 flex items-center gap-1">
                      <span>{catObj?.icon || '☕'}</span>
                      <span>{catObj?.label || 'ทั่วไป'}</span>
                    </div>

                    {/* Play icon overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-xl shadow-purple-900/50 transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                          {room.name}
                        </h3>
                        {isMine && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30 shrink-0">
                            ห้องของฉัน
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 line-clamp-1">
                        {room.description || `กำลังดูคลิป: ${room.currentVideo.title}`}
                      </p>
                    </div>

                    {/* Footer / Host Info */}
                    <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">Host: {room.ownerName}</span>
                      </div>

                      <span className="text-purple-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                        เข้าห้อง <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
