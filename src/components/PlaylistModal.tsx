import React, { useState } from 'react';
import {
  X,
  Plus,
  Play,
  Trash2,
  ListMusic,
  Repeat,
  Repeat1,
  Sparkles,
  Search,
  Loader2,
  Check,
  Music,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { PlaylistItem, LoopMode, VideoState } from '../types/index.js';
import { SAMPLE_VIDEOS, CuratedVideo } from '../data/presets.js';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: PlaylistItem[];
  currentVideo: VideoState;
  loopMode: LoopMode;
  isShuffle: boolean;
  onPlayNow: (videoId: string, title?: string, channel?: string) => void;
  onAddToPlaylist: (item: Omit<PlaylistItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
  onClearPlaylist: () => void;
  onSetLoopMode: (mode: LoopMode) => void;
  onToggleShuffle: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  playlist,
  currentVideo,
  loopMode,
  isShuffle,
  onPlayNow,
  onAddToPlaylist,
  onRemoveItem,
  onClearPlaylist,
  onSetLoopMode,
  onToggleShuffle,
  onNextTrack,
  onPrevTrack,
  onShowToast,
}) => {
  const [videoInput, setVideoInput] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'queue' | 'search' | 'add' | 'discover'>(
    playlist.length > 0 ? 'queue' : 'search'
  );

  // YouTube Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{
      videoId: string;
      title: string;
      channel: string;
      duration: string;
      thumbnail: string;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const SUGGESTED_SEARCHES = [
    '🎵 เพลงฮิตไทย',
    'Three Man Down',
    'นนท์ ธนนท์',
    '☕ Lofi Beats',
    'Jeff Satur',
    'Anime OP',
  ];

  const handleSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    if (!q) return;

    if (overrideQuery !== undefined) {
      setSearchQuery(overrideQuery);
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error(err);
      onShowToast('เกิดข้อผิดพลาดในการค้นหา YouTube', 'warning');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchItemAction = (
    item: { videoId: string; title: string; channel: string; duration: string; thumbnail: string },
    playImmediately: boolean
  ) => {
    if (playImmediately) {
      onPlayNow(item.videoId, item.title, item.channel);
      onShowToast(`กำลังเล่น: ${item.title}`, 'success');
      onClose();
    } else {
      onAddToPlaylist({
        videoId: item.videoId,
        title: item.title,
        channel: item.channel,
        thumbnail: item.thumbnail,
        duration: item.duration || 'Custom',
        addedBy: 'Me',
      });
      setAddedItemIds((prev) => ({ ...prev, [item.videoId]: true }));
      setTimeout(() => {
        setAddedItemIds((prev) => {
          const next = { ...prev };
          delete next[item.videoId];
          return next;
        });
      }, 2500);
      onShowToast(`เพิ่ม "${item.title}" เข้าคิวแล้ว`, 'success');
    }
  };

  if (!isOpen) return null;

  // Extracts YouTube 11-char ID
  const extractVideoId = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Direct ID check (standard 11 characters alphanumeric + _ -)
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    // URL regex match
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);

    if (match && match[2].length === 11) {
      return match[2];
    }

    return null;
  };

  const handleAddOrPlay = (playImmediately: boolean) => {
    const vid = extractVideoId(videoInput);
    if (!vid) {
      onShowToast('กรุณาระบุ YouTube URL หรือ Video ID 11 ตัวอักษรที่ถูกต้อง', 'warning');
      return;
    }

    const title = customTitle.trim() || `YouTube Video (${vid})`;
    const thumbnail = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;

    if (playImmediately) {
      onPlayNow(vid, title, 'YouTube');
      onClose();
    } else {
      onAddToPlaylist({
        videoId: vid,
        title,
        channel: 'YouTube User',
        thumbnail,
        duration: 'Custom',
        addedBy: 'Me',
      });
      setVideoInput('');
      setCustomTitle('');
      setActiveTab('queue');
    }
  };

  const handleCuratedAction = (video: CuratedVideo, playImmediately: boolean) => {
    if (playImmediately) {
      onPlayNow(video.videoId, video.title, video.channel);
      onClose();
    } else {
      onAddToPlaylist({
        videoId: video.videoId,
        title: video.title,
        channel: video.channel,
        thumbnail: video.thumbnail,
        duration: video.duration,
        addedBy: 'Curated',
      });
      setActiveTab('queue');
    }
  };

  const cycleLoopMode = () => {
    const next: Record<LoopMode, LoopMode> = {
      off: 'all',
      all: 'single',
      single: 'off',
    };
    const newMode = next[loopMode];
    onSetLoopMode(newMode);

    const labels = {
      off: 'ปิดการเล่นวนซ้ำ',
      all: 'เล่นวนซ้ำทั้งคิว (Loop All)',
      single: 'เล่นวนซ้ำเพลงเดียว (Loop Single)',
    };
    onShowToast(labels[newMode], 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#151722] border border-gray-800/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">จัดการคิวเพลง & Playlist</h2>
              <p className="text-xs text-gray-400">ค้นหา เพิ่มเพลงใหม่ หรือจัดการคิวที่กำลังเล่น</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Loop Mode */}
        <div className="px-6 py-2.5 bg-[#10121a] border-b border-gray-800/60 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'queue'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              คิวเพลง ({playlist.length})
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'search'
                  ? 'bg-gradient-to-r from-red-600/25 to-purple-600/25 text-rose-300 border border-red-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-rose-400" />
              ค้นหาใน YouTube
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'add'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              + วางลิงก์
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'discover'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              เพลงฮิตแนะนำ
            </button>
          </div>

          {/* Playback controls: Shuffle, Loop, Prev, Next */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Shuffle Button */}
            <button
              type="button"
              onClick={onToggleShuffle}
              title={isShuffle ? 'สุ่มเพลง: เปิดอยู่ (คลิกเพื่อปิด)' : 'สุ่มเพลง: ปิดอยู่ (คลิกเพื่อเปิด)'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isShuffle
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-gray-200'
              }`}
            >
              <Shuffle className={`w-3.5 h-3.5 ${isShuffle ? 'text-amber-400' : 'opacity-60'}`} />
              <span className="text-[10px] hidden sm:inline">{isShuffle ? 'สุ่ม: เปิด' : 'สุ่ม'}</span>
            </button>

            {/* Loop Mode Switcher */}
            <button
              type="button"
              onClick={cycleLoopMode}
              title="สลับโหมดการเล่นวนซ้ำ"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                loopMode !== 'off'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-gray-200'
              }`}
            >
              {loopMode === 'single' ? (
                <>
                  <Repeat1 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px]">ซ้ำเพลงเดิม</span>
                </>
              ) : loopMode === 'all' ? (
                <>
                  <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px]">วนทั้งคิว</span>
                </>
              ) : (
                <>
                  <Repeat className="w-3.5 h-3.5 opacity-60" />
                  <span className="text-[10px]">รอบเดียว</span>
                </>
              )}
            </button>

            {/* Track Navigation (Prev / Next) */}
            <div className="flex items-center gap-1 pl-1 border-l border-gray-800">
              <button
                type="button"
                onClick={onPrevTrack}
                title="เพลงก่อนหน้า"
                disabled={playlist.length === 0}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onNextTrack}
                title="ข้ามไปเพลงถัดไป"
                disabled={playlist.length === 0}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Queue */}
          {activeTab === 'queue' && (
            <div className="space-y-3">
              {/* Currently Playing Card */}
              <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl flex items-center gap-3">
                <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-black shrink-0">
                  <img
                    src={`https://i.ytimg.com/vi/${currentVideo.videoId}/hqdefault.jpg`}
                    alt={currentVideo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="w-4 h-4 text-emerald-400 fill-emerald-400 animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    กำลังเล่นอยู่ขณะนี้ (Now Playing)
                  </span>
                  <p className="text-xs font-semibold text-white truncate">
                    {currentVideo.title}
                  </p>
                  <p className="text-[11px] text-gray-400">{currentVideo.channel}</p>
                </div>
              </div>

              {/* Queue List */}
              <div className="flex items-center justify-between pt-2">
                <h4 className="text-xs font-semibold text-gray-300">
                  รายการเพลงในคิว ({playlist.length})
                </h4>
                {playlist.length > 0 && (
                  <button
                    onClick={onClearPlaylist}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    ล้างคิวทั้งหมด
                  </button>
                )}
              </div>

              {playlist.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  ยังไม่มีเพลงในคิว กดแท็บ "+ วางลิงก์ YouTube" หรือ "เพลงฮิตแนะนำ" เพื่อเพิ่มได้เลย
                </div>
              ) : (
                <div className="space-y-2">
                  {playlist.map((item, index) => {
                    const isCurrent = item.videoId === currentVideo.videoId;
                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 transition-colors ${
                          isCurrent
                            ? 'bg-purple-500/10 border-purple-500/40'
                            : 'bg-[#1a1d2d]/60 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <span className="text-xs font-mono text-gray-500 w-4 text-center">
                          {index + 1}
                        </span>

                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-black shrink-0">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-200 truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            <span>{item.channel}</span>
                            <span>•</span>
                            <span>{item.duration}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onPlayNow(item.videoId, item.title, item.channel);
                              onClose();
                            }}
                            title="เล่นทันที"
                            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-purple-600/30 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            title="ลบออกจากคิว"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: Search YouTube Directly */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              {/* Search Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="space-y-2.5"
              >
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อเพลง, ศิลปิน หรือวางลิงก์ YouTube..."
                    autoFocus
                    className="w-full pl-10 pr-28 py-2.5 bg-[#0f0f13] border border-gray-700/80 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-20 text-gray-500 hover:text-gray-300 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="absolute right-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>ค้นหา...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>ค้นหา</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick suggestion chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 mr-0.5">
                    <Sparkles className="w-3 h-3 text-amber-400" /> แนะนำ:
                  </span>
                  {SUGGESTED_SEARCHES.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSearch(tag)}
                      className="px-2.5 py-0.5 rounded-full bg-gray-800/80 hover:bg-gray-700 border border-gray-700/60 text-[11px] text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </form>

              {/* Search States & Results */}
              {isSearching ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                  <p className="text-xs">กำลังค้นหาคลิปจาก YouTube แบบเรียลไทม์...</p>
                </div>
              ) : hasSearched && searchResults.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <p className="text-sm font-medium text-gray-300">
                    ไม่พบผลลัพธ์สำหรับ "{searchQuery}"
                  </p>
                  <p className="text-xs text-gray-500">
                    ลองตรวจสอบคำสะกด หรือสลับไปแท็บ "+ วางลิงก์" เพื่อใช้วิดีโอ ID โดยตรง
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-medium text-gray-400">
                      ผลการค้นหา ({searchResults.length} รายการ)
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {searchResults.map((item) => (
                      <div
                        key={item.videoId}
                        className="p-2.5 rounded-xl bg-[#1a1d2d]/70 border border-gray-800/80 hover:border-gray-700/90 flex items-center gap-3 transition-all group"
                      >
                        {/* Thumbnail with duration */}
                        <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-black/50">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {item.duration && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[10px] font-mono text-gray-200 leading-none">
                              {item.duration}
                            </span>
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-semibold text-gray-200 line-clamp-2 group-hover:text-rose-300 transition-colors"
                            title={item.title}
                          >
                            {item.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
                            <span className="truncate max-w-[160px]">{item.channel}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSearchItemAction(item, true)}
                            className="px-2.5 py-1.5 rounded-lg text-xs bg-gradient-to-r from-red-600/30 to-rose-600/30 hover:from-red-600/50 hover:to-rose-600/50 text-rose-200 border border-red-500/40 flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="เล่นทันทีสำหรับทุกคนในห้อง"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>เล่นเลย</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSearchItemAction(item, false)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs border flex items-center gap-1 transition-all cursor-pointer ${
                              addedItemIds[item.videoId]
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                            }`}
                            title="เพิ่มเพลงนี้ต่อท้ายคิว"
                          >
                            {addedItemIds[item.videoId] ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-[11px]">เพิ่มแล้ว</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span className="text-[11px]">ต่อคิว</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Initial Welcome State */
                <div className="py-8 text-center space-y-3 bg-[#11131c]/60 rounded-xl border border-gray-800/60 p-6">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-red-600/20 to-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/30">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      ค้นหาเพลงหรือคลิปที่ชอบได้ทันที
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      พิมพ์ชื่อเพลง ศิลปิน หรือแนวเพลงที่ต้องการลงในช่องค้นหาด้านบน แล้วกด Enter เพื่อค้นหาบน YouTube
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Add by URL / ID */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  วาง YouTube URL หรือ Video ID
                </label>
                <input
                  type="text"
                  value={videoInput}
                  onChange={(e) => setVideoInput(e.target.value)}
                  placeholder="เช่น https://www.youtube.com/watch?v=jfKfPfyJRdk หรือ jfKfPfyJRdk"
                  className="w-full px-3.5 py-2.5 bg-[#0f0f13] border border-gray-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  ชื่อวิดีโอ / เพลง (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="ระบุชื่อเพื่อให้เพื่อนๆ จำได้ง่าย"
                  className="w-full px-3.5 py-2.5 bg-[#0f0f13] border border-gray-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleAddOrPlay(true)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-xs bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  เล่นทันทีทุกคน (Play Now)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddOrPlay(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มเข้า Playlist
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Discover Curated Videos */}
          {activeTab === 'discover' && (
            <div className="space-y-2.5">
              <p className="text-xs text-gray-400 mb-2">
                เลือกวิดีโอและเพลย์ลิสต์ยอดนิยมเพื่อเปิดดูพร้อมกันทันที:
              </p>
              {SAMPLE_VIDEOS.map((video) => (
                <div
                  key={video.videoId}
                  className="p-2.5 rounded-xl bg-[#1a1d2d]/60 border border-gray-800 hover:border-gray-700 flex items-center gap-3 transition-colors"
                >
                  <div className="w-16 h-10 rounded-lg overflow-hidden bg-black shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-200 truncate">{video.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>{video.channel}</span>
                      <span>•</span>
                      <span>{video.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCuratedAction(video, true)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      เล่นทันที
                    </button>
                    <button
                      onClick={() => handleCuratedAction(video, false)}
                      className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                      title="เพิ่มเข้า Playlist"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
