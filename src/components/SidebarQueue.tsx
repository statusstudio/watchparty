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
    <div className="flex flex-col h-full bg-[#13141c] text-gray-100 overflow-hidden">
      {/* Sub-Header Tabs: Queue vs Search */}
      <div className="p-2 border-b border-gray-800/80 bg-[#171824]/60 flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5" />
          <span>คิวเพลง</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">
            {playlist.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
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
                className="w-full pl-8 pr-16 py-1.5 bg-[#0f0f13] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <Link className="w-3.5 h-3.5 text-gray-500 absolute left-2.5" />
              <button
                type="submit"
                disabled={!directUrl.trim()}
                className="absolute right-1 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                เพิ่ม
              </button>
            </form>

            {/* Currently Playing Card */}
            {currentVideo.videoId && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-fuchsia-950/20 border border-violet-500/30">
                <div className="flex items-center gap-1.5 mb-1.5 text-violet-400 text-[10px] font-bold tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>กำลังเล่นอยู่ (Now Playing)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-14 h-9 rounded-lg overflow-hidden shrink-0 bg-black relative">
                    <img
                      src={`https://i.ytimg.com/vi/${currentVideo.videoId}/hqdefault.jpg`}
                      alt={currentVideo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate">
                      {currentVideo.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 truncate">
                      {currentVideo.channel}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Queue List Header & Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-300">คิวถัดไป</span>
                <span className="text-[10px] text-gray-500">({playlist.length} เพลง)</span>
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
                  className={`p-1 rounded-md text-xs border transition-colors cursor-pointer ${
                    loopMode !== 'off'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-white'
                  }`}
                >
                  {loopMode === 'single' ? (
                    <Repeat1 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Repeat className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Shuffle */}
                <button
                  type="button"
                  onClick={onToggleShuffle}
                  title={`สุ่มเพลง: ${isShuffle ? 'เปิด' : 'ปิด'}`}
                  className={`p-1 rounded-md text-xs border transition-colors cursor-pointer ${
                    isShuffle
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-white'
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
                  className="p-1 rounded-md bg-gray-800/60 hover:bg-gray-700 text-gray-300 border border-gray-700/60 disabled:opacity-30 cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Queue Items */}
            {playlist.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-gray-800 rounded-2xl bg-[#0f0f13]/50">
                <Music className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-60" />
                <p className="text-xs text-gray-400 font-medium">ไม่มีเพลงในคิว</p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  ค้นหาเพลงจากแท็บ "ค้นหาเพลง" หรือวางลิงก์ YouTube ด้านบน
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-semibold border border-violet-500/30 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>ค้นหาเพลงเลย</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {playlist.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl bg-[#171824]/60 hover:bg-[#1a1c2b] border border-gray-800/70 transition-all flex items-center gap-2 group"
                  >
                    {/* Index */}
                    <span className="text-[11px] font-mono text-gray-500 w-4 text-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="w-12 h-8 rounded-lg overflow-hidden shrink-0 bg-black relative">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-medium text-gray-200 group-hover:text-white truncate">
                        {item.title}
                      </h5>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <span className="truncate max-w-[90px]">{item.channel}</span>
                        <span>•</span>
                        <span>{item.duration}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      {canManagePlaylist && (
                        <button
                          type="button"
                          onClick={() => onPlayNow(item.videoId, item.title, item.channel)}
                          title="เล่นเพลงนี้ทันที"
                          className="p-1 rounded-md hover:bg-violet-600/20 text-gray-400 hover:text-violet-300 transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canManagePlaylist && (
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          title="ลบออกจากคิว"
                          className="p-1 rounded-md hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Clear Queue Button */}
                {canManagePlaylist && playlist.length > 1 && (
                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={onClearPlaylist}
                      className="text-[11px] text-rose-400/80 hover:text-rose-300 transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ล้างคิวทั้งหมด</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ==================== SEARCH TAB ==================== */}
        {activeTab === 'search' && (
          <div className="space-y-3">
            {/* Search Input Form */}
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเพลง ศิลปิน หรือวางลิงก์..."
                className="w-full pl-8 pr-16 py-2 bg-[#0f0f13] border border-gray-800 focus:border-violet-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                autoFocus
              />
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5" />
              <button
                type="submit"
                disabled={!searchQuery.trim() || isSearching}
                className="absolute right-1 px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {isSearching ? 'ค้นหา...' : 'ค้นหา'}
              </button>
            </form>

            {/* Loading Indicator */}
            {isSearching && (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">กำลังค้นหาคลิปบน YouTube...</p>
              </div>
            )}

            {/* Search Results */}
            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                  <span>ผลการค้นหา ({searchResults.length})</span>
                  <button
                    type="button"
                    onClick={() => setSearchResults([])}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    ล้างผลลัพธ์
                  </button>
                </div>

                {searchResults.map((item) => {
                  const isAdded = addedVideoIds.has(item.videoId);
                  return (
                    <div
                      key={item.videoId}
                      className="p-2 rounded-xl bg-[#171824]/60 hover:bg-[#1a1c2b] border border-gray-800/70 transition-all flex items-center gap-2.5 group"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-black relative">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {item.duration && (
                          <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[9px] font-mono text-white">
                            {item.duration}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">
                          {item.title}
                        </h5>
                        <p className="text-[10px] text-gray-400 truncate">
                          {item.channel}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddTrack(item)}
                          disabled={isAdded}
                          title={!canManagePlaylist ? 'เฉพาะเจ้าของห้องหรือแอดมินเท่านั้นที่สามารถเพิ่มเพลงได้' : 'เพิ่มลงคิวเพลง'}
                          className={`p-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                            isAdded
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border-violet-500/30'
                          }`}
                        >
                          {isAdded ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onPlayNow(item.videoId, item.title, item.channel)}
                          title="เล่นเพลงนี้ทันที"
                          className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60 transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Suggestions when no search */}
            {!isSearching && searchResults.length === 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-gray-400 px-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet-400" />
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
                        className="px-2.5 py-1 rounded-lg bg-gray-800/50 hover:bg-violet-600/20 hover:border-violet-500/30 border border-gray-800 text-gray-300 text-[11px] transition-all cursor-pointer"
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
