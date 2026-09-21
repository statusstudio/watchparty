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
  Headphones,
  ListMusic,
  Mic2,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Volume2,
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

          {/* Primary SEO Heading */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#000000] tracking-tight max-w-2xl mx-auto leading-snug">
            ฟังเพลงออนไลน์ไม่มีโฆษณา ดู YouTube กับเพื่อน
          </h1>

          {/* Feature Badges Pills - Notion badge-pill specs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e6e6e6] text-[#0075de] text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <span className="w-2 h-2 rounded-full bg-[#0075de] animate-pulse" />
              <span>ฟังเพลงออนไลน์</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e6e6e6] text-[#e02424] text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <span>▶️ ดู YouTube</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e6e6e6] text-[#1aae39] text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <span>🎧 ไม่มีโฆษณาคั่น</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#615d59] max-w-xl mx-auto leading-relaxed">
            สเปซฟังเพลงออนไลน์ไม่มีโฆษณาคั่น จัดคิว Playlist YouTube และดูคลิปพร้อมเพื่อนแบบเรียลไทม์ พร้อมห้องคุยไมค์สดอิสระ สร้างห้องแล้วส่งลิงก์ชวนเพื่อนเข้ามาร่วมแจมได้ทันที ไม่ต้องลงแอป
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

      {/* SEO & Feature Highlights Section - Notion Style */}
      <article className="border-t border-[#e6e6e6] bg-white mt-8 pt-12 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Section 1: 3 Core Pillars */}
          <div className="text-center space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-[#000000]">
              ทำไมต้องฟังเพลงและดู YouTube ที่ pleng.online?
            </h2>
            <p className="text-xs sm:text-sm text-[#615d59] max-w-xl mx-auto">
              ประสบการณ์ฟังเพลงออนไลน์ไม่มีโฆษณาคั่น ซิงค์คลิป YouTube และพูดคุยกับเพื่อนแบบเรียลไทม์ที่ดีที่สุด
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="p-5 rounded-2xl bg-[#f6f5f4] border border-[#e6e6e6] space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#0075de]/10 text-[#0075de] flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#000000]">
                ฟังเพลงออนไลน์ไม่มีโฆษณาคั่น
              </h3>
              <p className="text-xs text-[#615d59] leading-relaxed">
                เปิดเพลงยาวๆ ต่อเนื่องเพื่อทำงาน อ่านหนังสือ หรือปาร์ตี้ ไม่โดนตัดอารมณ์ด้วยโฆษณาคั่น ซิงค์ตรงเป๊ะทุกคนในห้องเหมือนนั่งฟังอยู่ด้วยกัน
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-5 rounded-2xl bg-[#f6f5f4] border border-[#e6e6e6] space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#1aae39]/10 text-[#1aae39] flex items-center justify-center">
                <ListMusic className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#000000]">
                ฟังเพลง Playlist YouTube กับเพื่อน
              </h3>
              <p className="text-xs text-[#615d59] leading-relaxed">
                สร้างและจัดคิวเพลง Playlist YouTube ได้อิสระ ให้เพื่อนๆ ช่วยกันขอเพลง สลับคิวเพลง โหมดเล่นซ้ำ และโหมดสุ่มเพลง ฟังเพลงเป็นกลุ่มได้ไม่จำกัด
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-5 rounded-2xl bg-[#f6f5f4] border border-[#e6e6e6] space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#391c57]/10 text-[#391c57] flex items-center justify-center">
                <Mic2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#000000]">
                คุยไมค์สด 9 ที่นั่ง & ลดเสียงเพลงอัตโนมัติ
              </h3>
              <p className="text-xs text-[#615d59] leading-relaxed">
                ขึ้นเวทีคุยไมค์สดได้ 9 คนพร้อมกัน พร้อมระบบ Auto Audio Ducking หรี่เสียงเพลงอัตโนมัติขณะพูด เสียงไมค์ดังชัดเจน ไม่ต้องลง Discord
              </p>
            </div>
          </div>

          {/* Section 2: FAQ Accordion for Google Rich Snippets */}
          <div className="space-y-4 max-w-3xl mx-auto pt-4">
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-base sm:text-lg font-bold text-[#000000] flex items-center justify-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#0075de]" />
                <span>คำถามที่พบบ่อย (FAQ)</span>
              </h2>
              <p className="text-xs text-[#615d59]">ข้อสงสัยเกี่ยวกับการใช้งาน pleng.online</p>
            </div>

            <div className="space-y-2.5">
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
                  className="rounded-xl border border-[#e6e6e6] bg-[#f6f5f4] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-[#000000] hover:text-[#0075de] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#615d59] transition-transform duration-200 shrink-0 ml-2 ${
                        openFaq === idx ? 'rotate-180 text-[#0075de]' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-3.5 pt-1 text-xs text-[#615d59] leading-relaxed border-t border-[#e6e6e6]/60 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Semantic SEO Keywords Cloud */}
          <div className="pt-6 border-t border-[#e6e6e6] text-center space-y-3">
            <p className="text-[11px] font-medium text-[#a39e98] uppercase tracking-wider">
              คีย์เวิร์ดยอดนิยม
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                'ฟังเพลงออนไลน์ไม่มีโฆษณา',
                'ดู youtube ไม่มีโฆษณา',
                'ฟังเพลงกับเพื่อน',
                'ดู youtube กับเพื่อน',
                'ฟังเพลง playlist youtube',
                'ฟังเพลงเป็นกลุ่ม',
                'watch party ไทย',
                'ห้องฟังเพลงออนไลน์',
                'จัดคิวเพลง youtube',
                'คุยไมค์ฟังเพลง',
              ].map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-[#f6f5f4] border border-[#e6e6e6] text-[11px] text-[#615d59] font-medium"
                >
                  #{kw}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-[#a39e98] pt-2">
              © {new Date().getFullYear()} pleng.online – สเปซฟังเพลงและดูคลิป YouTube กับเพื่อนแบบเรียลไทม์
            </p>
          </div>
        </div>
      </article>
    </div>
  );
};
