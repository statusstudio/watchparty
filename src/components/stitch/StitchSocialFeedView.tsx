import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Image as ImageIcon,
  Music,
  Send,
  X,
  Sparkles,
  Play,
  Flame,
  Check,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, SocialPost, SocialSongAttachment, RoomSummary } from '../../types/index.js';
import { socketService } from '../../services/socket.js';
import { compressProfileImage } from '../../services/imageCompressor.js';

interface StitchSocialFeedViewProps {
  currentUser?: UserProfile;
  onOpenAuth?: () => void;
  onNavigateToPublicProfile?: (handle: string) => void;
  onPlaySong?: (videoId: string, title?: string, channel?: string) => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
  myActiveRoom?: RoomSummary;
  theme?: 'dark' | 'light';
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

function extractYouTubeId(urlOrText: string): string | null {
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = urlOrText.match(regExp);
  return match ? match[1] : null;
}

export const StitchSocialFeedView: React.FC<StitchSocialFeedViewProps> = ({
  currentUser,
  onOpenAuth,
  onNavigateToPublicProfile,
  onPlaySong,
  onShowToast,
  myActiveRoom,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'songs' | 'my'>('all');

  // Composer State
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [songAttachment, setSongAttachment] = useState<SocialSongAttachment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAttachingSong, setIsAttachingSong] = useState(false);
  const [songInput, setSongInput] = useState('');
  const [isCompressingImg, setIsCompressingImg] = useState(false);

  // Active expanded comments
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch posts on mount & filter change
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentUser?.id) {
        params.set('currentUserId', currentUser.id);
      }
      if (filterTab === 'songs') {
        params.set('hasSongOnly', 'true');
      }
      if (filterTab === 'my' && currentUser) {
        params.set('authorId', currentUser.id);
      }

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filterTab, currentUser?.id]);

  // WebSocket realtime events listener
  useEffect(() => {
    const unsubscribe = socketService.subscribe((data: any) => {
      try {
        if (!data || !data.type) return;

        if (data.type === 'SOCIAL_NEW_POST' && data.post) {
          setPosts((prev) => {
            if (prev.some((p) => p.id === data.post.id)) return prev;
            return [data.post, ...prev];
          });
        } else if (data.type === 'SOCIAL_POST_LIKED') {
          setPosts((prev) =>
            prev.map((p) => {
              if (p.id === data.postId) {
                const isMe = currentUser?.id && data.userId === currentUser.id;
                return {
                  ...p,
                  likesCount: data.likesCount,
                  hasLiked: isMe ? data.hasLiked : p.hasLiked,
                };
              }
              return p;
            })
          );
        } else if (data.type === 'SOCIAL_NEW_COMMENT' && data.comment) {
          setPosts((prev) =>
            prev.map((p) => {
              if (p.id === data.postId) {
                const existing = p.comments || [];
                if (existing.some((c) => c.id === data.comment.id)) return p;
                return {
                  ...p,
                  commentsCount: (p.commentsCount || 0) + 1,
                  comments: [...existing, data.comment],
                };
              }
              return p;
            })
          );
        } else if (data.type === 'SOCIAL_POST_DELETED' && data.postId) {
          setPosts((prev) => prev.filter((p) => p.id !== data.postId));
        }
      } catch (err) {
        // ignore invalid json
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id]);

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingImg(true);
      const compressed = await compressProfileImage(file, 800);
      setImages((prev) => [...prev, compressed]);
      onShowToast?.('แนบรูปภาพเรียบร้อยแล้ว', 'info');
    } catch (err: any) {
      onShowToast?.(err.message || 'ไม่สามารถอัปโหลดรูปภาพได้', 'warning');
    } finally {
      setIsCompressingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Attach Song
  const handleAttachSongConfirm = () => {
    if (!songInput.trim()) return;
    const ytid = extractYouTubeId(songInput.trim());

    if (ytid) {
      setSongAttachment({
        videoId: ytid,
        title: 'เพลง YouTube',
        thumbnail: `https://i.ytimg.com/vi/${ytid}/hqdefault.jpg`,
        channel: 'YouTube',
      });
      setIsAttachingSong(false);
      setSongInput('');
      onShowToast?.('แนบเพลงสำเร็จแล้ว 🎵', 'success');
    } else {
      // If entered song title or keyword
      setSongAttachment({
        videoId: 'jfKfPfyJRdk',
        title: songInput.trim(),
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        channel: 'Music',
      });
      setIsAttachingSong(false);
      setSongInput('');
      onShowToast?.('แนบชื่อเพลงสำเร็จ 🎵', 'success');
    }
  };

  // Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.provider === 'guest') {
      onShowToast?.('กรุณาเข้าสู่ระบบก่อนโพสต์ข้อความครับ', 'warning');
      onOpenAuth?.();
      return;
    }

    if (!content.trim() && images.length === 0 && !songAttachment) {
      onShowToast?.('กรุณาเขียนข้อความ แนบรูป หรือใส่เพลงก่อนโพสต์ครับ', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorUsername: currentUser.username || currentUser.id,
        authorAvatar: currentUser.avatar,
        authorColor: currentUser.color || '#0075de',
        content: content.trim(),
        images,
        songAttachment: songAttachment || undefined,
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('ไม่สามารถโพสต์ได้');
      }

      const data = await res.json();
      if (data.post) {
        setPosts((prev) => [data.post, ...prev]);
        setContent('');
        setImages([]);
        setSongAttachment(null);
        onShowToast?.('แชร์โพสต์ไปยังฟีดเรียบร้อยแล้ว 🎉', 'success');
      }
    } catch (err: any) {
      onShowToast?.(err.message || 'เกิดข้อผิดพลาดในการโพสต์', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Like
  const handleLike = async (postId: string) => {
    if (!currentUser || currentUser.provider === 'guest') {
      onShowToast?.('กรุณาเข้าสู่ระบบก่อนกดหัวใจครับ', 'warning');
      onOpenAuth?.();
      return;
    }

    // Optimistic UI update
    setPosts((prev) =>
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
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (!res.ok) {
        fetchPosts(); // rollback on failure
      }
    } catch {
      fetchPosts();
    }
  };

  // Send Comment
  const handleSendComment = async (postId: string) => {
    if (!currentUser || currentUser.provider === 'guest') {
      onShowToast?.('กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็นครับ', 'warning');
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
          setPosts((prev) =>
            prev.map((p) => {
              if (p.id === postId) {
                return {
                  ...p,
                  commentsCount: (p.commentsCount || 0) + 1,
                  comments: [...(p.comments || []), data.comment],
                };
              }
              return p;
            })
          );
          setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
          onShowToast?.('แสดงความคิดเห็นแล้ว 💬', 'success');
        }
      }
    } catch (err) {
      onShowToast?.('ไม่สามารถส่งความคิดเห็นได้', 'warning');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('คุณต้องการลบโพสต์นี้ใช่หรือไม่?')) return;

    try {
      const res = await fetch(`/api/posts/${postId}?userId=${encodeURIComponent(currentUser?.id || '')}&isAdmin=${currentUser?.isSuperAdmin ? 'true' : 'false'}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        onShowToast?.('ลบโพสต์เรียบร้อยแล้ว', 'info');
      }
    } catch {
      onShowToast?.('ไม่สามารถลบโพสต์ได้', 'warning');
    }
  };

  return (
    <div className={`flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 max-w-3xl mx-auto w-full space-y-5 transition-colors duration-200 ${
      isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'
    }`}>
      {/* Feed Title & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.08] dark:border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0075de] dark:text-[#00daf3]">
              dynamic_feed
            </span>
            <span>ฟีดชุมชนเสียงเพลง</span>
          </h1>
          <p className="text-xs text-[#64748b] dark:text-[#94A3B8] mt-0.5">
            แชร์ความรู้สึก รูปภาพ และป้ายยาเพลงโปรดกับผู้ฟังทั่วประเทศ
          </p>
        </div>

        {/* Filter Pills */}
        <div className={`flex items-center p-1 rounded-2xl border text-xs font-semibold ${
          isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/10'
        }`}>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filterTab === 'all'
                ? isLight ? 'bg-[#0075de] text-white shadow-xs' : 'bg-[#00daf3] text-[#111319] font-bold shadow-xs'
                : 'hover:opacity-80'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setFilterTab('songs')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              filterTab === 'songs'
                ? isLight ? 'bg-[#0075de] text-white shadow-xs' : 'bg-[#00daf3] text-[#111319] font-bold shadow-xs'
                : 'hover:opacity-80'
            }`}
          >
            <span>มีเพลงแนบ</span>
            <span>🎵</span>
          </button>
          {currentUser && currentUser.provider !== 'guest' && (
            <button
              onClick={() => setFilterTab('my')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterTab === 'my'
                  ? isLight ? 'bg-[#0075de] text-white shadow-xs' : 'bg-[#00daf3] text-[#111319] font-bold shadow-xs'
                  : 'hover:opacity-80'
              }`}
            >
              โพสต์ของฉัน
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* CREATE POST COMPOSER */}
      {/* ======================================================== */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all ${
        isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/10 shadow-lg'
      }`}>
        <form onSubmit={handleCreatePost} className="space-y-3.5">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 shadow-xs"
              style={{ borderColor: currentUser?.color || '#0075de' }}
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                placeholder={
                  currentUser?.provider && currentUser.provider !== 'guest'
                    ? `สวัสดีคุณ ${currentUser.name}, วันนี้กำลังฟังเพลงอะไรอยู่ หรืออยากแชร์อะไรกับเพื่อนๆ?`
                    : 'เข้าสู่ระบบเพื่อร่วมโพสต์ข้อความ รูปภาพ และเพลงโปรด...'
                }
                disabled={!currentUser || currentUser.provider === 'guest'}
                className={`w-full p-2.5 rounded-2xl text-xs sm:text-sm resize-none focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-[#faf8ff] border border-[#dae2fd] text-[#131b2e] focus:border-[#0075de]'
                    : 'bg-[#111319] border border-white/10 text-white focus:border-[#00daf3]'
                }`}
              />
            </div>
          </div>

          {/* Attached Images Preview */}
          {images.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {images.map((imgUri, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/20 shrink-0 group">
                  <img src={imgUri} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Attached Song Preview Card */}
          {songAttachment && (
            <div className={`p-2.5 rounded-2xl border flex items-center gap-3 relative group ${
              isLight ? 'bg-blue-50/70 border-blue-200' : 'bg-[#0075de]/10 border-[#00daf3]/30'
            }`}>
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative bg-black/40">
                <img src={songAttachment.thumbnail} alt="" className="w-full h-full object-cover" />
                <span className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                  <Music className="w-4 h-4 text-[#00daf3]" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-[#0075de] dark:text-[#00daf3] uppercase tracking-wider flex items-center gap-1">
                  <span>กำลังฟังเพลงนี้</span>
                  <span>🎵</span>
                </span>
                <p className="text-xs font-bold truncate mt-0.5">{songAttachment.title}</p>
                <p className="text-[10px] text-[#64748b] dark:text-[#94A3B8] truncate">{songAttachment.channel || 'YouTube'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSongAttachment(null)}
                className="w-6 h-6 rounded-full bg-black/40 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="นำเพลงออก"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attach Song Inline Input Box */}
          {isAttachingSong && (
            <div className="p-3 rounded-2xl bg-black/20 border border-white/10 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={songInput}
                  onChange={(e) => setSongInput(e.target.value)}
                  placeholder="วางลิงก์ YouTube (เช่น https://youtu.be/... ) หรือพิมพ์ชื่อเพลง"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#00daf3]"
                />
                <button
                  type="button"
                  onClick={handleAttachSongConfirm}
                  className="px-3 py-1.5 rounded-xl bg-[#0075de] text-white text-xs font-bold hover:bg-[#005bab] transition-all cursor-pointer"
                >
                  แนบเพลง
                </button>
                <button
                  type="button"
                  onClick={() => setIsAttachingSong(false)}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick attach from currently active room */}
              {myActiveRoom?.currentVideo?.title && (
                <button
                  type="button"
                  onClick={() => {
                    setSongAttachment({
                      videoId: myActiveRoom.currentVideo.videoId,
                      title: myActiveRoom.currentVideo.title,
                      thumbnail: myActiveRoom.currentVideo.thumbnail || `https://i.ytimg.com/vi/${myActiveRoom.currentVideo.videoId}/hqdefault.jpg`,
                    });
                    setIsAttachingSong(false);
                  }}
                  className="text-[11px] text-[#00daf3] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>⚡ ดึงเพลงจากห้องปาร์ตี้ของคุณ:</span>
                  <span className="font-bold truncate max-w-xs">{myActiveRoom.currentVideo.title}</span>
                </button>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressingImg || (!currentUser || currentUser.provider === 'guest')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isLight
                    ? 'hover:bg-gray-100 text-[#475569]'
                    : 'hover:bg-white/10 text-[#94A3B8]'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>{isCompressingImg ? 'กำลังย่อรูป...' : 'รูปภาพ'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAttachingSong(!isAttachingSong)}
                disabled={!currentUser || currentUser.provider === 'guest'}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isLight
                    ? 'hover:bg-gray-100 text-[#475569]'
                    : 'hover:bg-white/10 text-[#94A3B8]'
                }`}
              >
                <Music className="w-4 h-4 text-purple-400" />
                <span>แนบเพลง</span>
              </button>
            </div>

            {(!currentUser || currentUser.provider === 'guest') ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0075de] to-[#00daf3] text-white text-xs font-bold hover:brightness-110 transition-all cursor-pointer"
              >
                เข้าสู่ระบบเพื่อโพสต์
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && images.length === 0 && !songAttachment)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0075de] to-[#00daf3] text-white text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'กำลังแชร์...' : 'โพสต์เลย'}</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* POSTS LIST STREAM */}
      {/* ======================================================== */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#0075de] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-[#64748b] dark:text-[#94A3B8]">กำลังโหลดฟีดเสียงเพลง...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className={`p-10 rounded-3xl border text-center space-y-3 ${
          isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/10'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-[#0075de]/10 text-[#0075de] dark:text-[#00daf3] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold">ยังไม่มีโพสต์ในหมวดหมู่นี้</h3>
          <p className="text-xs text-[#64748b] dark:text-[#94A3B8] max-w-sm mx-auto">
            เป็นคนแรกที่เริ่มแชร์เพลงโปรด หรือโพสต์ทักทายเพื่อนๆ ในคอมมูนิตี้คนรักเสียงเพลง!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isAuthor = currentUser?.id && post.authorId === currentUser.id;
            const canDelete = isAuthor || Boolean(currentUser?.isSuperAdmin);
            const isCommentsOpen = Boolean(expandedComments[post.id]);

            return (
              <div
                key={post.id}
                className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all ${
                  isLight ? 'bg-white border-[#dae2fd]' : 'bg-[#191b22] border-white/10'
                }`}
              >
                {/* Author Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div
                    onClick={() => {
                      if (onNavigateToPublicProfile && (post.authorUsername || post.authorId)) {
                        onNavigateToPublicProfile(post.authorUsername || post.authorId);
                      }
                    }}
                    className="flex items-center gap-3 cursor-pointer group min-w-0"
                  >
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                      style={{ borderColor: post.authorColor || '#0075de' }}
                    >
                      <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm truncate group-hover:text-[#0075de] dark:group-hover:text-[#00daf3] transition-colors">
                          {post.authorName}
                        </span>
                        {post.authorId === 'admin' && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                            👑 ทีมงาน
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#64748b] dark:text-[#94A3B8]">
                        <span className="font-mono">@{post.authorUsername || post.authorId}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="ลบโพสต์"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Content Text */}
                {post.content && (
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words mb-3">
                    {post.content}
                  </p>
                )}

                {/* Attached Images */}
                {post.images && post.images.length > 0 && (
                  <div className={`mb-3.5 rounded-2xl overflow-hidden border border-white/10 ${
                    post.images.length > 1 ? 'grid grid-cols-2 gap-1.5' : ''
                  }`}>
                    {post.images.map((img, i) => (
                      <div key={i} className="max-h-96 w-full overflow-hidden bg-black/40">
                        <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Attached Song Card */}
                {post.songAttachment && (
                  <div className={`mb-3.5 p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                    isLight
                      ? 'bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border-blue-200'
                      : 'bg-gradient-to-r from-[#0075de]/15 to-[#00daf3]/10 border-[#00daf3]/30'
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/50 shrink-0 relative">
                        <img src={post.songAttachment.thumbnail} alt="" className="w-full h-full object-cover" />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0075de] text-white flex items-center justify-center">
                          <Music className="w-2.5 h-2.5" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{post.songAttachment.title}</p>
                        <p className="text-[10px] text-[#64748b] dark:text-[#94A3B8] truncate">
                          {post.songAttachment.channel || 'YouTube'}
                        </p>
                      </div>
                    </div>

                    {onPlaySong && post.songAttachment.videoId && (
                      <button
                        type="button"
                        onClick={() => {
                          onPlaySong(
                            post.songAttachment!.videoId,
                            post.songAttachment!.title,
                            post.songAttachment!.channel
                          );
                          onShowToast?.(`กำลังเปิดฟังเพลง "${post.songAttachment!.title.slice(0, 20)}..."`, 'info');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>ฟังเพลง</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Action Bar (Like, Comment, Share) */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] dark:border-white/[0.06] text-xs">
                  <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                        post.hasLiked
                          ? 'text-rose-500 scale-105'
                          : isLight ? 'text-[#64748b] hover:text-rose-500' : 'text-[#94A3B8] hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.hasLiked ? 'fill-current text-rose-500' : ''}`} />
                      <span>{post.likesCount || 0}</span>
                    </button>

                    {/* Comment Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((prev) => ({
                          ...prev,
                          [post.id]: !prev[post.id],
                        }))
                      }
                      className={`flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
                        isLight ? 'text-[#64748b] hover:text-[#0075de]' : 'text-[#94A3B8] hover:text-[#00daf3]'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentsCount || (post.comments ? post.comments.length : 0)}</span>
                    </button>
                  </div>

                  {/* Share Link */}
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/@${post.authorUsername || post.authorId}`;
                      navigator.clipboard.writeText(shareUrl);
                      onShowToast?.('คัดลอกลิงก์โปรไฟล์ผู้โพสต์แล้ว!', 'info');
                    }}
                    className={`flex items-center gap-1 text-[11px] font-semibold transition-all cursor-pointer ${
                      isLight ? 'text-[#64748b] hover:text-[#0075de]' : 'text-[#94A3B8] hover:text-[#00daf3]'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>แชร์</span>
                  </button>
                </div>

                {/* Inline Comments Drawer */}
                {isCommentsOpen && (
                  <div className="mt-3.5 pt-3 border-t border-white/[0.06] dark:border-white/[0.06] space-y-3 animate-in fade-in duration-200">
                    {/* Comments list */}
                    {post.comments && post.comments.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {post.comments.map((cmt) => (
                          <div key={cmt.id} className="flex items-start gap-2.5 p-2 rounded-2xl bg-black/10 dark:bg-black/25">
                            <div
                              className="w-7 h-7 rounded-full overflow-hidden border shrink-0"
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
                    ) : (
                      <p className="text-[11px] text-[#64748b] dark:text-[#94A3B8] text-center py-2">
                        ยังไม่มีความคิดเห็น มาเป็นคนแรกที่คอมเมนต์เลย!
                      </p>
                    )}

                    {/* Comment Input Box */}
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
            );
          })}
        </div>
      )}
    </div>
  );
};
