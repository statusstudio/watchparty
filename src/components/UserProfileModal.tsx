import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Music,
  Play,
  Trash2,
  Edit3,
  Check,
  Globe,
  Share2,
  Calendar,
  Sparkles,
  UserPlus,
  UserCheck,
  Instagram,
  Facebook,
  Youtube,
  Radio,
  ExternalLink,
  LogOut,
  Camera,
  Upload,
} from 'lucide-react';
import { UserProfile, FavoriteSong } from '../types/index.js';
import { PRESET_AVATARS, COLOR_PALETTE } from '../data/presets.js';
import { compressProfileImage } from '../services/imageCompressor.js';
import {
  fetchProfile,
  updateProfile,
  toggleFollow,
  fetchFavorites,
  removeFavorite,
} from '../services/supabase.js';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile | null;
  currentUser: UserProfile;
  onUpdateCurrentUser: (user: UserProfile) => void;
  onPlaySong?: (videoId: string, title: string, channel: string, thumbnail: string) => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

const AVAILABLE_GENRES = [
  'Lofi',
  'Pop',
  'R&B',
  'Indie',
  'Acoustic',
  'Rock',
  'EDM',
  'Hip-Hop',
  'Jazz',
  'K-Pop',
  'City Pop',
  'Classical',
];

