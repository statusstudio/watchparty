import React, { useState } from 'react';
import {
  Search,
  Plus,
  Play,
  Trash2,
  ListMusic,
  Repeat,
  Repeat1,
  Shuffle,
  SkipForward,
  Music,
  Sparkles,
  Link,
  Clock,
  Check,
} from 'lucide-react';
import { PlaylistItem, VideoState, LoopMode, UserRole, UserProfile } from '../types/index.js';

interface SidebarQueueProps {
  playlist: PlaylistItem[];
  currentVideo: VideoState;
  loopMode: LoopMode;
  isShuffle: boolean;
  myRole: UserRole;
  currentUser?: UserProfile;
  onlyAdminManagePlaylist: boolean;
  onPlayNow: (videoId: string, title?: string, channel?: string) => void;
  onAddToPlaylist: (item: Omit<PlaylistItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
  onClearPlaylist: () => void;
  onSetLoopMode: (mode: LoopMode) => void;
  onToggleShuffle: () => void;
  onNextTrack: () => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export const SidebarQueue: React.FC<SidebarQueueProps> = ({
  playlist,
  currentVideo,
  loopMode,
  isShuffle,
  myRole,
  currentUser,
  onlyAdminManagePlaylist,
  onPlayNow,
  onAddToPlaylist,
  onRemoveItem,
  onClearPlaylist,
  onSetLoopMode,
  onToggleShuffle,
  onNextTrack,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'search'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [directUrl, setDirectUrl] = useState('');
  const [addedVideoIds, setAddedVideoIds] = useState<Set<string>>(new Set());

  const canManagePlaylist = !onlyAdminManagePlaylist || myRole === 'owner' || myRole === 'admin';

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Check if input is a direct YouTube link
    const ytMatch = q.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) {
      if (!canManagePlaylist) {
        onShowToast('เฉพาะเจ้าของห้องหรือแอดมินเท่านั้นที่สามารถเพิ่มเพลงได้ ⚠️', 'warning');
        return;
      }
      const videoId = ytMatch[1];
      onAddToPlaylist({
        videoId,
        title: 'YouTube Video',
        channel: 'YouTube',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: 'YouTube',
        addedBy: currentUser?.name || 'คุณ',
      });
      onShowToast('เพิ่มคลิปเข้าคิวเพลงแล้ว 🎵', 'success');
      setSearchQuery('');
      setActiveTab('queue');
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      onShowToast('ค้นหาไม่สำเร็จ โปรดลองใหม่', 'warning');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddTrack = (res: any) => {
    if (!canManagePlaylist) {
      onShowToast('เฉพาะเจ้าของห้องหรือแอดมินเท่านั้นที่สามารถเพิ่มเพลงได้ ⚠️', 'warning');
      return;
    }

    onAddToPlaylist({
      videoId: res.videoId,
      title: res.title,
      channel: res.channel,
      thumbnail: res.thumbnail,
      duration: res.duration || '0:00',
      addedBy: currentUser?.name || 'คุณ',
    });
    setAddedVideoIds((prev) => new Set([...prev, res.videoId]));
    onShowToast(`เพิ่ม "${res.title.substring(0, 30)}..." เข้าคิวแล้ว 🎵`, 'success');
    setTimeout(() => {
      setAddedVideoIds((prev) => {
        const next = new Set(prev);
        next.delete(res.videoId);
        return next;
      });
    }, 2000);
  };

  const handleDirectUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManagePlaylist) {
      onShowToast('เฉพาะเจ้าของห้องหรือแอดมินเท่านั้นที่สามารถเพิ่มเพลงได้ ⚠️', 'warning');
      return;
    }
    const match = directUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) {
      const videoId = match[1];
      onAddToPlaylist({
        videoId,
        title: 'YouTube Video',
        channel: 'YouTube',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: 'YouTube',
        addedBy: currentUser?.name || 'คุณ',
      });
      onShowToast('เพิ่มคลิปเข้าคิวเรียบร้อย 🎵', 'success');
      setDirectUrl('');
      setActiveTab('queue');
    } else {
      onShowToast('ลิงก์ YouTube ไม่ถูกต้อง', 'warning');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-[#31302e] overflow-hidden">
      {/* Sub-Header Tabs: Queue vs Search */}
      <div className="p-2 border-b border-[#e6e6e6] bg-[#f6f5f4] flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-white text-[#0075de] border border-[#e6e6e6] shadow-xs'
              : 'text-[#615d59] hover:text-[#000000] hover:bg-black/5'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5" />
          <span>คิวเพลง</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#f6f5f4] text-[#615d59] text-[10px] font-mono border border-[#e6e6e6]">
            {playlist.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'bg-white text-[#0075de] border border-[#e6e6e6] shadow-xs'
              : 'text-[#615d59] hover:text-[#000000] hover:bg-black/5'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>ค้นหาเพลง</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {/* ==================== QUEUE TAB ==================== */}
        {activeTab === 'queue' && (
          <>
            {/* Quick URL Input Bar */}
            <form onSubmit={handleDirectUrlSubmit} className="relative flex items-center">
              <input
                type="text"
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder="วางลิงก์ YouTube ที่นี่..."
                className="w-full pl-8 pr-16 py-1.5 bg-white border border-[#e6e6e6] rounded-full text-xs text-[#000000] placeholder-[#a39e98] focus:outline-none focus:border-[#0075de] shadow-xs"
              />
              <Link className="w-3.5 h-3.5 text-[#a39e98] absolute left-2.5" />
              <button
                type="submit"
                disabled={!directUrl.trim()}
                className="absolute right-1 px-2.5 py-1 rounded-full bg-[#0075de] hover:bg-[#005bab] disabled:opacity-30 text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                เพิ่ม
              </button>
            </form>

            {/* Currently Playing Card */}
            {currentVideo.videoId && (
              <div className="p-2.5 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] shadow-xs">
                <div className="flex items-center gap-1.5 mb-1.5 text-[#0075de] text-[10px] font-bold tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#1aae39] animate-ping" />
                  <span>กำลังเล่นอยู่ (Now Playing)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-14 h-9 rounded-lg overflow-hidden shrink-0 bg-black relative shadow-xs">
                    <img
                      src={`https://i.ytimg.com/vi/${currentVideo.videoId}/hqdefault.jpg`}
                      alt={currentVideo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-[#000000] truncate">
                      {currentVideo.title}
                    </h4>
                    <p className="text-[10px] text-[#615d59] truncate">
                      {currentVideo.channel}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Queue List Header & Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#000000]">คิวถัดไป</span>
                <span className="text-[10px] text-[#615d59]">({playlist.length} เพลง)</span>
              </div>

              {/* Loop & Shuffle Controls */}
              <div className="flex items-center gap-1">
                {/* Loop Mode */}
                <button
                  type="button"
                  onClick={() =>
                    onSetLoopMode(
                      loopMode === 'off' ? 'all' : loopMode === 'all' ? 'single' : 'off'
                    )
                  }
                  title={`โหมดเล่นวน: ${loopMode}`}
                  className={`p-1 rounded-md text-xs border transition-colors cursor-pointer shadow-xs ${
                    loopMode !== 'off'
                      ? 'bg-[#1aae39]/10 text-[#1aae39] border-[#1aae39]/30'
                      : 'bg-white hover:bg-[#f6f5f4] text-[#a39e98] border-[#e6e6e6]'
                  }`}
                >
                  {loopMode === 'single' ? (
                    <Repeat1 className="w-3.5 h-3.5 text-[#1aae39]" />
                  ) : (
                    <Repeat className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Shuffle */}
                <button
                  type="button"
                  onClick={onToggleShuffle}
                  title={`สุ่มเพลง: ${isShuffle ? 'เปิด' : 'ปิด'}`}
                  className={`p-1 rounded-md text-xs border transition-colors cursor-pointer shadow-xs ${
                    isShuffle
                      ? 'bg-[#0075de]/10 text-[#0075de] border-[#0075de]/30'
                      : 'bg-white hover:bg-[#f6f5f4] text-[#a39e98] border-[#e6e6e6]'
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>

                {/* Next */}
                <button
                  type="button"
                  onClick={onNextTrack}
                  disabled={playlist.length === 0}
                  title="เล่นเพลงถัดไป"
                  className="p-1 rounded-md bg-white hover:bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6] disabled:opacity-30 cursor-pointer shadow-xs"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Queue Items */}
            {playlist.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-[#e6e6e6] rounded-xl bg-[#f6f5f4]">
                <Music className="w-8 h-8 text-[#a39e98] mx-auto mb-2 opacity-60" />
                <p className="text-xs font-medium text-[#615d59]">
                  ยังไม่มีเพลงในคิว
                </p>
                <p className="text-[11px] text-[#a39e98] mt-1">
                  ค้นหาเพลงด้านบนเพื่อเพิ่มเพลงเข้าคิวได้เลย
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {playlist.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] transition-colors group shadow-xs"
                  >
                    <span className="w-5 text-center font-mono text-xs text-[#a39e98]">
                      {idx + 1}
                    </span>

                    <div className="w-12 h-8 rounded-lg overflow-hidden shrink-0 bg-black relative shadow-xs">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-medium text-[#000000] truncate" title={item.title}>
                        {item.title}
                      </h5>
                      <div className="flex items-center gap-2 text-[10px] text-[#615d59]">
                        <span className="truncate max-w-[100px]">{item.channel}</span>
                        <span>•</span>
                        <span>{item.duration}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => onPlayNow(item.videoId, item.title, item.channel)}
                        title="เล่นทันที"
                        className="p-1 rounded-md hover:bg-[#0075de]/10 text-[#0075de] transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>

                      {canManagePlaylist && (
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          title="ลบออกจากคิว"
                          className="p-1 rounded-md hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ==================== SEARCH TAB ==================== */}
        {activeTab === 'search' && (
          <div className="space-y-3">
            {/* Search Input Bar */}
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเพลง, ศิลปิน บน YouTube..."
                className="w-full pl-8 pr-16 py-1.5 bg-white border border-[#e6e6e6] rounded-full text-xs text-[#000000] placeholder-[#a39e98] focus:outline-none focus:border-[#0075de] shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-[#a39e98] absolute left-2.5" />
              <button
                type="submit"
                disabled={!searchQuery.trim() || isSearching}
                className="absolute right-1 px-3 py-1 rounded-full bg-[#0075de] hover:bg-[#005bab] disabled:opacity-30 text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {isSearching ? 'ค้นหา...' : 'ค้นหา'}
              </button>
            </form>

            {/* Search Results */}
            {isSearching ? (
              <div className="text-center py-8 text-[#615d59] text-xs">
                กำลังค้นหาเพลงจาก YouTube...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1.5">
                {searchResults.map((res) => {
                  const isAdded = addedVideoIds.has(res.videoId);

                  return (
                    <div
                      key={res.videoId}
                      className="flex items-center gap-2 p-1.5 rounded-xl bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] transition-colors shadow-xs group"
                    >
                      <div className="w-14 h-9 rounded-lg overflow-hidden shrink-0 bg-black relative shadow-xs">
                        <img
                          src={res.thumbnail}
                          alt={res.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 rounded text-[9px] font-mono text-white">
                          {res.duration}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-medium text-[#000000] truncate" title={res.title}>
                          {res.title}
                        </h5>
                        <p className="text-[10px] text-[#615d59] truncate">
                          {res.channel}
                        </p>
                      </div>


                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onPlayNow(res.videoId, res.title, res.channel)}
                          title="เล่นเพลงนี้ทันที"
                          className="p-1.5 rounded-md hover:bg-[#0075de]/10 text-[#0075de] transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddTrack(res)}
                          disabled={isAdded}
                          title={isAdded ? 'เพิ่มแล้ว' : 'เพิ่มเข้าคิว'}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            isAdded
                              ? 'bg-[#1aae39]/10 text-[#1aae39]'
                              : 'hover:bg-black/5 text-[#31302e]'
                          }`}
                        >
                          {isAdded ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Quick Suggestions when no search */}
            {!isSearching && searchResults.length === 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-[#615d59] px-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#0075de]" />
                  แนวเพลงยอดนิยม
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Lofi Hip Hop', 'เพลงฮิตติดชาร์ต', 'เพลงชิลล์ๆ คาเฟ่', 'เพลงไทยอินดี้', 'K-POP 2026', 'Acoustic Guitar'].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSearchQuery(tag);
                          handleSearch();
                        }}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-[#f6f5f4] hover:text-[#0075de] hover:border-[#0075de]/30 border border-[#e6e6e6] text-[#615d59] text-[11px] font-medium transition-all cursor-pointer shadow-xs"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
