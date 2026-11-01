import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Tv,
  Play,
  Plus,
  Radio,
  Globe2,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Flame,
  Film,
  Newspaper,
  Trophy,
  GraduationCap,
  Music2,
  HeartHandshake,
} from 'lucide-react';
import { IPTV_CHANNELS, COUNTRY_OPTIONS, LiveChannel } from '../data/iptvChannels.js';
import { VideoState } from '../types/index.js';

interface LiveTVModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideo?: VideoState;
  onPlayChannel: (channel: LiveChannel) => void;
  onAddToQueue?: (channel: LiveChannel) => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

const GENRE_FILTERS = [
  { id: 'ALL', label: 'ทั้งหมด', icon: Globe2 },
  { id: 'Sports', label: 'กีฬา', icon: Trophy },
  { id: 'News', label: 'ข่าวสาร', icon: Newspaper },
  { id: 'Entertainment', label: 'บันเทิง', icon: Flame },
  { id: 'Education', label: 'การศึกษา', icon: GraduationCap },
  { id: 'Music', label: 'เพลง', icon: Music2 },
  { id: 'Movies', label: 'ภาพยนตร์', icon: Film },
  { id: 'Religious', label: 'ศาสนา', icon: HeartHandshake },
];

export const LiveTVModal: React.FC<LiveTVModalProps> = ({
  isOpen,
  onClose,
  currentVideo,
  onPlayChannel,
  onAddToQueue,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('TH'); // Default to Thailand 🇹🇭
  const [selectedGenre, setSelectedGenre] = useState('ALL');

  const filteredChannels = useMemo(() => {
    let list = IPTV_CHANNELS;

    // Filter by Country
    if (selectedCountry !== 'ALL') {
      if (selectedCountry === 'OTHER') {
        const majorCodes = ['TH', 'KR', 'JP', 'US', 'VN', 'ID', 'LA', 'KH', 'IN', 'BR', 'GR', 'FR'];
        list = list.filter((c) => !majorCodes.includes(c.countryCode));
      } else {
        list = list.filter((c) => c.countryCode === selectedCountry);
      }
    }

    // Filter by Genre
    if (selectedGenre !== 'ALL') {
      list = list.filter((c) => c.category.toLowerCase().includes(selectedGenre.toLowerCase()));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tvgId.toLowerCase().includes(q) ||
          c.countryName.toLowerCase().includes(q) ||
          c.categoryLabel.toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedCountry, selectedGenre, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-white dark:bg-[#191b22] rounded-2xl shadow-2xl border border-[#e6e6e6] dark:border-white/[0.08] flex flex-col h-[92vh] max-h-[860px] overflow-hidden animate-scale-up text-[#31302e] dark:text-[#e2e2ea]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e6e6e6] dark:border-white/[0.08] bg-white dark:bg-[#191b22] shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0075de]/10 border border-[#0075de]/20 text-[#0075de] flex items-center justify-center shadow-xs shrink-0">
                <Tv className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-[#111111] dark:text-white tracking-tight">
                    ทีวีดิจิทัล & ถ่ายทอดสดออนไลน์ (Live TV)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#0075de] text-white text-[10px] font-bold tracking-wide flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    LIVE SYNC
                  </span>
                </div>
                <p className="text-xs text-[#615d59] dark:text-[#94a3b8] mt-0.5">
                  เลือกช่องเพื่อดูออนไลน์พร้อมกันกับเพื่อนในห้องแบบเรียลไทม์ • ครบ 623 ช่องทั่วโลก
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#615d59] dark:text-[#94a3b8] hover:text-[#111111] dark:hover:text-white hover:bg-[#f6f5f4] dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="mt-3.5 relative">
            <Search className="w-4 h-4 text-[#615d59] dark:text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อช่อง เช่น 3HD, ช่อง 7, MONO, PPTV, ไทยรัฐ, DLTV..."
              className="w-full pl-10 pr-9 py-2 bg-[#f6f5f4] dark:bg-[#111319] rounded-xl border border-[#e6e6e6] dark:border-white/[0.08] text-xs sm:text-sm text-[#111111] dark:text-white placeholder:text-[#615d59] dark:placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#615d59] dark:text-[#94a3b8] hover:text-[#111111] dark:hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Navigation Bar (Country & Genre) */}
        <div className="p-3 sm:px-5 border-b border-[#e6e6e6] dark:border-white/[0.08] bg-white/95 dark:bg-[#191b22]/95 backdrop-blur-xs space-y-2 shrink-0">
          {/* Country Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span className="text-[11px] font-semibold text-[#615d59] dark:text-[#94a3b8] whitespace-nowrap mr-1">ประเทศ:</span>
            {COUNTRY_OPTIONS.map((item) => {
              const isSelected = selectedCountry === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelectedCountry(item.code)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-[#0075de] text-white shadow-xs font-semibold'
                      : 'bg-[#f6f5f4] dark:bg-white/5 text-[#615d59] dark:text-[#94a3b8] hover:bg-[#eceae8] dark:hover:bg-white/10 hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-[#615d59] dark:text-[#94a3b8]'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Genre Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[11px] font-semibold text-[#615d59] dark:text-[#94a3b8] whitespace-nowrap mr-1">หมวดหมู่:</span>
            {GENRE_FILTERS.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedGenre === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedGenre(item.id)}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium text-[11px] transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    isSelected
                      ? 'bg-[#0075de]/15 border border-[#0075de]/40 text-[#0075de] dark:text-[#00daf3] shadow-xs font-semibold'
                      : 'bg-[#f6f5f4] dark:bg-white/5 text-[#615d59] dark:text-[#94a3b8] hover:bg-[#eceae8] dark:hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body: Channel Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-[#fafafa] dark:bg-[#111319]">
          <div className="flex items-center justify-between mb-3 text-xs text-[#615d59] dark:text-[#94a3b8]">
            <span>
              พบทั้งหมด <strong className="text-[#111111] dark:text-white font-bold">{filteredChannels.length}</strong> ช่อง
            </span>
            <span className="text-[11px] text-[#615d59] dark:text-[#94a3b8]">
              แตะช่องที่ต้องการเพื่อเริ่มถ่ายทอดสดในห้องปาร์ตี้ทันที
            </span>
          </div>

          {filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-[#615d59] dark:text-[#94a3b8]">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3 text-[#615d59] dark:text-[#94a3b8]">
                <Tv className="w-6 h-6 opacity-60" />
              </div>
              <p className="text-sm font-semibold text-[#111111] dark:text-white">ไม่พบช่องสัญญาณที่ตรงกับคำค้นหา</p>
              <p className="text-xs text-[#615d59] dark:text-[#94a3b8] mt-1">
                ลองค้นหาด้วยชื่ออื่น หรือเปลี่ยนประเทศและหมวดหมู่ด้านบน
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCountry('ALL');
                  setSelectedGenre('ALL');
                }}
                className="mt-4 px-4 py-1.5 rounded-full bg-[#f6f5f4] dark:bg-white/5 hover:bg-[#eceae8] dark:hover:bg-white/10 text-[#111111] dark:text-white text-xs font-medium cursor-pointer transition-colors border border-[#e6e6e6] dark:border-white/[0.08]"
              >
                ล้างการค้นหา
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {filteredChannels.map((channel) => {
                const isCurrentlyPlaying =
                  currentVideo?.streamUrl === channel.streamUrl ||
                  currentVideo?.videoId === channel.id;

                return (
                  <div
                    key={channel.id}
                    className={`group relative bg-white dark:bg-[#191b22] rounded-2xl p-3 border transition-all duration-200 flex flex-col justify-between hover:shadow-md ${
                      isCurrentlyPlaying
                        ? 'border-[#0075de] ring-2 ring-[#0075de]/20 bg-[#0075de]/5 dark:bg-[#0075de]/10'
                        : 'border-[#e6e6e6] dark:border-white/[0.08] hover:border-[#0075de]/40'
                    }`}
                  >
                    {/* Top Row: Logo & Badges */}
                    <div className="flex items-start gap-3">
                      {/* Logo Container */}
                      <div className="w-12 h-12 rounded-xl bg-[#f6f5f4] dark:bg-white/5 border border-[#e6e6e6] dark:border-white/[0.08] p-1 flex items-center justify-center shrink-0 overflow-hidden relative">
                        {channel.logo ? (
                          <img
                            src={channel.logo}
                            alt={channel.name}
                            loading="lazy"
                            onError={(e) => {
                              // Fallback on broken image
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                            className="w-full h-full object-contain"
                          />
                        ) : null}
                        <Tv className="w-5 h-5 text-[#615d59] dark:text-[#94a3b8] absolute pointer-events-none opacity-40" style={{ zIndex: 0 }} />
                      </div>

                      {/* Name & Metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3
                            className="text-xs sm:text-sm font-bold text-[#111111] dark:text-white truncate group-hover:text-[#0075de] transition-colors"
                            title={channel.name}
                          >
                            {channel.name}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#f6f5f4] dark:bg-white/5 text-[#615d59] dark:text-[#94a3b8] font-medium truncate max-w-[120px]">
                            {channel.countryName.split(' ')[0]} {channel.countryCode}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#0075de]/10 text-[#0075de] dark:text-[#00daf3] font-medium">
                            {channel.categoryLabel.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="mt-3 pt-2.5 border-t border-[#e6e6e6] dark:border-white/[0.08] flex items-center justify-between gap-1.5">
                      {isCurrentlyPlaying ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0075de] dark:text-[#00daf3] py-1">
                          <span className="w-2 h-2 rounded-full bg-[#0075de] dark:bg-[#00daf3] animate-ping" />
                          <span>กำลังถ่ายทอดสดอยู่ในห้อง 🔴</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onPlayChannel(channel);
                            if (onShowToast) {
                              onShowToast(`สลับไปรับชม "${channel.name}" สดพร้อมกันทั้งห้องแล้ว 📺`, 'success');
                            }
                            onClose();
                          }}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>เปิดดูในห้องนี้</span>
                        </button>
                      )}

                      {onAddToQueue && (
                        <button
                          type="button"
                          onClick={() => {
                            onAddToQueue(channel);
                            if (onShowToast) {
                              onShowToast(`เพิ่ม "${channel.name}" ลงในคิวเรียบร้อย ➕`, 'info');
                            }
                          }}
                          title="เพิ่มในคิว"
                          className="p-1.5 rounded-xl border border-[#e6e6e6] dark:border-white/[0.08] text-[#615d59] dark:text-[#94a3b8] hover:text-[#0075de] hover:bg-[#f6f5f4] dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 px-5 border-t border-[#e6e6e6] dark:border-white/[0.08] bg-white dark:bg-[#191b22] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#615d59] dark:text-[#94a3b8] shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 px-1.5 rounded-md bg-[#0075de]/10 text-[#0075de] dark:text-[#00daf3] font-bold text-[10px]">INFO</span>
            <span>สัญญาณถ่ายทอดสด HLS (.m3u8) จะซิงค์ภาพให้ทุกคนในห้องดูพร้อมกันแบบ Real-time</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#615d59] dark:text-[#94a3b8]">
            <span>หมวดแนะนำ: 🇹🇭 ฟรีทีวีไทย • ⚽ ฟุตบอล/กีฬา • 🎓 DLTV</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LiveTVModal;
