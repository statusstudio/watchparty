import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, Heart, Radio, ExternalLink, Sparkles } from 'lucide-react';
import { UserProfile } from '../types/index.js';
import { fetchProfile, toggleFollow } from '../services/supabase.js';

interface UserCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile | null;
  currentUser: UserProfile;
  onViewFullProfile: (user: UserProfile) => void;
  onOpenAuth?: () => void;
}

export const UserCardModal: React.FC<UserCardModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onViewFullProfile,
  onOpenAuth,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const displayUser = profile || targetUser;

  useEffect(() => {
    if (!isOpen || !targetUser) return;

    setProfile(targetUser);
    setIsFollowing(Boolean(targetUser.isFollowing));
    setFollowersCount(targetUser.followersCount || 0);

    fetchProfile(targetUser.id, currentUser.id).then((fresh) => {
      if (fresh) {
        setProfile(fresh);
        setIsFollowing(Boolean(fresh.isFollowing));
        setFollowersCount(fresh.followersCount || 0);
      }
    });
  }, [isOpen, targetUser, currentUser.id]);

  if (!isOpen || !displayUser) return null;

  const isSelf = displayUser.id === currentUser.id;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#e6e6e6] rounded-2xl w-full max-w-sm overflow-hidden shadow-notion-modal flex flex-col relative text-[#31302e] animate-scale-up">
        {/* Banner */}
        <div className="relative h-28 w-full overflow-hidden bg-[#f6f5f4]">
          <img
            src={
              displayUser.bannerUrl ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80'
            }
            alt="Banner"
            className="w-full h-full object-cover brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-[#31302e] shadow-xs border border-[#e6e6e6] backdrop-blur-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 pt-0 relative">
          {/* Avatar and Action Header */}
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div
              className="w-18 h-18 rounded-2xl overflow-hidden border-3 shadow-md bg-white shrink-0"
              style={{ borderColor: displayUser.color || '#0075de' }}
            >
              <img src={displayUser.avatar} alt={displayUser.name} className="w-full h-full object-cover" />
            </div>

            {!isSelf && (
              <button
                type="button"
                disabled={followLoading}
                onClick={handleToggleFollow}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60 ${
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

          {/* Name & Handle */}
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-[#000000] truncate">{displayUser.name}</h3>
              {displayUser.provider === 'google' && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-semibold">
                  Google
                </span>
              )}
              {displayUser.provider === 'facebook' && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-[#1877F2] border border-blue-200 text-[9px] font-semibold">
                  Facebook
                </span>
              )}
            </div>
            <p className="text-xs text-[#0075de] font-mono mt-0.5">
              @{displayUser.username || `user_${displayUser.id.slice(0, 5)}`}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-4 py-2 my-2.5 border-y border-[#e6e6e6] text-xs">
            <div>
              <span className="font-bold text-[#000000] mr-1">{followersCount}</span>
              <span className="text-[#615d59]">ผู้ติดตาม</span>
            </div>
            <div>
              <span className="font-bold text-[#000000] mr-1">{displayUser.followingCount || 0}</span>
              <span className="text-[#615d59]">กำลังติดตาม</span>
            </div>
          </div>

          {/* Bio snippet */}
          {displayUser.bio && (
            <p className="text-xs text-[#615d59] line-clamp-2 leading-relaxed mb-3">
              {displayUser.bio}
            </p>
          )}

          {/* Music Genre Tags */}
          {displayUser.favoriteGenres && displayUser.favoriteGenres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3.5">
              {displayUser.favoriteGenres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-0.5 rounded-full bg-[#f6f5f4] border border-[#e6e6e6] text-[10px] text-[#31302e] font-medium"
                >
                  #{genre}
                </span>
              ))}
              {displayUser.favoriteGenres.length > 3 && (
                <span className="text-[10px] text-[#a39e98] self-center">
                  +{displayUser.favoriteGenres.length - 3}
                </span>
              )}
            </div>
          )}

          {/* View Full Profile Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                const handle = displayUser.username || displayUser.name.toLowerCase().replace(/[^a-z0-9_]/g, '');
                window.location.href = `/@${handle}`;
              }}
              className="flex-1 py-2 rounded-full bg-[#0075de]/10 hover:bg-[#0075de]/20 text-[#0075de] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>ดูหน้าเพจ @{displayUser.username || 'user'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onViewFullProfile(displayUser);
              }}
              className="px-3 py-2 rounded-full bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] text-[#615d59] font-medium text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
              title="เปิดดูรายละเอียด"
            >
              <span>การ์ด</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