const PRESET_BANNERS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onUpdateCurrentUser,
  onPlaySong,
  onOpenAuth,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'about' | 'edit'>('favorites');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteSong[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBanner, setEditBanner] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editGenres, setEditGenres] = useState<string[]>([]);
  const [editInstagram, setEditInstagram] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editTiktok, setEditTiktok] = useState('');
  const [editSpotify, setEditSpotify] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  const displayUser = profile || targetUser || currentUser;
  const isOwnProfile = displayUser.id === currentUser.id;

  const handleAvatarFile = async (file: File) => {
    if (!file) return;
    setAvatarUploadError(null);
    setIsUploadingAvatar(true);
    try {
      const dataUri = await compressProfileImage(file, 160);
      setEditAvatar(dataUri);
      setActiveTab('edit');
    } catch (err: any) {
      setAvatarUploadError(err.message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Load profile data and favorites whenever opened
  useEffect(() => {
    if (!isOpen) return;

    const userToLoad = targetUser || currentUser;
    setProfile(userToLoad);
    setIsFollowing(Boolean(userToLoad.isFollowing));
    setFollowersCount(userToLoad.followersCount || 0);

    // Populate edit form
    setEditName(userToLoad.name || '');
    setEditUsername(userToLoad.username || '');
    setEditBio(userToLoad.bio || '');
    setEditAvatar(userToLoad.avatar || '');
    setEditBanner(
      userToLoad.bannerUrl ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80'
    );
    setEditColor(userToLoad.color || '#ec4899');
    setEditGenres(userToLoad.favoriteGenres || ['Lofi', 'Pop']);
    setEditInstagram(userToLoad.socialLinks?.instagram || '');
    setEditFacebook(userToLoad.socialLinks?.facebook || '');
    setEditTiktok(userToLoad.socialLinks?.tiktok || '');
    setEditSpotify(userToLoad.socialLinks?.spotify || '');

    // Reset tab: default to 'about' if own profile, else 'favorites'
    setActiveTab(userToLoad.id === currentUser.id ? 'about' : 'favorites');

    // Fetch fresh profile from database
    fetchProfile(userToLoad.id, currentUser.id).then((fresh) => {
      if (fresh) {
        setProfile(fresh);
        setIsFollowing(Boolean(fresh.isFollowing));
        setFollowersCount(fresh.followersCount || 0);
      }
    });

    // Fetch favorites
    setLoadingFavorites(true);
    fetchFavorites(userToLoad.id)
      .then((favs) => setFavorites(favs))
      .finally(() => setLoadingFavorites(false));
  }, [isOpen, targetUser, currentUser.id]);

  if (!isOpen) return null;

  // Follow / Unfollow handler
  const handleToggleFollow = async () => {
    if (!currentUser.provider || currentUser.provider === 'guest') {
      if (onOpenAuth) {
        onOpenAuth();
      } else {
        alert('กรุณาเข้าสู่ระบบด้วย Google หรือ Facebook เพื่อติดตามเพื่อน');
      }
      return;
    }

    setFollowLoading(true);
    const newStatus = await toggleFollow(currentUser.id, displayUser.id);
    setIsFollowing(newStatus);
    setFollowersCount((prev) => (newStatus ? prev + 1 : Math.max(0, prev - 1)));
    setFollowLoading(false);
  };

  // Remove favorite handler
  const handleRemoveFavorite = async (videoId: string) => {
    await removeFavorite(currentUser.id, videoId);
    setFavorites((prev) => prev.filter((s) => s.videoId !== videoId));
  };

  // Genre toggle in edit mode
  const toggleGenre = (genre: string) => {
    if (editGenres.includes(genre)) {
      setEditGenres(editGenres.filter((g) => g !== genre));
    } else {
      if (editGenres.length < 5) {
        setEditGenres([...editGenres, genre]);
      }
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSaving(true);
    const updatedData: Partial<UserProfile> = {
      name: editName.trim(),
      username: editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
      bio: editBio.trim(),
      avatar: editAvatar,
      bannerUrl: editBanner,
      color: editColor,
      favoriteGenres: editGenres,
      socialLinks: {
        instagram: editInstagram.trim(),
        facebook: editFacebook.trim(),
        tiktok: editTiktok.trim(),
        spotify: editSpotify.trim(),
      },
    };

    const res = await updateProfile(currentUser.id, updatedData);
    setIsSaving(false);

    const mergedUser: UserProfile = { ...currentUser, ...updatedData };
    setProfile(mergedUser);
    onUpdateCurrentUser(mergedUser);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab('about');
    }, 1000);

    if (!res.success && res.error) {
      console.warn('Supabase remote sync notice:', res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#e6e6e6] rounded-2xl w-full max-w-2xl overflow-hidden shadow-notion-modal flex flex-col max-h-[92vh] text-[#31302e]">
        {/* Banner & Header Section */}
        <div className="relative h-44 sm:h-52 w-full shrink-0 overflow-hidden bg-[#f6f5f4]">
          <img
            src={
              displayUser.bannerUrl ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80'
            }
            alt="Cover Banner"
            className="w-full h-full object-cover object-center filter brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-black/20" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-[#31302e] shadow-xs border border-[#e6e6e6] backdrop-blur-xs transition-colors cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* User info superimposed on bottom of banner */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
            <div className="flex items-end gap-4 min-w-0">
              {/* Avatar */}
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-3 shadow-md shrink-0 bg-white relative -mb-2 group"
                style={{ borderColor: (isOwnProfile && editColor) || displayUser.color || '#0075de' }}
              >
                <img
                  src={isOwnProfile && editAvatar ? editAvatar : displayUser.avatar}
                  alt={displayUser.name}
                  className="w-full h-full object-cover"
                />
                {isOwnProfile && (
                  <label
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-medium text-center p-1"
                    title="คลิกเพื่ออัปโหลดรูปโปรไฟล์ใหม่"
                  >
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>เปลี่ยนรูป</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarFile(file);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Name & Handle */}
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-[#000000] truncate">
                    {displayUser.name}
                  </h2>
                  {displayUser.provider === 'google' && (
                    <span className="px-2 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-semibold">
                      Google
                    </span>
                  )}
                  {displayUser.provider === 'facebook' && (
                    <span className="px-2 py-0.2 rounded-full bg-blue-50 text-[#1877F2] border border-blue-200 text-[10px] font-semibold">
                      Facebook
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#0075de] font-mono">
                  @{displayUser.username || `user_${displayUser.id.slice(0, 6)}`}
                </p>
              </div>
            </div>

            {/* Action buttons (Follow, Edit, or Sign Out) */}
            <div className="shrink-0 pb-1 flex items-center gap-2">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'edit' ? 'about' : 'edit')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      activeTab === 'edit'
                        ? 'bg-[#0075de] text-white'
                        : 'bg-white hover:bg-[#f6f5f4] text-[#000000] border border-[#e6e6e6]'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{activeTab === 'edit' ? 'ดูโปรไฟล์' : 'แก้ไขโปรไฟล์'}</span>
                  </button>

                  {onLogout && (currentUser.provider === 'google' || currentUser.provider === 'facebook') && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLogout();
                      }}
                      title="ออกจากระบบ (Sign Out)"
                      className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer shadow-xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">ออกจากระบบ</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  disabled={followLoading}
                  onClick={handleToggleFollow}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60 ${
                    isFollowing
                      ? 'bg-white hover:bg-rose-50 text-[#31302e] hover:text-rose-600 border border-[#e6e6e6]'
                      : 'bg-[#0075de] hover:bg-[#005bab] text-white'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-[#1aae39]" />
                      <span>กำลังติดตาม</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>ติดตาม</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats and Navigation Bar */}
        <div className="px-6 py-3 border-b border-[#e6e6e6] bg-[#f6f5f4] flex items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex items-center gap-5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#000000] text-sm">{followersCount}</span>
              <span className="text-[#615d59]">ผู้ติดตาม</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#000000] text-sm">{displayUser.followingCount || 0}</span>
              <span className="text-[#615d59]">กำลังติดตาม</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#000000] text-sm">{favorites.length}</span>
              <span className="text-[#615d59]">เพลงโปรด</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#e6e6e6] shadow-xs">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'favorites'
                  ? 'bg-[#0075de] text-white shadow-xs'
                  : 'text-[#615d59] hover:text-[#000000]'
              }`}
            >
              <Heart className="w-3 h-3" />
              <span>เพลงโปรด</span>
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'about'
                  ? 'bg-[#0075de] text-white shadow-xs'
                  : 'text-[#615d59] hover:text-[#000000]'
              }`}
            >
              <Music className="w-3 h-3" />
              <span>เกี่ยวกับฉัน</span>
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'edit'
                    ? 'bg-[#0075de] text-white shadow-xs'
                    : 'text-[#615d59] hover:text-[#000000]'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>แก้ไข</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: FAVORITES */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#000000] uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>คลังเพลงโปรด ({favorites.length})</span>
                </h3>
                <span className="text-[11px] text-[#615d59]">
                  {isOwnProfile ? 'เพลงที่คุณกดบันทึกไว้ขณะฟังเพลง' : 'เพลงโปรดที่สมาชิกคนนี้บันทึกไว้'}
                </span>
              </div>

              {loadingFavorites ? (
                <div className="py-12 text-center text-xs text-[#615d59] animate-pulse">
                  กำลังโหลดคลังเพลงโปรด...
                </div>
              ) : favorites.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-[#e6e6e6] bg-[#f6f5f4] p-6">
                  <Heart className="w-10 h-10 text-[#a39e98] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#000000]">ยังไม่มีเพลงโปรดในคลัง</p>
                  <p className="text-xs text-[#615d59] mt-1 max-w-sm mx-auto">
                    {isOwnProfile
                      ? 'เมื่อฟังเพลงในห้อง ให้กดปุ่มหัวใจ ❤️ บนแถบเครื่องเล่นเพลงเพื่อเซฟเพลงเก็บไว้ที่นี่'
                      : 'สมาชิกท่านนี้ยังไม่ได้บันทึกเพลงโปรด'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {favorites.map((song) => (
                    <div
                      key={song.id}
                      className="p-3 rounded-xl bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] flex items-center justify-between gap-3.5 transition-all group shadow-xs"
                    >
                      {/* Thumbnail & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-black/60 shrink-0 relative shadow-xs">
                          <img
                            src={song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#000000] truncate group-hover:text-[#0075de] transition-colors">
                            {song.title}
                          </p>
                          <p className="text-[11px] text-[#615d59] truncate mt-0.5">
                            {song.channel || 'YouTube Music'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onPlaySong && (
                          <button
                            type="button"
                            onClick={() =>
                              onPlaySong(
                                song.videoId,
                                song.title,
                                song.channel,
                                song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`
                              )
                            }
                            title="เพิ่มเพลงนี้เข้าคิว / เล่นในห้อง"
                            className="px-3 py-1.5 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>เล่นเพลง</span>
                          </button>
                        )}
                        {isOwnProfile && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFavorite(song.videoId)}
                            title="ลบออกจากเพลงโปรด"
                            className="p-2 rounded-lg text-[#615d59] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Bio description */}
              <div className="p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                <h4 className="text-xs font-semibold text-[#615d59] uppercase tracking-wider mb-2">
                  เกี่ยวกับฉัน (Bio)
                </h4>
                <p className="text-sm text-[#000000] whitespace-pre-line leading-relaxed">
                  {displayUser.bio || 'ไม่มีคำแนะนำตัว'}
                </p>
              </div>

              {/* Music Genres */}
              <div className="p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                <h4 className="text-xs font-semibold text-[#615d59] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#0075de]" />
                  <span>แนวเพลงที่ชอบฟัง (Favorite Genres)</span>
                </h4>
                {displayUser.favoriteGenres && displayUser.favoriteGenres.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {displayUser.favoriteGenres.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1 rounded-full bg-white border border-[#e6e6e6] text-[#0075de] text-xs font-medium shadow-xs"
                      >
                        #{genre}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#a39e98]">ยังไม่ได้เลือกแนวเพลงที่ชอบ</p>
                )}
              </div>

              {/* Social links */}
              <div className="p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                <h4 className="text-xs font-semibold text-[#615d59] uppercase tracking-wider mb-3">
                  ช่องทางโซเชียลมีเดีย
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {displayUser.socialLinks?.instagram && (
                    <a
                      href={`https://instagram.com/${displayUser.socialLinks.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] flex items-center gap-2 text-xs text-[#31302e] shadow-xs transition-colors"
                    >
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <span className="truncate">@{displayUser.socialLinks.instagram}</span>
                      <ExternalLink className="w-3 h-3 text-[#a39e98] ml-auto" />
                    </a>
                  )}
                  {displayUser.socialLinks?.facebook && (
                    <a
                      href={
                        displayUser.socialLinks.facebook.startsWith('http')
                          ? displayUser.socialLinks.facebook
                          : `https://facebook.com/${displayUser.socialLinks.facebook}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] flex items-center gap-2 text-xs text-[#31302e] shadow-xs transition-colors"
                    >
                      <Facebook className="w-4 h-4 text-[#1877F2]" />
                      <span className="truncate">{displayUser.socialLinks.facebook}</span>
                      <ExternalLink className="w-3 h-3 text-[#a39e98] ml-auto" />
                    </a>
                  )}
                  {displayUser.socialLinks?.spotify && (
                    <a
                      href={displayUser.socialLinks.spotify}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] flex items-center gap-2 text-xs text-[#31302e] shadow-xs transition-colors"
                    >
                      <Music className="w-4 h-4 text-[#1aae39]" />
                      <span className="truncate">Spotify Profile</span>
                      <ExternalLink className="w-3 h-3 text-[#a39e98] ml-auto" />
                    </a>
                  )}
                </div>
                {!displayUser.socialLinks?.instagram &&
                  !displayUser.socialLinks?.facebook &&
                  !displayUser.socialLinks?.spotify && (
                    <p className="text-xs text-[#a39e98]">ยังไม่มีข้อมูลโซเชียลมีเดีย</p>
                  )}
              </div>
            </div>
          )}

          {/* TAB 3: EDIT PROFILE */}
          {activeTab === 'edit' && isOwnProfile && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Display Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#31302e] mb-1.5">
                    ชื่อแสดงผล (Display Name)
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#e6e6e6] focus:border-[#0075de] text-[#000000] text-sm outline-none shadow-xs transition-colors"
                    placeholder="เช่น ต้น ฟังเพลงชิลล์ 🎧"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#31302e] mb-1.5">
                    ชื่อผู้ใช้ระบุตัวตน (@username)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-sm text-[#a39e98]">@</span>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) =>
                        setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      }
                      className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-white border border-[#e6e6e6] focus:border-[#0075de] text-[#0075de] text-sm outline-none shadow-xs transition-colors"
                      placeholder="ton_music"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-[#31302e] mb-1.5">
                  คำแนะนำตัว (Bio)
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#e6e6e6] focus:border-[#0075de] text-[#000000] text-sm outline-none shadow-xs transition-colors resize-none"
                  placeholder="แนะนำตัวเองสั้นๆ หรือสไตล์เพลงที่คุณชอบ..."
                />
              </div>

              {/* Favorite Genres Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#31302e] mb-2">
                  เลือกแนวเพลงที่ชอบ (เลือกได้สูงสุด 5 แนว)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_GENRES.map((genre) => {
                    const isSelected = editGenres.includes(genre);
                    return (
                      <button
                        type="button"
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0075de] text-white shadow-xs'
                            : 'bg-white text-[#615d59] hover:text-[#000000] border border-[#e6e6e6]'
                        }`}
                      >
                        #{genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#31302e]">
                  ช่องทางโซเชียลมีเดีย (ไม่บังคับ)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-xs text-[#a39e98]">IG @</span>
                    <input
                      type="text"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      className="w-full pl-12 pr-3.5 py-2 rounded-xl bg-white border border-[#e6e6e6] focus:border-[#0075de] text-[#000000] text-xs outline-none shadow-xs"
                      placeholder="username"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-xs text-[#a39e98]">FB</span>
                    <input
                      type="text"
                      value={editFacebook}
                      onChange={(e) => setEditFacebook(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white border border-[#e6e6e6] focus:border-[#0075de] text-[#000000] text-xs outline-none shadow-xs"
                      placeholder="facebook link หรือชื่อ"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Banner Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#31302e] mb-2">
                  เลือกภาพหน้าปก (Cover Banner)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_BANNERS.map((banner, i) => (
                    <div
                      key={i}
                      onClick={() => setEditBanner(banner)}
                      className={`h-14 rounded-xl overflow-hidden cursor-pointer border-2 transition-all shadow-xs ${
                        editBanner === banner ? 'border-[#0075de] scale-105' : 'border-[#e6e6e6] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={banner} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Avatar Upload & Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#31302e]">
                    รูปโปรไฟล์ & สีประจำตัว (Profile Avatar & Color)
                  </label>
                  {isUploadingAvatar && (
                    <span className="text-xs text-[#0075de] font-medium animate-pulse">กำลังประมวลผลรูป...</span>
                  )}
                </div>

                {avatarUploadError && (
                  <p className="text-xs text-rose-500 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                    {avatarUploadError}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-[#f6f5f4] rounded-xl border border-[#e6e6e6]">
                  <div
                    className="w-14 h-14 rounded-2xl overflow-hidden border-2 bg-white shrink-0 shadow-xs"
                    style={{ borderColor: editColor || '#0075de' }}
                  >
                    <img
                      src={editAvatar || displayUser.avatar}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs font-semibold text-[#000000]">อัปโหลดรูปภาพส่วนตัวจากเครื่อง</p>
                    <p className="text-[11px] text-[#615d59]">รองรับภาพ JPG, PNG, WebP หรือถ่ายภาพจากกล้องมือถือ</p>
                  </div>
                  <label className="px-4 py-2 rounded-full bg-white hover:bg-[#0075de] hover:text-white text-[#0075de] border border-[#0075de] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดรูปภาพ</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarFile(file);
                      }}
                    />
                  </label>
                </div>

                {/* Avatar Preset Selector */}
                <div>
                  <label className="block text-[11px] text-[#615d59] mb-1.5">
                    หรือเลือก Avatar การ์ตูนสำเร็จรูป:
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_AVATARS.map((av) => (
                      <div
                        key={av.id}
                        onClick={() => setEditAvatar(av.svg)}
                        className={`w-10 h-10 rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-white shadow-xs ${
                          editAvatar === av.svg ? 'border-[#0075de] scale-110' : 'border-[#e6e6e6] opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={av.svg} alt={av.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color Palette Selector */}
                <div>
                  <label className="block text-[11px] text-[#615d59] mb-1.5">
                    เลือกสีประจำตัว (Identity Color):
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          editColor === c ? 'scale-125 ring-2 ring-offset-2 ring-[#0075de]' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('about')}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[#615d59] hover:text-[#000000] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>บันทึกสำเร็จ!</span>
                    </>
                  ) : isSaving ? (
                    <span>กำลังบันทึก...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>บันทึกการเปลี่ยนแปลง</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
