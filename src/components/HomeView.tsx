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
} from 'lucide-react';
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
    <div className="min-h-full flex flex-col bg-[#0f0f13] text-gray-100 overflow-y-auto">
      {/* Hero Section */}
      <section className="relative px-4 py-8 md:py-12 max-w-6xl mx-auto w-full text-center">
        {/* Decorative Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-3">
          {/* Sleek Vibe Brand Icon */}
          <div className="inline-flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-xl shadow-violet-500/25 border border-white/20">
              <Sparkles className="w-7 h-7 text-white animate-pulse" />
            </div>
          </div>

          <div className="pt-1">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight flex items-center justify-center gap-1">
              <span>Vibe</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-amber-300">
                .
              </span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-medium backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Watch Together • Open Voice • Real-time Sync
          </div>

          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            ดู YouTube ซิงค์ตรงกันทุกคน พร้อมห้องคุยไมค์อิสระและแชทสด สร้างห้องแล้วส่งลิงก์ชวนเพื่อนได้ทันที
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
          </div>

          {/* Quick Join via Room Code */}
          <form onSubmit={handleQuickJoin} className="pt-3 max-w-md mx-auto w-full">
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

      {/* Rooms Section */}
      <section className="flex-1 max-w-6xl mx-auto w-full px-4 pb-12">
        {rooms.length === 0 ? (
          /* Empty state when no rooms are active */
          <div className="text-center py-16 bg-[#151722]/40 border border-gray-800/60 rounded-2xl p-8 space-y-3 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-400 flex items-center justify-center mx-auto">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-gray-200">
              ยังไม่มีห้องปาร์ตี้ที่เปิดอยู่ในขณะนี้
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              กดปุ่มสร้างห้องด้านล่างเพื่อเริ่มเปิดปาร์ตี้ แล้วส่งลิงก์ชวนเพื่อนมาร่วมดูและคุยกันได้เลย
            </p>
            <button
              onClick={onOpenCreateRoom}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              สร้างห้องปาร์ตี้ตอนนี้
            </button>
          </div>
        ) : (
          <div>
            {/* Header with Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  ห้องที่กำลังออนไลน์ ({filteredRooms.length})
                </h2>
              </div>

              {/* Search box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาห้อง..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#151722] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
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
