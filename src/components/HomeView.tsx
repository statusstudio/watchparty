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
    <div id="home-view-scroll" className="flex-1 min-h-0 flex flex-col bg-[#f6f5f4] text-[#31302e] overflow-y-auto">
      {/* Hero Section - Notion Warm Paper Tone */}
      <section className="relative px-4 py-8 md:py-14 max-w-5xl mx-auto w-full text-center">
        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* pleng.online Big Logo Display */}
          <div className="hover:scale-[1.02] transition-transform duration-200">
            <PlengLogo size="hero" animated={true} />
          </div>

          {/* Feature Badges Pills - Notion badge-pill specs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e6e6e6] text-[#0075de] text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <span className="w-2 h-2 rounded-full bg-[#1aae39] animate-pulse" />
              <span>ซิงค์เพลงตรงเป๊ะ</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e6e6e6] text-[#391c57] text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <span>🎙️ คุยไมค์สดอิสระ</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e6e6e6] text-[#1aae39] text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <span>⚡ เข้าได้ทันที ไม่ต้องลงแอป</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#615d59] max-w-xl mx-auto leading-relaxed">
            สเปซฟังเพลงและเปิดคลิป YouTube กับเพื่อนแบบเรียลไทม์ พร้อมห้องคุยไมค์สดและแชท สร้างห้องแล้วส่งลิงก์ชวนเพื่อนเข้ามาร่วมแจมได้ทันที
          </p>

          {/* Action buttons - Notion Primary Blue Pill */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={onOpenCreateRoom}
              className="px-6 py-2.5 rounded-full font-semibold text-xs sm:text-sm bg-[#0075de] hover:bg-[#005bab] text-white shadow-[0_2px_8px_rgba(0,117,222,0.25)] hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Music className="w-4 h-4" />
              <span>สร้างห้องฟังเพลงใหม่</span>
            </button>
          </div>

          {/* Quick Join via Room Code */}
          <form onSubmit={handleQuickJoin} className="pt-2 max-w-md mx-auto w-full">
            <div className="relative flex items-center shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
              <input
                type="text"
                value={quickRoomCode}
                onChange={(e) => setQuickRoomCode(e.target.value)}
                placeholder="มีรหัสห้อง? วางรหัสหรือลิงก์เพื่อเข้าทันที..."
                className="w-full pl-4 pr-24 py-2.5 bg-white border border-[#e6e6e6] focus:border-[#0075de] rounded-full text-xs text-[#000000] placeholder-[#a39e98] focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!quickRoomCode.trim()}
                className="absolute right-1.5 px-3.5 py-1.5 rounded-full bg-[#0075de] hover:bg-[#005bab] disabled:opacity-30 text-white text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
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
          /* Empty state when no rooms are active - Notion ex-empty-state-card */
          <div className="text-center py-16 bg-white border border-[#e6e6e6] rounded-xl p-8 space-y-3 max-w-md mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-[#0075de]/10 text-[#0075de] flex items-center justify-center mx-auto">
              <Radio className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#000000]">
              ยังไม่มีห้องฟังเพลงที่เปิดอยู่ในขณะนี้
            </p>
            <p className="text-xs text-[#615d59] leading-relaxed">
              กดปุ่มสร้างห้องด้านล่างเพื่อเริ่มเปิดเพลง แล้วส่งลิงก์ชวนเพื่อนมาร่วมฟังและคุยกันได้เลย
            </p>
            <button
              onClick={onOpenCreateRoom}
              className="mt-2 px-5 py-2 rounded-full text-xs font-semibold bg-[#0075de] hover:bg-[#005bab] text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              สร้างห้องแรกเลย
            </button>
          </div>
        ) : (
          <div>
            {/* Header with Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 border-b border-[#e6e6e6] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#0075de]/10 border border-[#0075de]/20 flex items-center justify-center text-[#0075de]">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#000000] flex items-center gap-2">
                    <span>ห้องฟังเพลงที่กำลังออนไลน์</span>
                    <span className="w-2 h-2 rounded-full bg-[#1aae39] animate-pulse" />
                  </h2>
                </div>
                <span className="text-xs text-[#615d59] font-mono ml-1">
                  ({filteredRooms.length})
                </span>
              </div>

              {/* Search box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อห้อง, ผู้สร้าง..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#e6e6e6] focus:border-[#0075de] rounded-md text-xs text-[#000000] placeholder-[#a39e98] focus:outline-none transition-colors shadow-xs"
                />
              </div>
            </div>

            {/* Room Grid */}
            {filteredRooms.length === 0 ? (
              <div className="text-center py-12 text-[#615d59] text-xs">
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
                      className="bg-white border border-[#e6e6e6] hover:border-[#0075de]/50 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 group cursor-pointer flex flex-col"
                    >
                      {/* Thumbnail Banner */}
                      <div className="relative aspect-video bg-[#f6f5f4] overflow-hidden">
                        <img
                          src={room.coverImage || room.currentVideo?.thumbnail || 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80'}
                          alt={room.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-black/20" />

                        {/* Online count badge */}
                        <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-white/90 backdrop-blur-md border border-[#e6e6e6] text-[10px] font-semibold text-[#31302e] flex items-center gap-1 shadow-xs">
                          <Users className="w-3 h-3 text-[#2a9d99]" />
                          <span>{room.onlineCount} คน</span>
                        </div>

                        {/* Privacy badge */}
                        <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md bg-white/90 backdrop-blur-md border border-[#e6e6e6] text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                          {room.isPrivate ? (
                            <>
                              <Lock className="w-3 h-3 text-[#dd5b00]" />
                              <span className="text-[#dd5b00]">ล็อครหัส</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-3 h-3 text-[#1aae39]" />
                              <span className="text-[#1aae39]">สาธารณะ</span>
                            </>
                          )}
                        </div>

                        {/* Play icon overlay on hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-11 h-11 rounded-full bg-[#0075de] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Room Details */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="text-sm font-bold text-[#000000] group-hover:text-[#0075de] transition-colors truncate">
                              {room.name}
                            </h3>
                            {isMine && (
                              <span className="px-1.5 py-0.5 rounded bg-[#dd5b00]/10 text-[#dd5b00] text-[9px] font-bold border border-[#dd5b00]/20 shrink-0">
                                ห้องของฉัน
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#615d59] line-clamp-1">
                            {room.description || (room.currentVideo?.title ? `กำลังดูคลิป: ${room.currentVideo.title}` : 'เข้ามาร่วมดูด้วยกัน')}
                          </p>
                        </div>

                        {/* Footer / Host Info */}
                        <div className="pt-2 border-t border-[#e6e6e6] flex items-center justify-between text-[11px] text-[#615d59]">
                          <div className="flex items-center gap-1.5 truncate">
                            <Crown className="w-3 h-3 text-[#dd5b00] shrink-0" />
                            <span className="truncate">Host: {room.ownerName}</span>
                          </div>

                          <span className="text-[#0075de] font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
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
