import React, { useState } from 'react';
import {
  Radio,
  Users,
  Copy,
  Check,
  Tv,
  Crown,
  Shield,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types/index.js';

interface NavbarProps {
  currentView: 'home' | 'room';
  roomId: string;
  roomName?: string;
  isPrivate?: boolean;
  onlineCount: number;
  currentUser: UserProfile;
  myRole?: UserRole;
  isSuperAdmin?: boolean;
  isRefreshing?: boolean;
  onRefreshRoom?: () => void;
  onNavigateHome: () => void;
  onOpenProfile: () => void;
  onOpenPlaylist?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenSuperAdminDashboard?: () => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  roomId,
  roomName,
  isPrivate,
  onlineCount,
  currentUser,
  myRole = 'member',
  isSuperAdmin = false,
  isRefreshing = false,
  onRefreshRoom,
  onNavigateHome,
  onOpenProfile,
  onOpenAdminPanel,
  onOpenSuperAdminDashboard,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${window.location.pathname}#room=${roomId}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      onShowToast('คัดลอกลิงก์ห้องแล้ว! ส่งให้เพื่อนเข้ามาร่วมดูได้เลย 🎉', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="h-14 shrink-0 bg-[#12131c]/90 backdrop-blur-md border-b border-gray-800/80 px-3 sm:px-5 flex items-center justify-between z-40">
      {/* Left: Brand Logo & Room Info */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        {/* Brand (Acts as Home button) */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 cursor-pointer group shrink-0 focus:outline-none"
          title="Vibe - กลับหน้าหลัก"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform border border-white/10">
            <Tv className="w-4 h-4 text-white" />
          </div>
          <span className="text-base sm:text-lg font-black text-white tracking-tight flex items-center">
            Vibe<span className="text-pink-400">.</span>
          </span>
        </button>

        {/* If inside a Room: Room Badge & 1-Click Invite */}
        {currentView === 'room' && (
          <>
            <div className="h-4 w-[1px] bg-gray-800 shrink-0 hidden xs:block" />

            <div className="flex items-center gap-1.5 bg-[#181a26] border border-gray-800 px-2.5 py-1 rounded-lg min-w-0">
              {isPrivate ? (
                <Lock className="w-3 h-3 text-purple-400 shrink-0" />
              ) : (
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
              )}
              <span className="font-medium text-xs text-gray-200 truncate max-w-[90px] sm:max-w-[160px]">
                {roomName || roomId}
              </span>
            </div>

            {/* 1-Click Invite Button */}
            <button
              onClick={handleCopyLink}
              title="คัดลอกลิงก์ชวนเพื่อน"
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border-gray-700/60 hover:text-white'
              }`}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-purple-400" />
              )}
              <span className="hidden sm:inline">{copied ? 'คัดลอกแล้ว' : 'ชวนเพื่อน'}</span>
            </button>
          </>
        )}
      </div>

      {/* Right: Clean & Uncluttered Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* In-Room Controls */}
        {currentView === 'room' && (
          <>
            {/* Online Count Badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-gray-800 rounded-lg text-xs text-gray-300"
              title={`มีคนอยู่ในห้อง ${onlineCount} คน`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white">{onlineCount}</span>
            </div>

            {/* Refresh Room Button */}
            {onRefreshRoom && (
              <button
                onClick={onRefreshRoom}
                disabled={isRefreshing}
                className="px-2 sm:px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700/60 hover:text-white text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                title="รีเฟรชข้อมูลห้อง (Sync ใหม่)"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-pink-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'รีเฟรช...' : 'รีเฟรช'}</span>
              </button>
            )}

            {/* Room Owner / Admin Management Button (Only visible to Room Owner/Admin) */}
            {isAdminOrOwner && onOpenAdminPanel && (
              <button
                onClick={onOpenAdminPanel}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-medium transition-colors cursor-pointer"
                title="จัดการห้อง"
              >
                {myRole === 'owner' ? (
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span className="hidden md:inline">จัดการห้อง</span>
              </button>
            )}
          </>
        )}

        {/* Super Admin Dashboard Trigger (ONLY displayed if the user is already authenticated as superAdmin) */}
        {isSuperAdmin && onOpenSuperAdminDashboard && (
          <button
            onClick={onOpenSuperAdminDashboard}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-medium hover:bg-amber-500/30 transition-colors cursor-pointer"
            title="แดชบอร์ดเจ้าของเว็บ"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">แดชบอร์ด</span>
          </button>
        )}

        {/* User Profile Pill (Click to edit avatar, name, and access settings/support) */}
        <button
          onClick={onOpenProfile}
          title="แก้ไขโปรไฟล์ / บัญชีของคุณ"
          className="flex items-center gap-2 p-1 pr-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-gray-800 hover:border-gray-700 transition-colors group cursor-pointer"
        >
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden border-2 shrink-0"
            style={{ borderColor: currentUser.color }}
          >
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-medium text-gray-200 group-hover:text-white max-w-[80px] sm:max-w-[120px] truncate">
            {currentUser.name}
          </span>
        </button>
      </div>
    </header>
  );
};
