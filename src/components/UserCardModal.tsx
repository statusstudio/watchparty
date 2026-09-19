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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12141e] border border-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col relative animate-scale-up">
        {/* Banner */}
        <div className="relative h-28 w-full overflow-hidden bg-gradient-to-r from-purple-900/60 to-rose-900/40">
          <img
            src={
              displayUser.bannerUrl ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80'
            }
            alt="Banner"
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12141e] via-transparent to-black/30" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 pt-0 relative">
          {/* Avatar and Action Header */}
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div
              className="w-18 h-18 rounded-2xl overflow-hidden border-3 shadow-xl bg-[#171924] shrink-0"
              style={{ borderColor: displayUser.color || '#ec4899' }}
            >
              <img src={displayUser.avatar} alt={displayUser.name} className="w-full h-full object-cover" />
            </div>

            {!isSelf && (
              <button
                type="button"
                disabled={followLoading}
                onClick={handleToggleFollow}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-60 ${
                  isFollowing
                    ? 'bg-gray-800 hover:bg-rose-500/20 text-gray-200 hover:text-rose-400 border border-gray-700'
                    : 'bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-rose-500/20'
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

          {/* Name & Handle */}
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-white truncate">{displayUser.name}</h3>
              {displayUser.provider === 'google' && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-semibold">
                  Google
                </span>
              )}
              {displayUser.provider === 'facebook' && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-semibold">
                  Facebook
                </span>
              )}
            </div>
            <p className="text-xs text-cyan-400 font-mono mt-0.5">
              @{displayUser.username || `user_${displayUser.id.slice(0, 5)}`}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-4 py-2.5 my-3 border-y border-gray-800/80 text-xs">
            <div>
              <span className="font-bold text-white mr-1">{followersCount}</span>
              <span className="text-gray-400">ผู้ติดตาม</span>
            </div>
            <div>
              <span className="font-bold text-white mr-1">{displayUser.followingCount || 0}</span>
              <span className="text-gray-400">กำลังติดตาม</span>
            </div>
          </div>

          {/* Bio snippet */}
          {displayUser.bio && (
            <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed mb-3">
              {displayUser.bio}
            </p>
          )}

          {/* Music Genre Tags */}
          {displayUser.favoriteGenres && displayUser.favoriteGenres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {displayUser.favoriteGenres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-0.5 rounded-md bg-[#181a26] border border-gray-800 text-[10px] text-gray-300 font-medium"
                >
                  #{genre}
                </span>
              ))}
              {displayUser.favoriteGenres.length > 3 && (
                <span className="text-[10px] text-gray-500 self-center">
                  +{displayUser.favoriteGenres.length - 3}
                </span>
              )}
            </div>
          )}

          {/* View Full Profile Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewFullProfile(displayUser);
            }}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>ดูหน้าโปรไฟล์เต็ม</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
