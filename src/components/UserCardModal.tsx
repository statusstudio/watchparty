import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  Heart,
  Radio,
  ExternalLink,
  Sparkles,
  Crown,
  ShieldCheck,
  Music,
  Copy,
  Check,
  Headphones,
} from 'lucide-react';
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
  const [copiedLink, setCopiedLink] = useState(false);

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

  const isSelf = Boolean(
    currentUser &&
      (displayUser.id === currentUser.id ||
        (displayUser.username &&
          currentUser.username &&
          displayUser.username.toLowerCase() === currentUser.username.toLowerCase()) ||
        (displayUser.email &&
          currentUser.email &&
          displayUser.email.toLowerCase() === currentUser.email.toLowerCase()))
  );
  const userHandle = displayUser.username || `user_${displayUser.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`;

  const handleToggleFollow = async () => {
    if (isSelf) return;

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

  const handleCopyProfileLink = () => {
    const url = `${window.location.origin}/@${userHandle}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#e6e6e6] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col relative text-[#31302e] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Section */}
        <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950">
          <img
            src={
              displayUser.bannerUrl ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80'
            }
            alt="Banner"
            className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-sm active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-5 pb-5 pt-0 relative">
          {/* Avatar and Action Header */}
          <div className="flex items-end justify-between -mt-11 mb-3">
            {/* Fixed-size, elegantly styled Avatar container */}
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-white shrink-0 relative z-10 transition-transform hover:scale-105"
              style={{
                boxShadow: `0 8px 24px -4px ${(displayUser.color || '#0075de')}40`,
              }}
            >
              <img
                src={displayUser.avatar}
                alt={displayUser.name}
                className="w-full h-full object-cover aspect-square bg-[#f6f5f4]"
              />
            </div>

            {/* Follow / Action Button */}
            {!isSelf ? (
              <button
                type="button"
                disabled={followLoading}
                onClick={handleToggleFollow}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-60 active:scale-95 ${
                  isFollowing
                    ? 'bg-[#f6f5f4] hover:bg-rose-50 text-[#31302e] hover:text-rose-600 border border-[#e6e6e6]'
                    : 'bg-[#0075de] hover:bg-[#005bab] text-white hover:shadow-md'
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
              <span className="px-3 py-1 rounded-full bg-[#f6f5f4] text-[#615d59] border border-[#e6e6e6] text-[11px] font-semibold">
                👤 บัญชีของคุณ
              </span>
            )}
          </div>

          {/* Name & Role Badge */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-[#000000] tracking-tight truncate max-w-[220px]">
                {displayUser.name}
              </h3>

              {displayUser.isSuperAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span>Admin</span>
                </span>
              )}

              {displayUser.provider === 'google' && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-semibold">
                  Google
                </span>
              )}
              {displayUser.provider === 'facebook' && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-[#1877F2] border border-blue-200 text-[10px] font-semibold">
                  Facebook
                </span>
              )}
              {displayUser.provider === 'email' && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-semibold">
                  Email
                </span>
              )}
            </div>

            {/* Handle & Copy button */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={handleCopyProfileLink}
                title="คลิกเพื่อคัดลอกลิงก์โปรไฟล์"
                className="text-[#0075de] hover:text-[#005bab] font-mono hover:underline flex items-center gap-1 cursor-pointer group"
              >
                <span>@{userHandle}</span>
                {copiedLink ? (
                  <Check className="w-3 h-3 text-[#1aae39]" />
                ) : (
                  <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
              {copiedLink && (
                <span className="text-[10px] text-[#1aae39] font-medium animate-fade-in">คัดลอกแล้ว!</span>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 divide-x divide-[#e6e6e6] bg-[#f6f5f4] rounded-2xl py-2 px-3 my-3 text-center border border-[#e6e6e6]/60 shadow-2xs">
            <div>
              <p className="text-sm font-bold text-[#000000]">{followersCount}</p>
              <p className="text-[10px] text-[#615d59]">ผู้ติดตาม</p>
            </div>
            <div>
              <p className="text-sm font-bold text-[#000000]">{displayUser.followingCount || 0}</p>
              <p className="text-[10px] text-[#615d59]">กำลังติดตาม</p>
            </div>
            <div>
              <p className="text-sm font-bold text-[#0075de]">
                {displayUser.favoriteGenres ? displayUser.favoriteGenres.length : 0}
              </p>
              <p className="text-[10px] text-[#615d59]">แนวเพลงที่ชอบ</p>
            </div>
          </div>

          {/* Bio snippet */}
          {displayUser.bio ? (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-[#615d59] leading-relaxed mb-3">
              <p className="line-clamp-2 italic">“{displayUser.bio}”</p>
            </div>
          ) : (
            <div className="py-1 text-[11px] text-[#a39e98] italic mb-2">
              สมาชิกยังไม่ได้เขียนแนะนำตัว
            </div>
          )}

          {/* Music Genre Tags */}
          {displayUser.favoriteGenres && displayUser.favoriteGenres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3.5">
              {displayUser.favoriteGenres.slice(0, 4).map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-0.5 rounded-full bg-white border border-[#e6e6e6] text-[10px] text-[#31302e] font-medium shadow-2xs flex items-center gap-1"
                >
                  <Music className="w-2.5 h-2.5 text-[#0075de]" />
                  <span>#{genre}</span>
                </span>
              ))}
              {displayUser.favoriteGenres.length > 4 && (
                <span className="text-[10px] text-[#a39e98] self-center">
                  +{displayUser.favoriteGenres.length - 4}
                </span>
              )}
            </div>
          )}

          {/* View Full Profile & Card Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.href = `/@${userHandle}`;
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0075de] to-blue-600 hover:from-[#005bab] hover:to-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <span>ดูหน้าเพจ @{userHandle}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onViewFullProfile(displayUser);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] text-[#31302e] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98"
              title="เปิดดูการ์ดเพลงโปรดและประวัติ"
            >
              <Headphones className="w-3.5 h-3.5 text-[#0075de]" />
              <span>การ์ดเพลง</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCardModal;
