import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, Palette, User, Sparkles, LifeBuoy, Crown, Heart, Trophy, Clock, Play, Plus, Trash2, Zap, Flame, Globe, LogOut } from 'lucide-react';
import { UserProfile, PlaylistItem, FavoriteSong } from '../types/index.js';
import { PRESET_AVATARS, COLOR_PALETTE } from '../data/presets.js';
import { compressProfileImage } from '../services/imageCompressor.js';
import { fetchFavorites, removeFavorite } from '../services/supabase.js';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSave: (updated: UserProfile) => void;
  onAddToPlaylist?: (item: Omit<PlaylistItem, 'id'>) => void;
  onPlayNow?: (videoId: string, title?: string, channel?: string) => void;
  onOpenSupport?: () => void;
  onOpenSuperAdmin?: () => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onNavigateToPublicProfile?: (handle: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
  onAddToPlaylist,
  onPlayNow,
  onOpenSupport,
  onOpenSuperAdmin,
  onShowToast,
  onOpenAuth,
  onLogout,
  onNavigateToPublicProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'stats'>('profile');
  const [name, setName] = useState(currentUser.name);
  const [color, setColor] = useState(currentUser.color);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Favorites state
  const [favoriteSongs, setFavoriteSongs] = useState<FavoriteSong[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setColor(currentUser.color);
      setAvatar(currentUser.avatar);
      loadFavs();
    }
  }, [isOpen, currentUser]);

  const loadFavs = async () => {
    if (!currentUser?.id) return;
    setLoadingFavorites(true);
    try {
      const favs = await fetchFavorites(currentUser.id);
      setFavoriteSongs(favs || []);
    } catch (e) {
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleRemoveFav = async (videoId: string) => {
    await removeFavorite(currentUser.id, videoId);
    setFavoriteSongs((prev) => prev.filter((f) => f.videoId !== videoId));
    onShowToast?.('ลบออกจากเพลงโปรดแล้ว', 'info');
  };

  if (!isOpen) return null;

  // Level & XP calculations
  const xp = currentUser.xp || 0;
  const mins = currentUser.listeningTimeMinutes || 0;
  const level = currentUser.level || Math.floor(Math.sqrt(xp / 25)) + 1;
  const currentLevelBaseXp = Math.pow(level - 1, 2) * 25;
  const nextLevelBaseXp = Math.pow(level, 2) * 25;
  const xpProgress = Math.min(
    100,
    Math.max(
      0,
      Math.round(((xp - currentLevelBaseXp) / Math.max(1, nextLevelBaseXp - currentLevelBaseXp)) * 100)
    )
  );

  const getRankInfo = (lvl: number) => {
    if (lvl >= 50) return { title: '🪐 เทพแห่งเสียงเพลง', sub: 'Music Overlord', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' };
    if (lvl >= 30) return { title: '👑 ดีเจระดับตำนาน', sub: 'Legendary DJ', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' };
    if (lvl >= 20) return { title: '⭐ ผู้คุมจังหวะ', sub: 'Audio Master', color: 'text-indigo-400', bg: 'bg-indigo-500/15 border-indigo-500/30' };
    if (lvl >= 10) return { title: '🔥 ขาแดนซ์ตัวตึง', sub: 'Beat Lover', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' };
    if (lvl >= 5) return { title: '🎧 นักฟังประจำ', sub: 'Party Regular', color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/30' };
    return { title: '🌱 ผู้ฟังมือใหม่', sub: 'Music Rookie', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' };
  };

  const rank = getRankInfo(level);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsCompressing(true);
    try {
      // Compress and resize via HTML5 Canvas (160x160)
      const compressedDataUri = await compressProfileImage(file, 160);
      setAvatar(compressedDataUri);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อของคุณ');
      return;
    }

    onSave({
      ...currentUser,
      name: name.trim(),
      color,
      avatar,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#151722] border border-gray-800/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">แก้ไขโปรไฟล์ของคุณ</h2>
              <p className="text-xs text-gray-400">รูปภาพและชื่อจะแสดงบนเวทีไมค์และกล่องแชท</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2 border-b border-gray-800/80 bg-[#0f0f13] flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>โปรไฟล์</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('favorites');
              loadFavs();
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-gray-400 hover:text-rose-400 hover:bg-white/5'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>เพลงโปรด</span>
            {favoriteSongs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono">
                {favoriteSongs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-gray-400 hover:text-amber-400 hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>สถิติ & เลเวล</span>
          </button>
        </div>

        {/* ==================== TAB 1: PROFILE EDIT ==================== */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Account Status / Google Login Banner */}
            {(!currentUser.provider || currentUser.provider === 'guest') ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-purple-950/40 border border-blue-500/30 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">ยังไม่ได้เข้าสู่ระบบ</h4>
                    <p className="text-[10px] text-gray-400 truncate">เข้าสู่ระบบด้วย Google เพื่อบันทึกเพลงโปรดถาวร</p>
                  </div>
                </div>
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                  >
                    เข้าสู่ระบบ
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold shrink-0">
                    {currentUser.provider === 'google' ? 'Google Account' : 'Member'}
                  </span>
                  <span className="text-xs font-mono text-gray-300 truncate">
                    {currentUser.email || currentUser.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {onNavigateToPublicProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToPublicProfile(currentUser.username || currentUser.id);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      title="ดูหน้าเพจโปรไฟล์สาธารณะ"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>หน้าเพจ</span>
                    </button>
                  )}
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLogout();
                      }}
                      className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      title="ออกจากระบบ"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>ออก</span>
                    </button>
                  )}
                </div>
              </div>
            )}
            {error && (
              <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                {error}
              </div>
            )}

            {/* Current Avatar Preview & Upload */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div
                className="relative w-24 h-24 rounded-full p-1 border-4 shadow-xl overflow-hidden group"
                style={{ borderColor: color }}
              >
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full object-cover rounded-full bg-gray-900"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium">เปลี่ยนรูป</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 flex items-center gap-1.5 transition-colors border border-gray-700/60"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  {isCompressing ? 'กำลังย่อรูป...' : 'อัพโหลดจากเครื่อง (Auto-Resize)'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                * ระบบย่อรูปภาพให้อัตโนมัติเป็น 160x160 เพื่อความลื่นไหล
              </p>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                ชื่อแสดงในห้อง (Display Name)
              </label>
              <input
                type="text"
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0f0f13] border border-gray-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="เช่น บอย Squad Chill"
                required
              />
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                สีประจำตัว (Tag & Aura Color)
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                      color === c ? 'scale-110 ring-2 ring-white' : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Vector Avatars */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                รูปโปรไฟล์สำเร็จรูป (Preset Avatars)
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = avatar === preset.svg;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatar(preset.svg)}
                      className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500'
                          : 'border-gray-800 bg-[#0f0f13] hover:border-gray-700'
                      }`}
                    >
                      <img src={preset.svg} alt={preset.name} className="w-12 h-12 rounded-full" />
                      <span className="text-[10px] text-gray-300 truncate w-full text-center">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl font-medium text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                บันทึกโปรไฟล์
              </button>
            </div>

            {/* Discreet Help & Admin Access */}
            <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-500">
              {onOpenSupport && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSupport();
                  }}
                  className="hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LifeBuoy className="w-3.5 h-3.5 text-blue-400" />
                  <span>แจ้งปัญหา / แนะนำ</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* ==================== TAB 2: LIKED SONGS ==================== */}
        {activeTab === 'favorites' && (
          <div className="p-5 overflow-y-auto space-y-3 flex-1">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400 fill-current" />
                <span className="text-sm font-bold text-white">คลังเพลงโปรดของคุณ</span>
                <span className="text-xs text-gray-400">({favoriteSongs.length} เพลง)</span>
              </div>
            </div>

            {loadingFavorites ? (
              <div className="text-center py-12 text-xs text-gray-400">
                กำลังโหลดคลังเพลงโปรด...
              </div>
            ) : favoriteSongs.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-gray-800 rounded-xl bg-[#0f0f13] space-y-2">
                <Heart className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-xs font-semibold text-gray-200">ยังไม่มีเพลงโปรดที่บันทึกไว้</p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  กดปุ่ม ❤️ ที่เครื่องเล่นเพลงขณะฟังในห้อง เพื่อเซฟเพลงไว้เปิดฟังและเพิ่มเข้าห้องได้ตลอดเวลา
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {favoriteSongs.map((fav) => (
                  <div
                    key={fav.id || fav.videoId}
                    className="p-2 rounded-xl bg-[#0f0f13] border border-gray-800/80 flex items-center gap-2.5 hover:border-gray-700 transition-colors group"
                  >
                    <img
                      src={fav.thumbnail || `https://i.ytimg.com/vi/${fav.videoId}/hqdefault.jpg`}
                      alt={fav.title}
                      className="w-12 h-8 rounded-lg object-cover bg-black shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{fav.title}</p>
                      <p className="text-[10px] text-gray-400 truncate">{fav.channel || 'YouTube'}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      {onPlayNow && (
                        <button
                          type="button"
                          onClick={() => {
                            onPlayNow(fav.videoId, fav.title, fav.channel);
                            onShowToast?.(`กำลังเปิดเพลง "${fav.title.slice(0, 20)}..."`, 'info');
                          }}
                          title="เล่นทันที"
                          className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}

                      {onAddToPlaylist && (
                        <button
                          type="button"
                          onClick={() => {
                            onAddToPlaylist({
                              videoId: fav.videoId,
                              title: fav.title,
                              channel: fav.channel,
                              thumbnail: fav.thumbnail,
                              duration: fav.duration || 'YouTube',
                              addedBy: currentUser.name,
                            });
                            onShowToast?.(`เพิ่ม "${fav.title.slice(0, 20)}..." เข้าคิวห้องแล้ว 🎵`, 'success');
                          }}
                          title="เพิ่มเข้าคิวห้องปัจจุบัน"
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveFav(fav.videoId)}
                        title="ลบออกจากเพลงโปรด"
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
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

        {/* ==================== TAB 3: STATS & LEVEL ==================== */}
        {activeTab === 'stats' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Rank Card */}
            <div className={`p-4 rounded-2xl border ${rank.bg} flex items-center gap-4`}>
              <div className="w-14 h-14 rounded-2xl bg-black/30 border border-white/10 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] text-gray-400 font-mono font-bold">LEVEL</span>
                <span className={`text-xl font-extrabold ${rank.color} font-mono`}>{level}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">ยศผู้ฟังปัจจุบัน</span>
                <h3 className={`text-sm font-bold ${rank.color} truncate mt-0.5`}>{rank.title}</h3>
                <p className="text-[11px] text-gray-400">{rank.sub}</p>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="p-4 rounded-xl bg-[#0f0f13] border border-gray-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-semibold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>ค่าประสบการณ์ (XP)</span>
                </span>
                <span className="text-amber-400 font-mono font-bold">
                  {xp} / {nextLevelBaseXp} XP
                </span>
              </div>
              {/* Bar */}
              <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>เลเวล {level}</span>
                <span>อีก {Math.max(0, nextLevelBaseXp - xp)} XP สู่เลเวล {level + 1}</span>
              </div>
            </div>

            {/* Listening Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#0f0f13] border border-gray-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>เวลาฟังเพลงทั้งหมด</span>
                </div>
                <p className="text-lg font-bold text-white font-mono">
                  {Math.floor(mins / 60)} ชม. {mins % 60} นาที
                </p>
                <p className="text-[10px] text-gray-500">สะสมจากการฟังเพลงในห้อง</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0f0f13] border border-gray-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>เพลงที่ถูกใจ</span>
                </div>
                <p className="text-lg font-bold text-white font-mono">
                  {favoriteSongs.length} เพลง
                </p>
                <p className="text-[10px] text-gray-500">บันทึกไว้ในคลังส่วนตัว</p>
              </div>
            </div>

            {/* Level Rank Perks explanation */}
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-purple-300 space-y-1">
              <span className="font-bold flex items-center gap-1 text-purple-200">
                <Flame className="w-3.5 h-3.5 text-purple-400" />
                ยิ่งฟังนาน ยิ่งได้ยศสูง
              </span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                ทุกๆ 1 นาทีที่คุณอยู่ในห้องฟังเพลง ระบบจะเพิ่ม 10 XP ให้อัตโนมัติ พร้อมแสดง Badge เลเวลของคุณข้างชื่อในกล่องแชทสด
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
