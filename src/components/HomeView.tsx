import React, { useState } from 'react';
import {
  Search,
  Plus,
  Lock,
  Globe,
  Users,
  Play,
  Crown,
  Sparkles,
  ArrowRight,
  Radio,
  Music,
} from 'lucide-react';
import { PlengLogo } from './PlengLogo.js';
import { RoomSummary, UserProfile } from '../types/index.js';

interface HomeViewProps {
  rooms: RoomSummary[];
  currentUser: UserProfile;
  onSelectRoom: (roomId: string) => void;
  onOpenCreateRoom: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  rooms,
  currentUser,
  onSelectRoom,
  onOpenCreateRoom,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickRoomCode, setQuickRoomCode] = useState('');

  const filteredRooms = rooms.filter((r) => {
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
    <div id="home-view-scroll" className="flex-1 min-h-0 flex flex-col bg-[#0f0f13] text-gray-100 overflow-y-auto">
      {/* Hero Section */}
      <section className="relative px-4 py-8 md:py-14 max-w-6xl mx-auto w-full text-center">
        {/* Decorative Ambient Audio Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-gradient-to-tr from-violet-600/20 via-fuchsia-600/15 to-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* pleng.online Big Logo Display */}
          <div className="hover:scale-105 transition-transform duration-300">
            <PlengLogo size="hero" animated={true} />
          </div>

          {/* Feature Badges Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/40 border border-violet-500/30 text-violet-300 text-xs font-medium backdrop-blur-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ซิงค์เพลงตรงเป๊ะ</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/40 border border-pink-500/30 text-pink-300 text-xs font-medium backdrop-blur-sm shadow-sm">
              <span>🎙️ คุยไมค์สดอิสระ</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-medium backdrop-blur-sm shadow-sm">
              <span>⚡ เข้าได้ทันที ไม่ต้องลงแอป</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
            สเปซฟังเพลงและเปิดคลิป YouTube กับเพื่อนแบบเรียลไทม์ พร้อมห้องคุยไมค์สดและแชท สร้างห้องแล้วส่งลิงก์ชวนเพื่อนเข้ามาร่วมแจมได้ทันที
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={onOpenCreateRoom}
              className="px-6 py-3 rounded-2xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer border border-white/10"
            >
              <Music className="w-4 h-4" />
              <span>สร้างห้องฟังเพลงใหม่</span>
            </button>
          </div>

          {/* Quick Join via Room Code */}
          <form onSubmit={handleQuickJoin} className="pt-2 max-w-md mx-auto w-full">
            <div className="relative flex items-center shadow-lg shadow-black/40">
              <input
                type="text"
                value={quickRoomCode}
                onChange={(e) => setQuickRoomCode(e.target.value)}
                placeholder="มีรหัสห้อง? วางรหัสหรือลิงก์เพื่อเข้าทันที..."
                className="w-full pl-4 pr-24 py-2.5 bg-[#141622]/90 border border-gray-800/80 focus:border-violet-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors backdrop-blur-md"
              />
              <button
                type="submit"
                disabled={!quickRoomCode.trim()}
                className="absolute right-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-30 text-white text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>เข้าห้อง</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="flex-1 max-w-6xl mx-auto w-full px-4 pb-12">
        {rooms.length === 0 ? (
          /* Empty state when no rooms are active */
          <div className="text-center py-16 bg-[#151722]/40 border border-gray-800/60 rounded-2xl p-8 space-y-3 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-400 flex items-center justify-center mx-auto">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-gray-200">
              ยังไม่มีห้องฟังเพลงที่เปิดอยู่ในขณะนี้
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              กดปุ่มสร้างห้องด้านล่างเพื่อเริ่มเปิดเพลง แล้วส่งลิงก์ชวนเพื่อนมาร่วมฟังและคุยกันได้เลย
            </p>
            <button
              onClick={onOpenCreateRoom}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              สร้างห้องแรกเลย
            </button>
          </div>
        ) : (
          <div>
            {/* Header with Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>ห้องฟังเพลงที่กำลังออนไลน์</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h2>
                </div>
                <span className="text-xs text-gray-400 font-mono ml-1">
                  ({filteredRooms.length})
                </span>
              </div>

              {/* Search box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อห้อง, ผู้สร้าง..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#151722] border border-gray-800 focus:border-violet-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Room Grid */}
            {filteredRooms.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                ไม่พบห้องที่ตรงกับคำค้นหา "{searchQuery}"
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => {
                  const isMine = room.ownerId === currentUser.id;

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
                            {room.description || (room.currentVideo?.title ? `กำลังดูคลิป: ${room.currentVideo.title}` : 'เข้ามาร่วมดูด้วยกัน')}
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
          </div>
        )}
      </section>
    </div>
  );
};
