import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  MessageCircle,
  Phone,
  Image as ImageIcon,
  Send,
  X,
  Search,
  Loader2,
} from 'lucide-react';
import { UserProfile, FavoriteSong, VideoState, SocialPost, SocialSongAttachment, RoomSummary } from '../types/index.js';
import { fetchFavorites, removeFavorite, toggleFollow } from '../services/supabase.js';
import { compressChatImage } from '../services/imageCompressor.js';
import { StitchHeader } from './stitch/StitchHeader.js';
import { StitchMobileBottomNav } from './stitch/StitchMobileBottomNav.js';

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
  onStartDM?: (user: { id: string; name: string; username?: string; avatar: string; color?: string }) => void;
  onStartCall?: (user: { id: string; name: string; username?: string; avatar: string; color?: string }, isVideo: boolean) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenCreateRoom?: () => void;
  onOpenRoomCodeModal?: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenDM?: () => void;
  unreadDmCount?: number;
  myActiveRoom?: RoomSummary;
  onNavigateTab?: (tab: 'explore' | 'feed' | 'favorites' | 'popular' | 'my-rooms') => void;
  onNavigateToProfile?: (handle: string) => void;
}

function extractYouTubeId(urlOrText: string): string | null {
  if (!urlOrText) return null;
  const trimmed = urlOrText.trim();
  if (trimmed.length === 11 && /^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'เมื่อสักครู่';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  return new Date(timestamp).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  handle,
  currentUser,
  onNavigateHome,
  onJoinRoom,
  onOpenEditProfile,
  onPlaySong,
  onShowToast,
  onStartDM,
  onStartCall,
  theme = 'dark',
  onToggleTheme,
  onOpenCreateRoom,
  onOpenRoomCodeModal,
  onOpenAuth,
  onLogout,
  onOpenDM,
  unreadDmCount = 0,
  myActiveRoom,
  onNavigateTab,
  onNavigateToProfile,
}) => {
  const isLight = theme === 'light';
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [favorites, setFavorites] = useState<FavoriteSong[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'favorites' | 'about'>('posts');
  const [userPosts, setUserPosts] = useState<SocialPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Post Composer State (เมื่อดูหน้าโปรไฟล์ของตนเอง)
  const [newPostContent, setNewPostContent] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [songAttachment, setSongAttachment] = useState<SocialSongAttachment | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isCompressingImg, setIsCompressingImg] = useState(false);
  const [isAttachingSong, setIsAttachingSong] = useState(false);
  const [songInput, setSongInput] = useState('');
  const [isSearchingSong, setIsSearchingSong] = useState(false);
  const [songSearchResults, setSongSearchResults] = useState<
    Array<{ videoId: string; title: string; channel?: string; thumbnail: string; duration?: string }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Post interactions: Expanded comments & comment inputs
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

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

    const currentUserIdParam = currentUser?.id ? `?currentUserId=${encodeURIComponent(currentUser.id)}` : '';
    fetch(`/api/users/profile/${encodeURIComponent(cleanHandle)}${currentUserIdParam}`)
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

          // Fetch favorite songs
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

          // Fetch user posts
          setLoadingPosts(true);
          fetch(`/api/posts?authorId=${encodeURIComponent(data.id)}${currentUser?.id ? `&currentUserId=${encodeURIComponent(currentUser.id)}` : ''}`)
            .then((r) => r.json())
            .then((pData) => {
              if (isMounted && pData.posts) setUserPosts(pData.posts);
            })
            .catch(() => {})
            .finally(() => {
              if (isMounted) setLoadingPosts(false);
            });
        }
      })
      .catch((err: any) => {
        if (isMounted) {
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
            fetch(`/api/posts?authorId=${encodeURIComponent(currentUser.id)}`)
              .then((r) => r.json())
              .then((pData) => {
                if (isMounted && pData.posts) setUserPosts(pData.posts);
              })
              .catch(() => {});
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
  }, [cleanHandle, currentUser?.id]);

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
    setFollowLoading(true);
    const newStatus = await toggleFollow(currentUser.id, profile.id);
    setIsFollowing(newStatus);
    const updatedCount = newStatus ? followersCount + 1 : Math.max(0, followersCount - 1);
    setFollowersCount(updatedCount);
    setProfile((prev) => (prev ? { ...prev, isFollowing: newStatus, followersCount: updatedCount } : prev));
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

  // Image Upload for Post Composer
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingImg(true);
      const compressed = await compressChatImage(file, 1200, 0.82);
      setPostImages((prev) => [...prev, compressed]);
      onShowToast('แนบรูปภาพเรียบร้อยแล้ว 📸', 'info');
    } catch (err: any) {
      onShowToast(err.message || 'ไม่สามารถอัปโหลดรูปภาพได้', 'warning');
    } finally {
      setIsCompressingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Song Attachment
  const handleSearchOrAttachSong = async () => {
    const query = songInput.trim();
    if (!query) return;

    const directId = extractYouTubeId(query);
    if (directId) {
      setIsSearchingSong(true);
      try {
        const oembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${directId}`);
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          setSongAttachment({
            videoId: directId,
            title: data.title || 'วิดีโอ YouTube',
            thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
            channel: data.author_name || 'YouTube',
          });
          setIsAttachingSong(false);
          setSongInput('');
          setSongSearchResults([]);
          onShowToast(`แนบเพลง "${(data.title || directId).slice(0, 24)}..." สำเร็จ 🎵`, 'success');
          return;
        }
      } catch {}

      setSongAttachment({
        videoId: directId,
        title: 'เพลง YouTube',
        thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
        channel: 'YouTube',
      });
      setIsAttachingSong(false);
      setSongInput('');
      setSongSearchResults([]);
      onShowToast('แนบเพลงสำเร็จแล้ว 🎵', 'success');
      setIsSearchingSong(false);
      return;
    }

    setIsSearchingSong(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setSongSearchResults(data.results.slice(0, 6));
        } else {
          onShowToast('ไม่พบเพลงที่ค้นหา ลองพิมพ์ชื่อเพลงหรือศิลปินอื่นครับ', 'warning');
        }
      }
    } catch {
      onShowToast('ไม่สามารถค้นหาเพลงได้ กรุณาลองใหม่อีกครั้ง', 'warning');
    } finally {
      setIsSearchingSong(false);
    }
  };

  // Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.provider === 'guest') {
      onShowToast('กรุณาเข้าสู่ระบบก่อนโพสต์ครับ', 'warning');
      onOpenAuth?.();
      return;
    }

    if (!newPostContent.trim() && postImages.length === 0 && !songAttachment) {
      onShowToast('กรุณาเขียนข้อความ แนบรูป หรือใส่เพลงก่อนโพสต์ครับ', 'warning');
      return;
    }

    try {
      setIsSubmittingPost(true);
      const payload = {
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorUsername: currentUser.username || currentUser.id,
        authorAvatar: currentUser.avatar,
        authorColor: currentUser.color || '#0075de',
        content: newPostContent.trim(),
        images: postImages,
        songAttachment: songAttachment || undefined,
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'ไม่สามารถโพสต์ได้');
      }

      const data = await res.json();
      if (data.post) {
        setUserPosts((prev) => [data.post, ...prev]);
        setNewPostContent('');
        setPostImages([]);
        setSongAttachment(null);
        setIsAttachingSong(false);
        onShowToast('โพสต์ลงฟีดชุมชนเรียบร้อยแล้ว 🎉', 'success');
      }
    } catch (err: any) {
      onShowToast(err.message || 'เกิดข้อผิดพลาดในการโพสต์', 'warning');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Like Post
  const handleLikePost = async (postId: string) => {
    if (!currentUser || currentUser.provider === 'guest') {
      onShowToast('กรุณาเข้าสู่ระบบก่อนกดหัวใจครับ', 'warning');
      onOpenAuth?.();
      return;
    }

    setUserPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextHasLiked = !p.hasLiked;
          return {
            ...p,
            hasLiked: nextHasLiked,
            likesCount: nextHasLiked ? (p.likesCount || 0) + 1 : Math.max(0, (p.likesCount || 0) - 1),
          };
        }
        return p;
      })
    );

    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch {}
  };

  // Send Comment
  const handleSendComment = async (postId: string) => {
    if (!currentUser || currentUser.provider === 'guest') {
      onShowToast('กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็นครับ', 'warning');
      onOpenAuth?.();
      return;
    }

    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText) return;

    try {
      setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorUsername: currentUser.username || currentUser.id,
          authorAvatar: currentUser.avatar,
          authorColor: currentUser.color || '#0075de',
          content: commentText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setUserPosts((prev) =>
            prev.map((p) => {
              if (p.id === postId) {
                const existing = p.comments || [];
                return {
                  ...p,
                  commentsCount: (p.commentsCount || 0) + 1,
                  comments: [...existing, data.comment],
                };
              }
              return p;
            })
          );
          setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
          onShowToast('แสดงความคิดเห็นแล้ว 💬', 'success');
        }
      }
    } catch {
      onShowToast('ไม่สามารถส่งความคิดเห็นได้', 'warning');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('คุณต้องการลบโพสต์นี้ใช่หรือไม่?')) return;

    try {
      const res = await fetch(
        `/api/posts/${postId}?userId=${encodeURIComponent(currentUser?.id || '')}&isAdmin=${currentUser?.isSuperAdmin ? 'true' : 'false'}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setUserPosts((prev) => prev.filter((p) => p.id !== postId));
        onShowToast('ลบโพสต์เรียบร้อยแล้ว', 'info');
      }
    } catch {
      onShowToast('ไม่สามารถลบโพสต์ได้', 'warning');
    }
  };

  if (loading) {
    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center p-4 transition-colors z-50 ${
        isLight ? 'bg-[#faf8ff] text-[#131b2e]' : 'bg-[#111319] text-[#e2e2ea]'
      }`}>
        <div className="w-12 h-12 rounded-full border-3 border-[#0075de]/20 border-t-[#0075de] animate-spin mb-4" />
        <p className="text-sm font-semibold opacity-70">กำลังโหลดหน้าเพจโปรไฟล์ @{cleanHandle}...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`fixed inset-0 overflow-y-auto overflow-x-hidden flex flex-col transition-colors z-50 ${
        isLight ? 'bg-[#faf8ff] text-[#131b2e]' : 'bg-[#111319] text-[#e2e2ea]'
      }`}>
        {/* Top Header - Main Menu Style */}
        <StitchHeader
          currentTab="explore"
          onTabChange={(tab) => {
            if (onNavigateTab) onNavigateTab(tab);
            else onNavigateHome();
          }}
          onOpenCreateRoom={onOpenCreateRoom || onNavigateHome}
          onOpenRoomCodeModal={onOpenRoomCodeModal || onNavigateHome}
          onOpenProfile={() => {
            const myHandle = currentUser.username || currentUser.name || currentUser.id;
            if (onNavigateToProfile) onNavigateToProfile(myHandle);
          }}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
          onNavigateToPublicProfile={(targetHandle) => {
            if (onNavigateToProfile) onNavigateToProfile(targetHandle);
          }}
          currentUser={currentUser}
          myActiveRoom={myActiveRoom}
          onSelectRoom={onJoinRoom}
          searchQuery=""
          onSearchChange={() => {}}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onOpenDM={onOpenDM}
          unreadDmCount={unreadDmCount}
        />

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4 pt-20">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs">
            <Headphones className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold">ไม่พบผู้ใช้ @{cleanHandle}</h2>
          <p className="text-xs opacity-70 leading-relaxed">
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
    <div className={`fixed inset-0 overflow-y-auto overflow-x-hidden flex flex-col transition-colors duration-300 z-30 ${
      isLight ? 'bg-[#faf8ff] text-[#131b2e]' : 'bg-[#111319] text-[#e2e2ea]'
    }`}>
      {/* 1. TOP HEADER (Exact Same Menu as Main Home Page) */}
      <StitchHeader
        currentTab="explore"
        onTabChange={(tab) => {
          if (onNavigateTab) onNavigateTab(tab);
          else onNavigateHome();
        }}
        onOpenCreateRoom={onOpenCreateRoom || onNavigateHome}
        onOpenRoomCodeModal={onOpenRoomCodeModal || onNavigateHome}
        onOpenProfile={() => {
          const myHandle = currentUser.username || currentUser.name || currentUser.id;
          if (onNavigateToProfile) onNavigateToProfile(myHandle);
        }}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onNavigateToPublicProfile={(targetHandle) => {
          if (onNavigateToProfile) onNavigateToProfile(targetHandle);
        }}
        currentUser={currentUser}
        myActiveRoom={myActiveRoom}
        onSelectRoom={onJoinRoom}
        searchQuery=""
        onSearchChange={() => {}}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenDM={onOpenDM}
        unreadDmCount={unreadDmCount}
      />

      {/* 2. MAIN PROFILE CONTAINER */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-22 pb-24 lg:pb-12 space-y-5">
        {/* Profile Card Header */}
        <div className={`rounded-3xl overflow-hidden border shadow-xs transition-colors ${
          isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.08]'
        }`}>
          {/* Cover Banner */}
          <div className="h-40 sm:h-56 w-full relative bg-gray-900 overflow-hidden">
            <img src={banner} alt="Cover Banner" className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>

          {/* Profile Header Details */}
          <div className="px-4 sm:px-8 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-20 mb-4">
              {/* Avatar with Ring */}
              <div className="relative inline-block">
                <div
                  className={`w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 overflow-hidden shadow-md relative ${
                    isLight ? 'border-white bg-white' : 'border-[#191b22] bg-[#111319]'
                  }`}
                >
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                </div>

                {/* Online in Room Indicator */}
                {profile.activeRoom ? (
                  <span
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-3 border-white dark:border-[#191b22] ring-2 ring-emerald-400/40 animate-pulse"
                    title="กำลังออนไลน์อยู่ในห้องฟังเพลง"
                  />
                ) : (
                  <span
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-zinc-400 border-3 border-white dark:border-[#191b22]"
                    title="ออฟไลน์"
                  />
                )}
              </div>

              {/* Action Buttons on right */}
              <div className="flex flex-wrap items-center gap-2 sm:mb-2">
                <button
                  onClick={handleCopyHandle}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    isLight ? 'bg-white border-[#dae2fd] hover:bg-[#f2f3ff] text-[#131b2e]' : 'bg-[#111319] border-white/10 hover:bg-white/[0.06] text-[#e2e2ea]'
                  }`}
                >
                  {copiedHandle ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  <span>@{profile.username || cleanHandle}</span>
                </button>

                <button
                  onClick={handleCopyProfileLink}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    isLight ? 'bg-white border-[#dae2fd] hover:bg-[#f2f3ff] text-[#131b2e]' : 'bg-[#111319] border-white/10 hover:bg-white/[0.06] text-[#e2e2ea]'
                  }`}
                  title="คัดลอกลิงก์โปรไฟล์นี้"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copiedLink ? 'คัดลอกแล้ว!' : 'แชร์'}</span>
                </button>

                {!isOwnProfile ? (
                  <div className="flex items-center gap-2">
                    {onStartCall && (
                      <button
                        type="button"
                        onClick={() => {
                          if (profile) {
                            onStartCall(
                              {
                                id: profile.id,
                                name: profile.name,
                                username: profile.username,
                                avatar: profile.avatar,
                                color: profile.color,
                              },
                              false
                            );
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                        title="โทรด้วยเสียง (Voice Call)"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>โทร</span>
                      </button>
                    )}
                    {onStartDM && (
                      <button
                        type="button"
                        onClick={() => {
                          if (profile) {
                            onStartDM({
                              id: profile.id,
                              name: profile.name,
                              username: profile.username,
                              avatar: profile.avatar,
                              color: profile.color,
                            });
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border border-pink-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                        title="ส่งข้อความส่วนตัว (DM)"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>ส่งข้อความ</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={followLoading}
                      onClick={handleToggleFollow}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60 active:scale-95 ${
                        isFollowing
                          ? isLight ? 'bg-white hover:bg-rose-50 text-[#131b2e] border border-[#dae2fd]' : 'bg-[#111319] hover:bg-rose-500/10 text-[#e2e2ea] border border-white/10'
                          : 'bg-[#0075de] hover:bg-[#005bab] text-white shadow-[0_2px_12px_rgba(0,117,222,0.4)]'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>กำลังติดตาม</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>ติดตาม</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onOpenEditProfile}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
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
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{profile.name}</h1>

                {profile.isSuperAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    <span>SUPER ADMIN</span>
                  </span>
                )}

                {profile.provider === 'google' && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-semibold">
                    Google
                  </span>
                )}
                {profile.provider === 'facebook' && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-semibold">
                    Facebook
                  </span>
                )}
                {profile.provider === 'email' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
                    Email
                  </span>
                )}
              </div>

              <p className="text-xs font-medium text-[#64748b] dark:text-[#94A3B8] flex items-center gap-2">
                <span>@{profile.username || cleanHandle}</span>
                <span>•</span>
                <span className="flex items-center gap-1 opacity-80">
                  <Calendar className="w-3 h-3" />
                  เข้าร่วมเมื่อ {joinDate}
                </span>
              </p>

              {/* Stats Bar */}
              <div className={`flex items-center gap-4 py-2.5 my-2 border-y text-xs ${
                isLight ? 'border-[#dae2fd]' : 'border-white/[0.08]'
              }`}>
                <div>
                  <span className="font-bold mr-1">{followersCount}</span>
                  <span className="text-[#64748b] dark:text-[#94A3B8]">ผู้ติดตาม</span>
                </div>
                <div>
                  <span className="font-bold mr-1">{profile.followingCount || 0}</span>
                  <span className="text-[#64748b] dark:text-[#94A3B8]">กำลังติดตาม</span>
                </div>
                <div>
                  <span className="font-bold text-[#0075de] dark:text-[#00daf3] mr-1">{favorites.length}</span>
                  <span className="text-[#64748b] dark:text-[#94A3B8]">เพลงโปรด</span>
                </div>
                <div>
                  <span className="font-bold mr-1">{userPosts.length}</span>
                  <span className="text-[#64748b] dark:text-[#94A3B8]">โพสต์</span>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-xs leading-relaxed pt-1 whitespace-pre-line max-w-2xl opacity-90">
                  {profile.bio}
                </p>
              )}

              {/* Favorite Music Genres */}
              {profile.favoriteGenres && profile.favoriteGenres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[11px] font-semibold text-[#64748b] dark:text-[#94A3B8] mr-1">
                    แนวเพลงที่ชอบ:
                  </span>
                  {profile.favoriteGenres.map((g) => (
                    <span
                      key={g}
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium border ${
                        isLight ? 'bg-[#faf8ff] border-[#dae2fd] text-[#131b2e]' : 'bg-[#111319] border-white/10 text-[#e2e2ea]'
                      }`}
                    >
                      #{g}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Links */}
              {profile.socialLinks && Object.values(profile.socialLinks).some((v) => Boolean(v)) && (
                <div className={`flex flex-wrap items-center gap-2 pt-2 border-t mt-3 ${
                  isLight ? 'border-[#dae2fd]/60' : 'border-white/[0.06]'
                }`}>
                  {profile.socialLinks.instagram && (
                    <a
                      href={
                        profile.socialLinks.instagram.startsWith('http')
                          ? profile.socialLinks.instagram
                          : `https://instagram.com/${profile.socialLinks.instagram.replace(/^@/, '')}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        isLight
                          ? 'bg-[#faf8ff] hover:bg-pink-50 border-[#dae2fd] text-[#131b2e] hover:text-pink-600'
                          : 'bg-[#111319] hover:bg-pink-500/10 border-white/10 text-[#e2e2ea] hover:text-pink-400'
                      }`}
                    >
                      <Instagram className="w-3.5 h-3.5 text-pink-500" />
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
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        isLight
                          ? 'bg-[#faf8ff] hover:bg-blue-50 border-[#dae2fd] text-[#131b2e] hover:text-blue-600'
                          : 'bg-[#111319] hover:bg-blue-500/10 border-white/10 text-[#e2e2ea] hover:text-blue-400'
                      }`}
                    >
                      <Facebook className="w-3.5 h-3.5 text-blue-500" />
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
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        isLight
                          ? 'bg-[#faf8ff] hover:bg-rose-50 border-[#dae2fd] text-[#131b2e] hover:text-rose-600'
                          : 'bg-[#111319] hover:bg-rose-500/10 border-white/10 text-[#e2e2ea] hover:text-rose-400'
                      }`}
                    >
                      <Youtube className="w-3.5 h-3.5 text-rose-500" />
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
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        isLight
                          ? 'bg-[#faf8ff] hover:bg-emerald-50 border-[#dae2fd] text-[#131b2e] hover:text-emerald-600'
                          : 'bg-[#111319] hover:bg-emerald-500/10 border-white/10 text-[#e2e2ea] hover:text-emerald-400'
                      }`}
                    >
                      <Disc className="w-3.5 h-3.5 text-emerald-500" />
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
          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
            isLight
              ? 'bg-gradient-to-r from-blue-50/90 via-cyan-50/80 to-indigo-50/90 border-[#0075de]/30'
              : 'bg-gradient-to-r from-[#0075de]/15 via-[#00daf3]/10 to-[#191b22] border-[#00daf3]/30'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#0075de] to-[#00daf3] text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
                <Radio className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-xs font-bold">กำลังออนไลน์ฟังเพลงในห้องปาร์ตี้ 🎵</p>
                </div>
                <p className="text-sm font-bold text-[#0075de] dark:text-[#00daf3] truncate mt-0.5">
                  {profile.activeRoom.roomName}
                </p>
                {profile.activeRoom.video?.title && (
                  <p className="text-xs text-[#64748b] dark:text-[#94A3B8] truncate">
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
        <div className={`flex items-center gap-2 border-b pb-2 ${
          isLight ? 'border-[#dae2fd]' : 'border-white/[0.08]'
        }`}>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'posts'
                ? 'bg-[#0075de] text-white shadow-xs'
                : isLight ? 'text-[#64748b] hover:text-[#131b2e] hover:bg-white' : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>โพสต์ ({userPosts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'favorites'
                ? 'bg-[#0075de] text-white shadow-xs'
                : isLight ? 'text-[#64748b] hover:text-[#131b2e] hover:bg-white' : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06]'
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
                : isLight ? 'text-[#64748b] hover:text-[#131b2e] hover:bg-white' : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ข้อมูลเพิ่มเติม</span>
          </button>
        </div>

        {/* TAB 0: POSTS & FEED COMPOSER */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {/* Feed Composer (เฉพาะเมื่อดูหน้าโปรไฟล์ของตนเอง) */}
            {isOwnProfile && (
              <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-xs transition-colors space-y-3 ${
                isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.08]'
              }`}>
                {/* Composer Header */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0"
                    style={{ borderColor: currentUser.color || '#0075de' }}
                  >
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm truncate">{currentUser.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-[#0075de]/10 text-[#0075de] dark:text-[#00daf3] text-[9px] font-bold">
                        โพสต์ลงฟีดสาธารณะ
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748b] dark:text-[#94A3B8]">
                      แชร์ความรู้สึก รูปภาพ หรือเพลงโปรดลงฟีดชุมชนได้ทันที
                    </p>
                  </div>
                </div>

                {/* Textarea Input */}
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="คุณกำลังคิดอะไรอยู่? หรืออยากแชร์เพลงอะไรให้เพื่อนฟัง..."
                    rows={3}
                    className={`w-full p-3 rounded-2xl text-xs sm:text-sm focus:outline-none transition-colors resize-none ${
                      isLight
                        ? 'bg-[#faf8ff] border border-[#dae2fd] focus:border-[#0075de] text-[#131b2e]'
                        : 'bg-black/30 border border-white/10 focus:border-[#00daf3] text-[#e2e2ea]'
                    }`}
                  />

                  {/* Attached Images Preview */}
                  {postImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {postImages.map((img, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/20 group">
                          <img src={img} alt="Attached" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPostImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attached Song Preview */}
                  {songAttachment && (
                    <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      isLight ? 'bg-blue-50/80 border-blue-200' : 'bg-[#0075de]/10 border-[#00daf3]/30'
                    }`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={songAttachment.thumbnail}
                          alt={songAttachment.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-xs"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-[#0075de] dark:text-[#00daf3] uppercase flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            เพลงที่แนบ
                          </span>
                          <p className="text-xs font-bold truncate">{songAttachment.title}</p>
                          <p className="text-[10px] text-[#64748b] dark:text-[#94A3B8] truncate">{songAttachment.channel || 'YouTube'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSongAttachment(null)}
                        className="w-7 h-7 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center cursor-pointer shrink-0"
                        title="ลบเพลงที่แนบ"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Music Search / Link Popup Bar */}
                  {isAttachingSong && (
                    <div className={`p-3 rounded-2xl border space-y-2 animate-in fade-in zoom-in-95 duration-200 ${
                      isLight ? 'bg-[#faf8ff] border-[#dae2fd]' : 'bg-black/40 border-white/10'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={songInput}
                          onChange={(e) => setSongInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSearchOrAttachSong();
                            }
                          }}
                          placeholder="วางลิงก์ YouTube หรือค้นหาชื่อเพลง..."
                          className={`flex-1 px-3 py-1.5 rounded-xl text-xs focus:outline-none ${
                            isLight
                              ? 'bg-white border border-[#dae2fd] text-[#131b2e]'
                              : 'bg-[#191b22] border border-white/10 text-[#e2e2ea]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleSearchOrAttachSong}
                          disabled={isSearchingSong || !songInput.trim()}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        >
                          {isSearchingSong ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                          <span>ค้นหา</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAttachingSong(false);
                            setSongSearchResults([]);
                          }}
                          className="p-1.5 rounded-xl text-[#64748b] hover:text-black dark:hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Song Search Results */}
                      {songSearchResults.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto">
                          {songSearchResults.map((song) => (
                            <div
                              key={song.videoId}
                              onClick={() => {
                                setSongAttachment({
                                  videoId: song.videoId,
                                  title: song.title,
                                  thumbnail: song.thumbnail,
                                  channel: song.channel || 'YouTube',
                                });
                                setIsAttachingSong(false);
                                setSongInput('');
                                setSongSearchResults([]);
                                onShowToast(`แนบเพลง "${song.title.slice(0, 24)}..." เรียบร้อย 🎵`, 'success');
                              }}
                              className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.01] ${
                                isLight
                                  ? 'bg-white border-[#dae2fd] hover:border-[#0075de]'
                                  : 'bg-[#191b22] border-white/10 hover:border-[#00daf3]'
                              }`}
                            >
                              <img src={song.thumbnail} alt="" className="w-10 h-8 rounded-lg object-cover shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate">{song.title}</p>
                                <p className="text-[10px] text-[#64748b] dark:text-[#94A3B8] truncate">{song.channel}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isCompressingImg}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isLight
                            ? 'bg-[#faf8ff] hover:bg-[#f2f3ff] border-[#dae2fd] text-[#131b2e]'
                            : 'bg-[#111319] hover:bg-white/[0.06] border-white/10 text-[#e2e2ea]'
                        }`}
                      >
                        {isCompressingImg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5 text-blue-500" />}
                        <span>แนบรูป</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAttachingSong(!isAttachingSong)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          songAttachment
                            ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
                            : isLight
                            ? 'bg-[#faf8ff] hover:bg-[#f2f3ff] border-[#dae2fd] text-[#131b2e]'
                            : 'bg-[#111319] hover:bg-white/[0.06] border-white/10 text-[#e2e2ea]'
                        }`}
                      >
                        <Music className="w-3.5 h-3.5 text-cyan-500" />
                        <span>แนบเพลง</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingPost || (!newPostContent.trim() && postImages.length === 0 && !songAttachment)}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0075de] to-[#005eb4] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-40 transition-all cursor-pointer active:scale-95"
                    >
                      {isSubmittingPost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>โพสต์ลงฟีด</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Posts List */}
            {loadingPosts ? (
              <div className={`text-center py-12 rounded-2xl border p-6 shadow-xs ${
                isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.08]'
              }`}>
                <div className="w-8 h-8 rounded-full border-2 border-[#0075de]/20 border-t-[#0075de] animate-spin mx-auto mb-3" />
                <p className="text-xs text-[#64748b] dark:text-[#94A3B8]">กำลังโหลดโพสต์...</p>
              </div>
            ) : userPosts.length === 0 ? (
              <div className={`text-center py-12 rounded-2xl border p-6 space-y-2 shadow-xs ${
                isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.08]'
              }`}>
                <MessageSquare className="w-8 h-8 text-[#64748b] dark:text-[#94A3B8] mx-auto opacity-40" />
                <p className="text-sm font-bold">ยังไม่มีโพสต์</p>
                <p className="text-xs text-[#64748b] dark:text-[#94A3B8]">
                  {isOwnProfile ? 'เริ่มเขียนโพสต์แรกของคุณ หรือแชร์เพลงโปรดลงฟีดชุมชนด้านบนได้เลย!' : 'ผู้ใช้นี้ยังไม่ได้โพสต์ข้อความหรือรูปภาพ'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xs space-y-3 transition-colors ${
                      isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.08]'
                    }`}
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0"
                          style={{ borderColor: post.authorColor || '#0075de' }}
                        >
                          <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm truncate">{post.authorName}</h4>
                          <span className="text-[10px] text-[#64748b] dark:text-[#94A3B8]">
                            {formatRelativeTime(post.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Delete Button (for author or superadmin) */}
                      {(isOwnProfile || post.authorId === currentUser.id || currentUser.isSuperAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 rounded-xl text-[#64748b] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="ลบโพสต์นี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Post Content */}
                    {post.content && (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                    )}

                    {/* Post Images */}
                    {post.images && post.images.length > 0 && (
                      <div className="rounded-2xl overflow-hidden max-h-96 bg-black/10 border border-black/5 dark:border-white/5">
                        <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Song Attachment */}
                    {post.songAttachment && (
                      <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                        isLight ? 'bg-blue-50/80 border-blue-200' : 'bg-[#0075de]/10 border-[#00daf3]/30'
                      }`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={post.songAttachment.thumbnail}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-xs"
                          />
                          <div className="min-w-0">
                            <span className="text-[9px] font-bold text-[#0075de] dark:text-[#00daf3] uppercase flex items-center gap-1">
                              <Music className="w-3 h-3" />
                              เพลงที่แนบ
                            </span>
                            <p className="text-xs font-bold truncate">{post.songAttachment.title}</p>
                            <p className="text-[10px] text-[#64748b] dark:text-[#94A3B8] truncate">{post.songAttachment.channel || 'YouTube'}</p>
                          </div>
                        </div>
                        {onPlaySong && (
                          <button
                            type="button"
                            onClick={() =>
                              onPlaySong(
                                post.songAttachment!.videoId,
                                post.songAttachment!.title,
                                post.songAttachment!.channel || 'YouTube'
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>เปิดฟัง</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Post Footer Actions */}
                    <div className={`flex items-center gap-4 text-xs pt-2.5 border-t ${
                      isLight ? 'border-[#dae2fd]' : 'border-white/[0.08]'
                    }`}>
                      <button
                        type="button"
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
                          post.hasLiked ? 'text-rose-500 font-bold scale-105' : 'text-[#64748b] dark:text-[#94A3B8] hover:text-rose-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.hasLiked ? 'fill-current text-rose-500' : ''}`} />
                        <span>{post.likesCount || 0}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedComments((prev) => ({
                            ...prev,
                            [post.id]: !prev[post.id],
                          }))
                        }
                        className="flex items-center gap-1.5 font-semibold text-[#64748b] dark:text-[#94A3B8] hover:text-[#0075de] dark:hover:text-[#00daf3] transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.commentsCount || (post.comments ? post.comments.length : 0)} ความคิดเห็น</span>
                      </button>
                    </div>

                    {/* Comments Thread (Expandable) */}
                    {expandedComments[post.id] && (
                      <div className={`mt-3 pt-3 border-t space-y-3 ${
                        isLight ? 'border-[#dae2fd]' : 'border-white/[0.08]'
                      }`}>
                        {post.comments && post.comments.length > 0 && (
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {post.comments.map((cmt) => (
                              <div
                                key={cmt.id}
                                className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                                  isLight ? 'bg-[#faf8ff] border-[#dae2fd]' : 'bg-[#111319] border-white/5'
                                }`}
                              >
                                <div
                                  className="w-7 h-7 rounded-full overflow-hidden border shrink-0 mt-0.5"
                                  style={{ borderColor: cmt.authorColor || '#0075de' }}
                                >
                                  <img src={cmt.authorAvatar} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-[11px] truncate">{cmt.authorName}</span>
                                    <span className="text-[9px] text-[#64748b] dark:text-[#94A3B8]">
                                      {formatRelativeTime(cmt.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs mt-0.5 break-words">{cmt.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Comment Input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendComment(post.id);
                              }
                            }}
                            placeholder="พิมพ์ความคิดเห็น..."
                            className={`flex-1 px-3 py-1.5 rounded-xl text-xs focus:outline-none transition-colors ${
                              isLight
                                ? 'bg-[#faf8ff] border border-[#dae2fd] focus:border-[#0075de]'
                                : 'bg-black/40 border border-white/10 focus:border-[#00daf3]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleSendComment(post.id)}
                            disabled={submittingComment[post.id] || !(commentInputs[post.id] || '').trim()}
                            className="px-3 py-1.5 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-bold disabled:opacity-50 transition-all cursor-pointer"
                          >
                            ส่ง
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: FAVORITE SONGS */}
        {activeTab === 'favorites' && (
          <div className="space-y-3">
            {loadingFavorites ? (
              <div className={`text-center py-12 rounded-2xl border p-6 shadow-xs ${
                isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.08]'
              }`}>
                <div className="w-8 h-8 rounded-full border-2 border-[#0075de]/20 border-t-[#0075de] animate-spin mx-auto mb-3" />
                <p className="text-xs text-[#64748b] dark:text-[#94A3B8]">กำลังโหลดคลังเพลงโปรด...</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className={`text-center py-16 rounded-2xl border p-6 space-y-3 shadow-xs ${
                isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.08]'
              }`}>
                <Music className="w-10 h-10 text-[#64748b] dark:text-[#94A3B8] mx-auto opacity-50" />
                <p className="text-xs font-bold">ยังไม่มีเพลงโปรดในรายการ</p>
                <p className="text-[11px] text-[#64748b] dark:text-[#94A3B8]">
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
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition-all shadow-xs group ${
                      isLight
                        ? 'bg-white border-[#dae2fd] hover:border-[#0075de]'
                        : 'bg-[#191b22] border-white/[0.08] hover:border-[#00daf3]/50'
                    }`}
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
                        className="text-xs font-bold truncate hover:text-[#0075de] dark:hover:text-[#00daf3] transition-colors cursor-pointer"
                        title={song.title}
                      >
                        {song.title}
                      </p>
                      <p className="text-[11px] text-[#64748b] dark:text-[#94A3B8] truncate">{song.channel || 'YouTube'}</p>
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
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 ${
                            isLight
                              ? 'bg-white hover:bg-rose-50 border-[#dae2fd] text-zinc-400 hover:text-rose-600 hover:border-rose-200'
                              : 'bg-[#111319] hover:bg-rose-500/20 border-white/10 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30'
                          }`}
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
          <div className={`rounded-2xl sm:rounded-3xl border p-6 shadow-xs space-y-4 ${
            isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.08]'
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b] dark:text-[#94A3B8]">
              ข้อมูลบัญชีผู้ใช้
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-[#faf8ff] border-[#dae2fd]' : 'bg-[#111319] border-white/10'
              }`}>
                <p className="text-[10px] text-[#64748b] dark:text-[#94A3B8] font-bold uppercase">ลิงก์เพจส่วนตัว (Personal URL)</p>
                <p className="text-xs font-bold text-[#0075de] dark:text-[#00daf3] mt-1 break-all">
                  {window.location.origin}/@{profile.username || cleanHandle}
                </p>
              </div>

              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-[#faf8ff] border-[#dae2fd]' : 'bg-[#111319] border-white/10'
              }`}>
                <p className="text-[10px] text-[#64748b] dark:text-[#94A3B8] font-bold uppercase">สถานะสมาชิก</p>
                <p className="text-xs font-bold mt-1">
                  {profile.isSuperAdmin ? 'ผู้ดูแลระบบสูงสุด (Super Admin)' : 'สมาชิกทั่วไป'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. MOBILE & TABLET BOTTOM NAV (Exact Same as Home Page with Profile Active) */}
      <StitchMobileBottomNav
        currentTab="profile"
        currentUser={currentUser}
        onTabChange={(tab) => {
          if (tab === 'profile') {
            // Already on profile
          } else if (tab === 'create') {
            if (onOpenCreateRoom) onOpenCreateRoom();
            else onNavigateHome();
          } else {
            if (onNavigateTab) onNavigateTab(tab);
            else onNavigateHome();
          }
        }}
        onOpenCreateRoom={onOpenCreateRoom || onNavigateHome}
        onOpenProfile={() => {}}
        theme={theme}
      />
    </div>
  );
};

export default PublicProfileView;
