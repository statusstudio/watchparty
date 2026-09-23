import React, { useState, useEffect } from 'react';
import {
  Crown,
  Share2,
  Check,
  Music,
  Play,
  Heart,
  Calendar,
  Sparkles,
  ExternalLink,
  Instagram,
  Facebook,
  Youtube,
  Radio,
  ArrowLeft,
  Edit3,
  Globe,
  Headphones,
  UserCheck,
  UserPlus,
  Trash2,
  Disc,
} from 'lucide-react';
import { UserProfile, FavoriteSong, VideoState } from '../types/index.js';
import { fetchFavorites, removeFavorite, toggleFollow } from '../services/supabase.js';

interface PublicProfileData extends UserProfile {
  activeRoom?: {
    roomId: string;
    roomName: string;
    video?: VideoState;
  } | null;
}

interface PublicProfileViewProps {
  handle: string;
  currentUser: UserProfile;
  onNavigateHome: () => void;
  onJoinRoom: (roomId: string) => void;
  onOpenEditProfile: () => void;
  onPlaySong?: (videoId: string, title?: string, channel?: string) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  handle,
  currentUser,
  onNavigateHome,
  onJoinRoom,
  onOpenEditProfile,
  onPlaySong,
  onShowToast,
}) => {
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [favorites, setFavorites] = useState<FavoriteSong[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [activeTab, setActiveTab] = useState<'favorites' | 'about'>('favorites');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const cleanHandle = handle.replace(/^@/, '').trim();
  const isOwnProfile = Boolean(
    currentUser &&
      ((profile && profile.id === currentUser.id) ||
        (profile &&
          profile.username &&
          currentUser.username &&
          profile.username.toLowerCase() === currentUser.username.toLowerCase()) ||
        (currentUser.username && currentUser.username.toLowerCase() === cleanHandle.toLowerCase()) ||
        (currentUser.id === cleanHandle))
  );

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/users/profile/${encodeURIComponent(cleanHandle)}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'ไม่พบโปรไฟล์ผู้ใช้นี้');
        }
        return res.json();
      })
      .then((data: PublicProfileData) => {
        if (isMounted) {
          setProfile(data);
          setIsFollowing(Boolean(data.isFollowing));
          setFollowersCount(data.followersCount || 0);
          document.title = `${data.name} (@${data.username || cleanHandle}) – pleng.online`;

          // Fetch favorite songs from database / storage
          setLoadingFavorites(true);
          fetchFavorites(data.id)
            .then((favs) => {
              if (isMounted) {
                if (favs && favs.length > 0) {
                  setFavorites(favs);
                } else if (data.favoriteSongs && data.favoriteSongs.length > 0) {
                  setFavorites(data.favoriteSongs);
                } else {
                  setFavorites([]);
                }
              }
            })
            .catch(() => {
              if (isMounted) setFavorites(data.favoriteSongs || []);
            })
            .finally(() => {
              if (isMounted) setLoadingFavorites(false);
            });
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          // Check if it's the current user viewing themselves before server knows
          if (
            currentUser &&
            ((currentUser.username && currentUser.username.toLowerCase() === cleanHandle.toLowerCase()) ||
              currentUser.id === cleanHandle)
          ) {
            setProfile({
              ...currentUser,
              username: currentUser.username || cleanHandle,
            });
            setFollowersCount(currentUser.followersCount || 0);
            fetchFavorites(currentUser.id).then((favs) => {
              if (isMounted && favs) setFavorites(favs);
            });
          } else {
            setError(err.message || 'ไม่พบผู้ใช้นี้ในระบบ');
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanHandle, currentUser]);

  const handleCopyProfileLink = () => {
    const url = `${window.location.origin}/@${profile?.username || cleanHandle}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    onShowToast(`คัดลอกลิงก์โปรไฟล์เรียบร้อยแล้ว: ${url}`, 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyHandle = () => {
    const handleText = `@${profile?.username || cleanHandle}`;
    navigator.clipboard.writeText(handleText);
    setCopiedHandle(true);
    onShowToast(`คัดลอก ${handleText} แล้ว`, 'info');
    setTimeout(() => setCopiedHandle(false), 2000);
  };

  const handleToggleFollow = async () => {
    if (isOwnProfile || !profile) return;
    if (!currentUser.provider || currentUser.provider === 'guest') {
      onShowToast('กรุณาเข้าสู่ระบบด้วย Google หรือ Facebook เพื่อติดตามเพื่อน', 'warning');
      return;
    }
    setFollowLoading(true);
    const newStatus = await toggleFollow(currentUser.id, profile.id);
    setIsFollowing(newStatus);
    setFollowersCount((prev) => (newStatus ? prev + 1 : Math.max(0, prev - 1)));
    setFollowLoading(false);
    onShowToast(newStatus ? `ติดตาม @${profile.username || cleanHandle} แล้ว` : `เลิกติดตามแล้ว`, 'info');
  };

  const handleRemoveFavorite = async (songId?: string, videoId?: string) => {
    if (!videoId && !songId) return;
    const targetId = songId || videoId!;
    await removeFavorite(currentUser.id, targetId);
    setFavorites((prev) => prev.filter((s) => s.videoId !== videoId && s.id !== songId));
    onShowToast('ลบเพลงออกจากคลังเพลงโปรดแล้ว', 'info');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-3 border-[#0075de]/20 border-t-[#0075de] animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#615d59]">กำลังโหลดหน้าเพจโปรไฟล์ @{cleanHandle}...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#e6e6e6] bg-white sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between shadow-xs">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-xs font-semibold text-[#615d59] hover:text-[#000000] p-2 rounded-xl hover:bg-[#f6f5f4] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าหลัก</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-[#000000]">pleng.online</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
            <Headphones className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-[#000000]">ไม่พบผู้ใช้ @{cleanHandle}</h2>
          <p className="text-xs text-[#615d59] leading-relaxed">
            บัญชีผู้ใช้นี้อาจยังไม่ได้ลงทะเบียน หรือผู้ใช้อาจเปลี่ยนชื่อ Handle ไปแล้ว
          </p>
          <button
            onClick={onNavigateHome}
            className="px-5 py-2.5 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าแรก pleng.online</span>
          </button>
        </div>
      </div>
    );
  }

  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
      })
    : 'สมาชิกเริ่มต้น';

  const defaultBanner =
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80';
  const banner = profile.bannerUrl || defaultBanner;

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-[#fcfbf9] flex flex-col text-[#31302e]">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[#e6e6e6] bg-white sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#615d59] hover:text-[#000000] px-3 py-2 rounded-xl hover:bg-[#f6f5f4] transition-all cursor-pointer border border-[#e6e6e6]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">หน้าหลัก</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#a39e98]">/</span>
            <span className="text-xs font-bold text-[#0075de]">@{profile.username || cleanHandle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleCopyProfileLink}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="คัดลอกลิงก์โปรไฟล์นี้"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'คัดลอกแล้ว!' : 'แชร์โปรไฟล์'}</span>
          </button>

          {isOwnProfile && (
            <button
              onClick={onOpenEditProfile}
              className="px-3.5 py-2 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไขโปรไฟล์</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Profile Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Profile Card Header */}
        <div className="bg-white border border-[#e6e6e6] rounded-3xl overflow-hidden shadow-xs">
          {/* Cover Banner */}
          <div className="h-44 sm:h-56 w-full relative bg-gray-900 overflow-hidden">
            <img src={banner} alt="Cover Banner" className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          </div>

          {/* Profile Header Details */}
          <div className="px-5 sm:px-8 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
              {/* Avatar with Ring */}
              <div className="relative inline-block">
                <div
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white bg-white overflow-hidden shadow-md relative"
                  style={{ borderColor: '#ffffff' }}
                >
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Online in Room Indicator */}
                {profile.activeRoom ? (
                  <span
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-3 border-white ring-2 ring-emerald-400/40 animate-pulse"
                    title="กำลังออนไลน์อยู่ในห้องฟังเพลง"
                  />
                ) : (
                  <span
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-gray-300 border-3 border-white"
                    title="ออฟไลน์"
                  />
                )}
              </div>

              {/* Action Buttons on right */}
              <div className="flex items-center gap-2 sm:mb-2">
                <button
                  onClick={handleCopyHandle}
                  className="px-3 py-1.5 rounded-xl border border-[#e6e6e6] hover:bg-[#f6f5f4] text-xs font-medium text-[#615d59] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {copiedHandle ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  <span>@{profile.username || cleanHandle}</span>
                </button>

                {!isOwnProfile ? (
                  <button
                    type="button"
                    disabled={followLoading}
                    onClick={handleToggleFollow}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60 active:scale-95 ${
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
                ) : (
                  <button
                    onClick={onOpenEditProfile}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขโปรไฟล์</span>
                  </button>
                )}
              </div>
            </div>

            {/* User Title & Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#000000] tracking-tight">
                  {profile.name}
                </h1>

                {profile.isSuperAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    <span>SUPER ADMIN</span>
                  </span>
                )}

                {profile.provider === 'google' && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold">
                    Google
                  </span>
                )}
                {profile.provider === 'facebook' && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1877F2] border border-blue-200 text-xs font-semibold">
                    Facebook
                  </span>
                )}
                {profile.provider === 'email' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-semibold">
                    Email
                  </span>
                )}
              </div>

              <p className="text-xs font-medium text-[#615d59] flex items-center gap-2">
                <span>@{profile.username || cleanHandle}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#a39e98]">
                  <Calendar className="w-3 h-3" />
                  เข้าร่วมเมื่อ {joinDate}
                </span>
              </p>

              {/* Stats Bar */}
              <div className="flex items-center gap-4 py-2 my-2 border-y border-[#e6e6e6] text-xs">
                <div>
                  <span className="font-bold text-[#000000] mr-1">{followersCount}</span>
                  <span className="text-[#615d59]">ผู้ติดตาม</span>
                </div>
                <div>
                  <span className="font-bold text-[#000000] mr-1">{profile.followingCount || 0}</span>
                  <span className="text-[#615d59]">กำลังติดตาม</span>
                </div>
                <div>
                  <span className="font-bold text-[#0075de] mr-1">{favorites.length}</span>
                  <span className="text-[#615d59]">เพลงโปรด</span>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-xs text-[#31302e] leading-relaxed pt-1 whitespace-pre-line max-w-2xl">
                  {profile.bio}
                </p>
              )}

              {/* Favorite Music Genres */}
              {profile.favoriteGenres && profile.favoriteGenres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[11px] font-semibold text-[#a39e98] mr-1">แนวเพลงที่ชอบ:</span>
                  {profile.favoriteGenres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-0.5 rounded-lg bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6] text-[11px] font-medium"
                    >
                      #{g}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Links */}
              {profile.socialLinks && Object.values(profile.socialLinks).some((v) => Boolean(v)) && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e6e6e6]/60 mt-3">
                  {profile.socialLinks.instagram && (
                    <a
                      href={
                        profile.socialLinks.instagram.startsWith('http')
                          ? profile.socialLinks.instagram
                          : `https://instagram.com/${profile.socialLinks.instagram.replace(/^@/, '')}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#f6f5f4] hover:bg-pink-50 text-[#31302e] hover:text-pink-600 border border-[#e6e6e6] hover:border-pink-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>Instagram</span>
                    </a>
                  )}

                  {profile.socialLinks.facebook && (
                    <a
                      href={
                        profile.socialLinks.facebook.startsWith('http')
                          ? profile.socialLinks.facebook
                          : `https://facebook.com/${profile.socialLinks.facebook}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#f6f5f4] hover:bg-blue-50 text-[#31302e] hover:text-blue-600 border border-[#e6e6e6] hover:border-blue-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Facebook className="w-3.5 h-3.5" />
                      <span>Facebook</span>
                    </a>
                  )}

                  {profile.socialLinks.youtube && (
                    <a
                      href={
                        profile.socialLinks.youtube.startsWith('http')
                          ? profile.socialLinks.youtube
                          : `https://youtube.com/@${profile.socialLinks.youtube.replace(/^@/, '')}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#f6f5f4] hover:bg-rose-50 text-[#31302e] hover:text-rose-600 border border-[#e6e6e6] hover:border-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>YouTube</span>
                    </a>
                  )}

                  {profile.socialLinks.spotify && (
                    <a
                      href={
                        profile.socialLinks.spotify.startsWith('http')
                          ? profile.socialLinks.spotify
                          : `https://open.spotify.com/user/${profile.socialLinks.spotify}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#f6f5f4] hover:bg-emerald-50 text-[#31302e] hover:text-emerald-600 border border-[#e6e6e6] hover:border-emerald-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Disc className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Spotify</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Presence Card: Jump to Room */}
        {profile.activeRoom && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0075de]/10 via-[#0075de]/5 to-purple-500/10 border border-[#0075de]/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#0075de] text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
                <Radio className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-xs font-bold text-[#000000]">กำลังออนไลน์ฟังเพลงในห้องปาร์ตี้ 🎵</p>
                </div>
                <p className="text-sm font-bold text-[#0075de] truncate mt-0.5">
                  {profile.activeRoom.roomName}
                </p>
                {profile.activeRoom.video?.title && (
                  <p className="text-xs text-[#615d59] truncate">
                    กำลังเล่น: {profile.activeRoom.video.title}
                  </p>
                )}
              </div>
            </div>

            <a
              href={`/#${profile.activeRoom.roomId}`}
              onClick={(e) => {
                e.preventDefault();
                onJoinRoom(profile.activeRoom!.roomId);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 no-underline"
              title={`เข้าร่วมห้อง ${profile.activeRoom.roomName}`}
            >
              <Headphones className="w-4 h-4" />
              <span>เข้าร่วมห้องฟังด้วยกัน</span>
            </a>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e6e6e6] pb-2">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'favorites'
                ? 'bg-[#0075de] text-white shadow-xs'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>คลังเพลงโปรด ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'about'
                ? 'bg-[#0075de] text-white shadow-xs'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ข้อมูลเพิ่มเติม</span>
          </button>
        </div>

        {/* TAB 1: FAVORITE SONGS */}
        {activeTab === 'favorites' && (
          <div className="space-y-3">
            {loadingFavorites ? (
              <div className="text-center py-12 bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs">
                <div className="w-8 h-8 rounded-full border-2 border-[#0075de]/20 border-t-[#0075de] animate-spin mx-auto mb-3" />
                <p className="text-xs text-[#615d59]">กำลังโหลดคลังเพลงโปรด...</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-16 bg-white border border-[#e6e6e6] rounded-2xl p-6 space-y-3 shadow-xs">
                <Music className="w-10 h-10 text-[#a39e98] mx-auto opacity-50" />
                <p className="text-xs font-bold text-[#000000]">ยังไม่มีเพลงโปรดในรายการ</p>
                <p className="text-[11px] text-[#615d59]">
                  {isOwnProfile
                    ? 'เมื่อคุณกด ❤️ เพลงในห้องปาร์ตี้ เพลงจะมาแสดงในคลังเพลงโปรดนี้อัตโนมัติ'
                    : 'สมาชิกคนนี้ยังไม่ได้บันทึกเพลงโปรด'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.map((song) => (
                  <div
                    key={song.id || song.videoId}
                    className="p-3 bg-white border border-[#e6e6e6] hover:border-[#0075de]/40 rounded-2xl flex items-center gap-3 transition-all shadow-xs group"
                  >
                    {/* Thumbnail with click-to-play */}
                    <div
                      onClick={() => onPlaySong && onPlaySong(song.videoId, song.title, song.channel)}
                      className="w-16 h-12 rounded-xl bg-gray-900 overflow-hidden shrink-0 relative cursor-pointer group/thumb shadow-2xs"
                      title={`เปิดฟังเพลง: ${song.title}`}
                    >
                      <img
                        src={song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        onClick={() => onPlaySong && onPlaySong(song.videoId, song.title, song.channel)}
                        className="text-xs font-bold text-[#000000] truncate group-hover:text-[#0075de] transition-colors cursor-pointer"
                        title={song.title}
                      >
                        {song.title}
                      </p>
                      <p className="text-[11px] text-[#615d59] truncate">{song.channel || 'YouTube'}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onPlaySong && (
                        <button
                          type="button"
                          onClick={() => onPlaySong(song.videoId, song.title, song.channel)}
                          className="w-8 h-8 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="เปิดเพลงนี้ทันที"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                      )}

                      {isOwnProfile && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(song.id, song.videoId)}
                          className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-[#a39e98] hover:text-rose-600 border border-[#e6e6e6] hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="ลบออกจากเพลงโปรด"
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
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#000000] uppercase tracking-wider text-[#a39e98]">
              ข้อมูลบัญชีผู้ใช้
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                <p className="text-[10px] text-[#a39e98] font-bold uppercase">ลิงก์เพจส่วนตัว (Personal URL)</p>
                <p className="text-xs font-bold text-[#0075de] mt-1 break-all">
                  {window.location.origin}/@{profile.username || cleanHandle}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                <p className="text-[10px] text-[#a39e98] font-bold uppercase">สถานะสมาชิก</p>
                <p className="text-xs font-bold text-[#000000] mt-1">
                  {profile.isSuperAdmin ? 'ผู้ดูแลระบบสูงสุด (Super Admin)' : 'สมาชิกทั่วไป'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfileView;
