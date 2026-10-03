import React, { useState, useEffect } from 'react';
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
  Heart,
  ListPlus,
  Loader2,
  X,
  Save,
  BookmarkPlus,
  FolderHeart,
} from 'lucide-react';
import { PlaylistItem, VideoState, LoopMode, UserRole, UserProfile, FavoriteSong } from '../types/index.js';
import { fetchFavorites, addFavorite, removeFavorite } from '../services/supabase.js';

export interface SavedPlaylist {
  id: string;
  name: string;
  createdAt: number;
  items: Omit<PlaylistItem, 'id'>[];
}

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
  onAddToPlaylistBatch?: (items: Omit<PlaylistItem, 'id'>[]) => void;
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
  onAddToPlaylistBatch,
  onRemoveItem,
  onClearPlaylist,
  onSetLoopMode,
  onToggleShuffle,
  onNextTrack,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'search' | 'favorites' | 'saved_playlists'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [directUrl, setDirectUrl] = useState('');
  const [playlistUrlInput, setPlaylistUrlInput] = useState('');
  const [isImportingPlaylist, setIsImportingPlaylist] = useState(false);
  const [addedVideoIds, setAddedVideoIds] = useState<Set<string>>(new Set());
  const [favoriteSongs, setFavoriteSongs] = useState<FavoriteSong[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>(() => {
    try {
      const raw = localStorage.getItem('watchparty_saved_playlists');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const canManagePlaylist = !onlyAdminManagePlaylist || myRole === 'owner' || myRole === 'admin';

  const handleSaveQueueAsPlaylist = () => {
    if (playlist.length === 0) {
      onShowToast('ยังไม่มีเพลงในคิวให้บันทึก 🎵', 'warning');
      return;
    }
    const defaultTitle = `คิวเพลง ${new Date().toLocaleDateString('th-TH')} (${playlist.length} เพลง)`;
    const name = window.prompt('ตั้งชื่อเพลย์ลิสต์ส่วนตัวที่ต้องการบันทึก:', defaultTitle);
    if (!name || !name.trim()) return;

    const newEntry: SavedPlaylist = {
      id: 'pl-' + Date.now(),
      name: name.trim(),
      createdAt: Date.now(),
      items: playlist.map((item) => ({
        videoId: item.videoId,
        title: item.title,
        channel: item.channel,
        thumbnail: item.thumbnail,
        duration: item.duration,
        addedBy: currentUser?.name || 'คุณ',
      })),
    };

    const updated = [newEntry, ...savedPlaylists];
    setSavedPlaylists(updated);
    localStorage.setItem('watchparty_saved_playlists', JSON.stringify(updated));
    onShowToast(`บันทึกเพลย์ลิสต์ "${newEntry.name}" สำเร็จ 💾`, 'success');
  };

  const handleDeleteSavedPlaylist = (id: string, name: string) => {
    if (!window.confirm(`คุณต้องการลบเพลย์ลิสต์ "${name}" ใช่หรือไม่?`)) return;
    const updated = savedPlaylists.filter((p) => p.id !== id);
    setSavedPlaylists(updated);
    localStorage.setItem('watchparty_saved_playlists', JSON.stringify(updated));
    onShowToast(`ลบเพลย์ลิสต์ "${name}" แล้ว`, 'info');
  };

  const handleLoadSavedPlaylist = (saved: SavedPlaylist) => {
    if (!canManagePlaylist) {
      onShowToast('เฉพาะเจ้าของห้องหรือแอดมินเท่านั้นที่สามารถเพิ่มเพลงได้ ⚠️', 'warning');
      return;
    }
    if (!saved.items || saved.items.length === 0) {
      onShowToast('ไม่มีเพลงในเพลย์ลิสต์นี้', 'warning');
      return;
    }
    if (onAddToPlaylistBatch) {
      onAddToPlaylistBatch(saved.items);
    } else {
      saved.items.forEach((item) => onAddToPlaylist(item));
    }
    onShowToast(`นำเข้าเพลย์ลิสต์ "${saved.name}" (${saved.items.length} เพลง) เข้าคิวแล้ว 🎶`, 'success');
    setActiveTab('queue');
  };

  const loadFavorites = async () => {
    if (!currentUser?.id) return;
    setLoadingFavorites(true);
    try {
      const favs = await fetchFavorites(currentUser.id);
      setFavoriteSongs(favs || []);
      setFavIds(new Set((favs || []).map((f) => f.videoId)));
    } catch (e) {
    } finally {
      setLoadingFavorites(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [currentUser?.id]);

  const handleToggleFavoriteItem = async (item: {
    videoId: string;
    title: string;
    channel?: string;
    thumbnail?: string;
    duration?: string;
  }) => {
    if (!currentUser?.id) return;
    if (favIds.has(item.videoId)) {
      await removeFavorite(currentUser.id, item.videoId);
      setFavIds((prev) => {
        const next = new Set(prev);
        next.delete(item.videoId);
        return next;
      });
      setFavoriteSongs((prev) => prev.filter((f) => f.videoId !== item.videoId));
      onShowToast('ลบออกจากเพลงโปรดแล้ว', 'info');
    } else {
      await addFavorite(currentUser.id, item);
      setFavIds((prev) => new Set([...prev, item.videoId]));
      onShowToast('บันทึกเพลงนี้ลงในคลังเพลงโปรดแล้ว ❤️', 'success');
      loadFavorites();
    }
  };

  const handleImportPlaylist = async (listIdOrUrl: string) => {
    if (!canManagePlaylist) {
      onShowToast('เฉพาะเจ้าของห้องหรือแอดมินเท่านั้นที่สามารถเพิ่มเพลงได้ ⚠️', 'warning');
      return;
    }
    const trimmed = listIdOrUrl.trim();
    if (!trimmed) return;

    const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    const cleanId = listMatch ? listMatch[1] : trimmed;

    setIsImportingPlaylist(true);
    try {
      const res = await fetch(`/api/youtube/playlist?listId=${encodeURIComponent(cleanId)}`);
      const data = await res.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const itemsToAdd: Omit<PlaylistItem, 'id'>[] = data.items.map((vid: any) => ({
          videoId: vid.videoId,
          title: vid.title,
          channel: vid.channel || 'YouTube',
          thumbnail: vid.thumbnail || `https://i.ytimg.com/vi/${vid.videoId}/hqdefault.jpg`,
          duration: vid.duration || 'YouTube',
          addedBy: currentUser?.name || 'คุณ',
        }));

        if (onAddToPlaylistBatch) {
          onAddToPlaylistBatch(itemsToAdd);
        } else {
          itemsToAdd.forEach((item) => onAddToPlaylist(item));
        }

        onShowToast(`นำเข้าเพลย์ลิสต์ "${data.title || 'YouTube'}" (${itemsToAdd.length} เพลง) เรียบร้อย 🎶`, 'success');
        setDirectUrl('');
        setPlaylistUrlInput('');
        setSearchQuery('');
        setActiveTab('queue');
      } else {
        onShowToast('ไม่พบเพลงในเพลย์ลิสต์ หรือเพลย์ลิสต์เป็นแบบส่วนตัว', 'warning');
      }
    } catch (err) {
      console.error('Import playlist error:', err);
      onShowToast('เกิดข้อผิดพลาดในการดึงข้อมูลเพลย์ลิสต์', 'warning');
    } finally {
      setIsImportingPlaylist(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Check if input is a playlist URL
    const plMatch = q.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (plMatch && plMatch[1]) {
      handleImportPlaylist(plMatch[1]);
      return;
    }

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
      setActiveTab('search');
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
    const trimmed = directUrl.trim();
    if (!trimmed) return;

    // Check if input is a playlist URL
    const plMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (plMatch && plMatch[1]) {
      handleImportPlaylist(plMatch[1]);
      return;
    }

    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
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
      {/* Unified Search & Add Bar at Top (No duplicate sub-tabs) */}
      <div className="p-2.5 border-b border-[#e6e6e6] bg-[#f6f5f4] shrink-0">
        <form onSubmit={handleSearch} className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อเพลง หรือ วางลิงก์ YouTube..."
              className="w-full pl-8 pr-16 py-1.5 bg-white border border-[#e6e6e6] rounded-full text-xs text-[#000000] placeholder-[#a39e98] focus:outline-none focus:border-[#0075de] shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setActiveTab('queue');
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-[#a39e98] hover:text-[#000000] p-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="submit"
              disabled={!searchQuery.trim() || isSearching}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-[#0075de] hover:bg-[#005bab] disabled:opacity-30 text-white text-[11px] font-semibold transition-colors cursor-pointer"
            >
              {isSearching ? '...' : 'ค้นหา/เพิ่ม'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeTab === 'favorites') {
                setActiveTab('queue');
              } else {
                setActiveTab('favorites');
                loadFavorites();
              }
            }}
            title={activeTab === 'favorites' ? 'กลับไปที่คิวเพลง' : 'ดูเพลงโปรด'}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs shrink-0 ${
              activeTab === 'favorites'
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white hover:bg-rose-50 text-rose-500 border-[#e6e6e6]'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">เพลงโปรด</span>
            {favoriteSongs.length > 0 && (
              <span className="text-[10px] font-mono">({favoriteSongs.length})</span>
            )}
          </button>

          {/* Saved Playlists Tab Button */}
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'saved_playlists') {
                setActiveTab('queue');
              } else {
                setActiveTab('saved_playlists');
              }
            }}
            title={activeTab === 'saved_playlists' ? 'กลับไปที่คิวเพลง' : 'เพลย์ลิสต์ส่วนตัวที่บันทึกไว้'}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs shrink-0 ${
              activeTab === 'saved_playlists'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white hover:bg-purple-50 text-purple-600 border-[#e6e6e6]'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เพลย์ลิสต์</span>
            {savedPlaylists.length > 0 && (
              <span className="text-[10px] font-mono">({savedPlaylists.length})</span>
            )}
          </button>
        </form>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {/* ==================== QUEUE TAB ==================== */}
        {activeTab === 'queue' && (
          <>

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
                {playlist.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveQueueAsPlaylist}
                    title="บันทึกคิวเพลงทั้งหมดนี้เป็นเพลย์ลิสต์ส่วนตัว"
                    className="ml-1 px-2 py-0.5 rounded-md bg-[#0075de]/10 hover:bg-[#0075de]/20 text-[#0075de] text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Save className="w-3 h-3" />
                    <span>บันทึกคิว</span>
                  </button>
                )}
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
                    <span className="w-5 text-center font-mono text-xs text-[#a39e98] shrink-0">
                      {idx + 1}
                    </span>

                    {/* Thumbnail with quick Play overlay */}
                    <div
                      onClick={() => onPlayNow(item.videoId, item.title, item.channel)}
                      title={`คลิกเพื่อเล่นเพลง: ${item.title}`}
                      className="w-14 h-9.5 rounded-lg overflow-hidden shrink-0 bg-black relative shadow-2xs group/thumb cursor-pointer border border-[#e6e6e6]/60"
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <h5
                        onClick={() => onPlayNow(item.videoId, item.title, item.channel)}
                        className="text-xs font-semibold text-[#000000] hover:text-[#0075de] transition-colors truncate cursor-pointer"
                        title={item.title}
                      >
                        {item.title}
                      </h5>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#615d59]">
                        <span className="truncate max-w-[100px]">{item.channel}</span>
                        <span>•</span>
                        <span>{item.duration}</span>
                      </div>
                    </div>

                    {/* Actions - Distinct buttons with clear visual separation */}
                    <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleFavoriteItem(item)}
                        title={favIds.has(item.videoId) ? 'ลบออกจากเพลงโปรด' : 'บันทึกเป็นเพลงโปรด ❤️'}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 ${
                          favIds.has(item.videoId)
                            ? 'bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-200'
                            : 'bg-white hover:bg-rose-50 text-[#a39e98] hover:text-rose-500 border border-[#e6e6e6]'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${favIds.has(item.videoId) ? 'fill-current text-rose-500' : ''}`} />
                      </button>

                      {/* Play Button - Large Solid Blue (High visibility, impossible to mistake for delete) */}
                      <button
                        type="button"
                        onClick={() => onPlayNow(item.videoId, item.title, item.channel)}
                        title="เล่นเพลงนี้ทันที"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0075de] hover:bg-[#005bab] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>

                      {/* Protective Separator Line between Play and Destructive Delete */}
                      {canManagePlaylist && (
                        <>
                          <span className="h-4 w-px bg-[#e6e6e6] mx-0.5 hidden sm:inline-block" />

                          {/* Delete Button - Distinct bordered styling, separated from Play */}
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            title="ลบเพลงนี้ออกจากคิว"
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-rose-50 text-[#a39e98] hover:text-rose-600 border border-[#e6e6e6] hover:border-rose-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
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
            {/* Search Results Header & Back Button */}
            <div className="flex items-center justify-between pb-1 border-b border-[#e6e6e6]">
              <span className="text-xs font-bold text-[#000000] flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#0075de]" />
                <span>ผลการค้นหา ({searchResults.length})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('queue');
                  setSearchResults([]);
                }}
                className="text-xs text-[#0075de] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>กลับไปที่คิวเพลง</span>
              </button>
            </div>

            {/* YouTube Playlist Quick Importer Card */}
            <div className="p-3 bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000]">
                <ListPlus className="w-4 h-4 text-[#0075de]" />
                <span>นำเข้า YouTube Playlist ทั้งชุด</span>
              </div>
              <p className="text-[10px] text-[#615d59]">
                วางลิงก์ YouTube Playlist เพื่อดึงเพลงทั้งหมดเข้าคิวห้องในคลิกเดียว
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (playlistUrlInput.trim()) {
                    handleImportPlaylist(playlistUrlInput);
                  }
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={playlistUrlInput}
                  onChange={(e) => setPlaylistUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=..."
                  className="flex-1 px-3 py-1.5 bg-white border border-[#e6e6e6] rounded-lg text-xs text-[#000000] focus:outline-none focus:border-[#0075de]"
                />
                <button
                  type="submit"
                  disabled={!playlistUrlInput.trim() || isImportingPlaylist}
                  className="px-3 py-1.5 bg-[#0075de] hover:bg-[#005bab] text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-xs"
                >
                  {isImportingPlaylist ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>กำลังดึง...</span>
                    </>
                  ) : (
                    <span>นำเข้า</span>
                  )}
                </button>
              </form>
            </div>

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

        {/* ==================== FAVORITES TAB ==================== */}
        {activeTab === 'favorites' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#e6e6e6]">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                <span className="text-xs font-bold text-[#000000]">เพลงโปรดของฉัน</span>
                <span className="text-[10px] text-[#615d59]">({favoriteSongs.length})</span>
              </div>

              <div className="flex items-center gap-2">
                {favoriteSongs.length > 0 && canManagePlaylist && (
                  <button
                    type="button"
                    onClick={() => {
                      const itemsToAdd: Omit<PlaylistItem, 'id'>[] = favoriteSongs.map((f) => ({
                        videoId: f.videoId,
                        title: f.title,
                        channel: f.channel || 'YouTube',
                        thumbnail: f.thumbnail || `https://i.ytimg.com/vi/${f.videoId}/hqdefault.jpg`,
                        duration: f.duration || 'YouTube',
                        addedBy: currentUser?.name || 'คุณ',
                      }));
                      if (onAddToPlaylistBatch) {
                        onAddToPlaylistBatch(itemsToAdd);
                      } else {
                        itemsToAdd.forEach((item) => onAddToPlaylist(item));
                      }
                      onShowToast(`เพิ่มเพลงโปรดทั้งหมด (${itemsToAdd.length} เพลง) เข้าคิวแล้ว ❤️`, 'success');
                      setActiveTab('queue');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>เพิ่มทั้งหมดเข้าคิว</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className="text-xs text-[#0075de] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>กลับคิวเพลง</span>
                </button>
              </div>
            </div>

            {loadingFavorites ? (
              <div className="text-center py-8 text-xs text-[#615d59]">
                กำลังโหลดคลังเพลงโปรด...
              </div>
            ) : favoriteSongs.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-[#e6e6e6] rounded-xl bg-[#f6f5f4] space-y-2">
                <Heart className="w-8 h-8 text-[#a39e98] mx-auto opacity-50" />
                <p className="text-xs font-semibold text-[#000000]">
                  ยังไม่มีเพลงโปรดในคลัง
                </p>
                <p className="text-[11px] text-[#615d59] leading-relaxed">
                  กดปุ่ม ❤️ ที่เครื่องเล่นเพลง หรือในรายการคิวเพลง เพื่อบันทึกเพลงที่ชอบไว้ฟังและเพิ่มเข้าคิวได้ทุกเมื่อ
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {favoriteSongs.map((fav) => (
                  <div
                    key={fav.id || fav.videoId}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] transition-colors shadow-xs group"
                  >
                    <div className="w-14 h-9 rounded-lg overflow-hidden shrink-0 bg-black relative shadow-xs">
                      <img
                        src={fav.thumbnail || `https://i.ytimg.com/vi/${fav.videoId}/hqdefault.jpg`}
                        alt={fav.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 rounded text-[9px] font-mono text-white">
                        {fav.duration || 'YouTube'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-medium text-[#000000] truncate" title={fav.title}>
                        {fav.title}
                      </h5>
                      <p className="text-[10px] text-[#615d59] truncate">
                        {fav.channel || 'YouTube'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onPlayNow(fav.videoId, fav.title, fav.channel)}
                        title="เล่นทันที"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0075de] hover:bg-[#005bab] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!canManagePlaylist) {
                            onShowToast('เฉพาะเจ้าของห้องหรือแอดมินเท่านั้นที่สามารถเพิ่มเพลงได้ ⚠️', 'warning');
                            return;
                          }
                          onAddToPlaylist({
                            videoId: fav.videoId,
                            title: fav.title,
                            channel: fav.channel,
                            thumbnail: fav.thumbnail,
                            duration: fav.duration || 'YouTube',
                            addedBy: currentUser?.name || 'คุณ',
                          });
                          onShowToast(`เพิ่ม "${fav.title.substring(0, 25)}..." เข้าคิวแล้ว ❤️`, 'success');
                        }}
                        title="เพิ่มเข้าคิว"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <span className="h-4 w-px bg-[#e6e6e6] mx-0.5 hidden sm:inline-block" />

                      <button
                        type="button"
                        onClick={() => handleToggleFavoriteItem(fav)}
                        title="ลบออกจากเพลงโปรด"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-rose-50 text-[#a39e98] hover:text-rose-600 border border-[#e6e6e6] hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== SAVED PLAYLISTS TAB ==================== */}
        {activeTab === 'saved_playlists' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#e6e6e6]">
              <div className="flex items-center gap-1.5">
                <FolderHeart className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-xs font-bold text-[#000000]">เพลย์ลิสต์ส่วนตัว</span>
                <span className="text-[10px] text-[#615d59]">({savedPlaylists.length})</span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className="text-xs text-[#0075de] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>กลับคิวเพลง</span>
              </button>
            </div>

            {savedPlaylists.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-[#e6e6e6] rounded-xl bg-[#f6f5f4] space-y-2">
                <FolderHeart className="w-8 h-8 text-[#a39e98] mx-auto opacity-50 text-purple-400" />
                <p className="text-xs font-semibold text-[#000000]">
                  ยังไม่มีเพลย์ลิสต์ที่บันทึกไว้
                </p>
                <p className="text-[11px] text-[#615d59] leading-relaxed">
                  เมื่อคุณจัดคิวเพลงไว้ในห้อง สามารถกดปุ่ม <span className="font-semibold text-[#0075de]">"บันทึกคิว"</span> ที่แท็บคิวเพลง เพื่อเก็บชุดเพลงโปรดไว้เปิดฟังในห้องใดก็ได้ตลอดเวลา!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedPlaylists.map((pl) => (
                  <div
                    key={pl.id}
                    className="p-3 rounded-xl bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] transition-all shadow-xs group space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-[#000000] truncate">
                          {pl.name}
                        </h5>
                        <div className="flex items-center gap-2 text-[10px] text-[#615d59] mt-0.5">
                          <span className="font-semibold text-purple-600">{pl.items.length} เพลง</span>
                          <span>•</span>
                          <span>{new Date(pl.createdAt).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleLoadSavedPlaylist(pl)}
                          title="นำเข้าเพลงทั้งหมดเข้าคิวห้องปัจจุบัน"
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>โหลดเข้าคิว</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSavedPlaylist(pl.id, pl.name)}
                          title="ลบเพลย์ลิสต์นี้"
                          className="p-1.5 rounded-lg text-[#a39e98] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Preview first 3 tracks thumbnails */}
                    {pl.items.length > 0 && (
                      <div className="flex items-center gap-1 pt-1 overflow-x-auto">
                        {pl.items.slice(0, 4).map((it, i) => (
                          <div
                            key={i}
                            className="w-12 h-8 rounded-md bg-black overflow-hidden shrink-0 border border-black/10 relative"
                            title={it.title}
                          >
                            <img
                              src={it.thumbnail || `https://i.ytimg.com/vi/${it.videoId}/hqdefault.jpg`}
                              alt={it.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {pl.items.length > 4 && (
                          <div className="w-10 h-8 rounded-md bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0">
                            +{pl.items.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
