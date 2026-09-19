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
} from 'lucide-react';
import { UserProfile, FavoriteSong } from '../types/index.js';
import { PRESET_AVATARS, COLOR_PALETTE } from '../data/presets.js';
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

  const displayUser = profile || targetUser || currentUser;
  const isOwnProfile = displayUser.id === currentUser.id;

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

    // Reset tab
    setActiveTab('favorites');

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

    if (res.success) {
      const mergedUser: UserProfile = { ...currentUser, ...updatedData };
      setProfile(mergedUser);
      onUpdateCurrentUser(mergedUser);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('about');
      }, 1000);
    } else {
      alert(res.error || 'เกิดข้อผิดพลาดในการบันทึกโปรไฟล์');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#11131c] border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Banner & Header Section */}
        <div className="relative h-44 sm:h-52 w-full shrink-0 overflow-hidden bg-gradient-to-br from-purple-900/40 via-rose-900/30 to-gray-900">
          <img
            src={
              displayUser.bannerUrl ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80'
            }
            alt="Cover Banner"
            className="w-full h-full object-cover object-center filter brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#11131c] via-[#11131c]/40 to-black/30" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User info superimposed on bottom of banner */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
            <div className="flex items-end gap-4 min-w-0">
              {/* Avatar */}
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-3 shadow-xl shrink-0 bg-[#161824] relative -mb-2"
                style={{ borderColor: displayUser.color || '#ec4899' }}
              >
                <img
                  src={displayUser.avatar}
                  alt={displayUser.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Name & Handle */}
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white truncate drop-shadow-md">
                    {displayUser.name}
                  </h2>
                  {displayUser.provider === 'google' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-semibold">
                      Google
                    </span>
                  )}
                  {displayUser.provider === 'facebook' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[10px] font-semibold">
                      Facebook
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-cyan-400 font-mono drop-shadow">
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
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'edit'
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                        : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10'
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
                      className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-md transition-all cursor-pointer"
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
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg disabled:opacity-60 ${
                    isFollowing
                      ? 'bg-gray-800 hover:bg-rose-500/20 text-gray-200 hover:text-rose-400 border border-gray-700'
                      : 'bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-rose-500/25'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
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
        <div className="px-6 py-3 border-b border-gray-800 bg-[#141622] flex items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex items-center gap-5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm">{followersCount}</span>
              <span className="text-gray-400">ผู้ติดตาม</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm">{displayUser.followingCount || 0}</span>
              <span className="text-gray-400">กำลังติดตาม</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm">{favorites.length}</span>
              <span className="text-gray-400">เพลงโปรด</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#0e0f17] p-1 rounded-xl border border-gray-800/80">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'favorites'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Heart className="w-3 h-3" />
              <span>เพลงโปรด</span>
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'about'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Music className="w-3 h-3" />
              <span>เกี่ยวกับฉัน</span>
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'edit'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white'
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
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>คลังเพลงโปรด ({favorites.length})</span>
                </h3>
                <span className="text-[11px] text-gray-500">
                  {isOwnProfile ? 'เพลงที่คุณกดบันทึกไว้ขณะฟังเพลง' : 'เพลงโปรดที่สมาชิกคนนี้บันทึกไว้'}
                </span>
              </div>

              {loadingFavorites ? (
                <div className="py-12 text-center text-xs text-gray-500 animate-pulse">
                  กำลังโหลดคลังเพลงโปรด...
                </div>
              ) : favorites.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-gray-800 bg-[#141622]/40 p-6">
                  <Heart className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-400">ยังไม่มีเพลงโปรดในคลัง</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
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
                      className="p-3 rounded-2xl bg-[#161826] hover:bg-[#1c1f30] border border-gray-800/80 hover:border-gray-700 flex items-center justify-between gap-3.5 transition-all group"
                    >
                      {/* Thumbnail & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-14 h-10 rounded-xl overflow-hidden bg-black/60 shrink-0 relative">
                          <img
                            src={song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-rose-400 transition-colors">
                            {song.title}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
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
                            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
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
                            className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
            <div className="space-y-5">
              {/* Bio description */}
              <div className="p-4 rounded-2xl bg-[#161826] border border-gray-800/80">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  เกี่ยวกับฉัน (Bio)
                </h4>
                <p className="text-sm text-gray-200 whitespace-pre-line leading-relaxed">
                  {displayUser.bio || 'ไม่มีคำแนะนำตัว'}
                </p>
              </div>

              {/* Music Genres */}
              <div className="p-4 rounded-2xl bg-[#161826] border border-gray-800/80">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-400" />
                  <span>แนวเพลงที่ชอบฟัง (Favorite Genres)</span>
                </h4>
                {displayUser.favoriteGenres && displayUser.favoriteGenres.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {displayUser.favoriteGenres.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/15 to-purple-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium"
                      >
                        #{genre}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">ยังไม่ได้เลือกแนวเพลงที่ชอบ</p>
                )}
              </div>

              {/* Social links */}
              <div className="p-4 rounded-2xl bg-[#161826] border border-gray-800/80">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  ช่องทางโซเชียลมีเดีย
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {displayUser.socialLinks?.instagram && (
                    <a
                      href={`https://instagram.com/${displayUser.socialLinks.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-[#0f111a] hover:bg-rose-500/10 border border-gray-800 hover:border-rose-500/30 flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors"
                    >
                      <Instagram className="w-4 h-4 text-pink-400" />
                      <span className="truncate">@{displayUser.socialLinks.instagram}</span>
                      <ExternalLink className="w-3 h-3 text-gray-500 ml-auto" />
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
                      className="p-2.5 rounded-xl bg-[#0f111a] hover:bg-blue-500/10 border border-gray-800 hover:border-blue-500/30 flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors"
                    >
                      <Facebook className="w-4 h-4 text-blue-400" />
                      <span className="truncate">{displayUser.socialLinks.facebook}</span>
                      <ExternalLink className="w-3 h-3 text-gray-500 ml-auto" />
                    </a>
                  )}
                  {displayUser.socialLinks?.spotify && (
                    <a
                      href={displayUser.socialLinks.spotify}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-[#0f111a] hover:bg-emerald-500/10 border border-gray-800 hover:border-emerald-500/30 flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors"
                    >
                      <Music className="w-4 h-4 text-emerald-400" />
                      <span className="truncate">Spotify Profile</span>
                      <ExternalLink className="w-3 h-3 text-gray-500 ml-auto" />
                    </a>
                  )}
                </div>
                {!displayUser.socialLinks?.instagram &&
                  !displayUser.socialLinks?.facebook &&
                  !displayUser.socialLinks?.spotify && (
                    <p className="text-xs text-gray-500">ยังไม่มีข้อมูลโซเชียลมีเดีย</p>
                  )}
              </div>
            </div>
          )}

          {/* TAB 3: EDIT PROFILE */}
          {activeTab === 'edit' && isOwnProfile && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Display Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    ชื่อแสดงผล (Display Name)
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161826] border border-gray-800 focus:border-rose-500 text-white text-sm outline-none transition-colors"
                    placeholder="เช่น ต้น ฟังเพลงชิลล์ 🎧"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    ชื่อผู้ใช้ระบุตัวตน (@username)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm text-gray-500">@</span>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) =>
                        setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      }
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#161826] border border-gray-800 focus:border-rose-500 text-cyan-400 text-sm outline-none transition-colors"
                      placeholder="ton_music"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  คำแนะนำตัว (Bio)
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161826] border border-gray-800 focus:border-rose-500 text-white text-sm outline-none transition-colors resize-none"
                  placeholder="แนะนำตัวเองสั้นๆ หรือสไตล์เพลงที่คุณชอบ..."
                />
              </div>

              {/* Favorite Genres Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
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
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                            : 'bg-[#161826] text-gray-400 hover:text-white border border-gray-800'
                        }`}
                      >
                        #{genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-300">
                  ช่องทางโซเชียลมีเดีย (ไม่บังคับ)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-gray-500">IG @</span>
                    <input
                      type="text"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      className="w-full pl-12 pr-3.5 py-2.5 rounded-xl bg-[#161826] border border-gray-800 focus:border-rose-500 text-white text-xs outline-none"
                      placeholder="username"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-gray-500">FB</span>
                    <input
                      type="text"
                      value={editFacebook}
                      onChange={(e) => setEditFacebook(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#161826] border border-gray-800 focus:border-rose-500 text-white text-xs outline-none"
                      placeholder="facebook link หรือชื่อ"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Banner Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  เลือกภาพหน้าปก (Cover Banner)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_BANNERS.map((banner, i) => (
                    <div
                      key={i}
                      onClick={() => setEditBanner(banner)}
                      className={`h-14 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        editBanner === banner ? 'border-rose-500 scale-105' : 'border-gray-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={banner} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Avatar Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  เลือกรูปโปรไฟล์ (Avatar Presets)
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_AVATARS.map((av) => (
                    <div
                      key={av.id}
                      onClick={() => setEditAvatar(av.svg)}
                      className={`w-10 h-10 rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-[#161824] ${
                        editAvatar === av.svg ? 'border-rose-500 scale-110' : 'border-gray-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={av.svg} alt={av.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('about')}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
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
