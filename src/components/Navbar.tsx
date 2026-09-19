import React, { useState } from 'react';
import {
  Radio,
  Users,
  Copy,
  Check,
  Tv,
  Music2,
  Volume2,
  Home,
  Shield,
  Crown,
  Lock,
  Globe,
  LogIn,
  Mail,
  MessageSquare,
  LifeBuoy,
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
  onNavigateHome: () => void;
  onOpenProfile: () => void;
  onOpenPlaylist: () => void;
  onOpenSoundboard: () => void;
  onOpenAdminPanel?: () => void;
  onOpenAuth: () => void;
  onOpenSupport: () => void;
  onOpenSuperAdminDashboard: () => void;
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
  onNavigateHome,
  onOpenProfile,
  onOpenPlaylist,
  onOpenSoundboard,
  onOpenAdminPanel,
  onOpenAuth,
  onOpenSupport,
  onOpenSuperAdminDashboard,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  const isGoogleLoggedIn = currentUser.provider === 'google';
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
    <header className="h-14 sm:h-16 shrink-0 bg-[#151722]/95 backdrop-blur-md border-b border-gray-800/80 px-3 sm:px-6 flex items-center justify-between z-40">
      {/* Left: Brand & Navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Home Button */}
        <button
          onClick={onNavigateHome}
          title="กลับไปหน้าหลัก (Lobby)"
          className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
            currentView === 'home'
              ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
              : 'bg-gray-800/60 hover:bg-gray-800 text-gray-300 border-gray-700/60'
          }`}
        >
          <Home className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold hidden md:inline">หน้าแรก</span>
        </button>

        {/* Brand */}
        <div
          onClick={onNavigateHome}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform border border-white/10">
            <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1">
              <span>Vibe</span>
              <span className="text-pink-400">.</span>
            </h1>
          </div>
        </div>

        {/* If inside a Room, show Room Indicator & 1-Click Invite */}
        {currentView === 'room' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#0f0f13] border border-gray-800/90 px-2.5 py-1.5 rounded-xl">
              {isPrivate ? (
                <Lock className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              )}
              <span className="font-semibold text-xs text-white truncate max-w-[90px] sm:max-w-[160px]">
                {roomName || roomId}
              </span>
            </div>

            {/* Prominent 1-Click Invite Button */}
            <button
              onClick={handleCopyLink}
              title="คัดลอกลิงก์ชวนเพื่อนเข้าร่วมห้อง"
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border-violet-500/30 hover:border-violet-500/50'
              }`}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-violet-400" />
              )}
              <span className="hidden md:inline">{copied ? 'คัดลอกลิงก์แล้ว' : 'ชวนเพื่อน'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* If in Room: Soundboard, Playlist & Admin controls */}
        {currentView === 'room' && (
          <>
            {/* Admin Panel Button */}
            {isAdminOrOwner && onOpenAdminPanel && (
              <button
                onClick={onOpenAdminPanel}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                title="จัดการสมาชิกและตั้งค่าห้อง"
              >
                {myRole === 'owner' ? (
                  <Crown className="w-4 h-4 text-amber-400" />
                ) : (
                  <Shield className="w-4 h-4 text-purple-400" />
                )}
                <span className="hidden sm:inline">
                  {myRole === 'owner' ? 'จัดการห้อง (Owner)' : 'ผู้ดูแล (Admin)'}
                </span>
              </button>
            )}

            {/* Soundboard Button */}
            <button
              onClick={onOpenSoundboard}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors cursor-pointer"
              title="เปิด Soundboard ซาวด์เอฟเฟกต์"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Soundboard</span>
            </button>

            {/* Playlist Button */}
            <button
              onClick={onOpenPlaylist}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-medium transition-colors cursor-pointer"
            >
              <Music2 className="w-4 h-4 text-purple-400" />
              <span className="hidden md:inline">คิวเพลง</span>
            </button>

            {/* Online Count */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900/60 border border-gray-800 rounded-xl text-xs text-gray-300">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white">{onlineCount}</span>
            </div>
          </>
        )}

        {/* Support & Feedback Button */}
        <button
          onClick={onOpenSupport}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors cursor-pointer"
          title="แจ้งปัญหา หรือแนะนำฟีเจอร์กับเจ้าของเว็บ"
        >
          <LifeBuoy className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden lg:inline">แจ้งปัญหา/แนะนำ</span>
        </button>

        {/* Super Admin Dashboard Trigger */}
        <button
          onClick={onOpenSuperAdminDashboard}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            isSuperAdmin
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-amber-300 border border-gray-700/60'
          }`}
          title={isSuperAdmin ? 'เปิดแดชบอร์ดเจ้าของเว็บ (Super Admin)' : 'เข้าสู่ระบบเจ้าของเว็บ'}
        >
          <Crown className={`w-3.5 h-3.5 ${isSuperAdmin ? 'text-amber-400' : 'text-gray-400'}`} />
          <span className="hidden md:inline">
            {isSuperAdmin ? 'แดชบอร์ดเจ้าของเว็บ' : 'เจ้าของเว็บ'}
          </span>
        </button>

        {/* Member / Google Login Trigger */}
        {!isGoogleLoggedIn ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">เข้าสู่ระบบด้วย</span> Gmail
          </button>
        ) : null}

        {/* User Profile Avatar Trigger */}
        <button
          onClick={onOpenProfile}
          title="แก้ไขโปรไฟล์ของคุณ"
          className="flex items-center gap-2 p-1 pr-2 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 transition-colors group cursor-pointer"
        >
          <div
            className="w-7 h-7 rounded-full overflow-hidden border-2"
            style={{ borderColor: currentUser.color }}
          >
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-medium text-gray-200 group-hover:text-white max-w-[70px] sm:max-w-[110px] truncate">
            {currentUser.name}
          </span>
        </button>
      </div>
    </header>
  );
};
