import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Users,
  Copy,
  Check,
  Crown,
  Shield,
  Lock,
  RefreshCw,
  Moon,
  LogOut,
  MoreHorizontal,
  User,
  LogIn,
  X,
} from 'lucide-react';
import { PlengLogo } from './PlengLogo.js';
import { UserProfile, UserRole } from '../types/index.js';

interface NavbarProps {
  currentView: 'home' | 'room';
  roomId: string;
  roomName?: string;
  isPrivate?: boolean;
  onlineCount: number;
  currentUser: UserProfile;
  myRole: UserRole;
  isSuperAdmin?: boolean;
  isRefreshing?: boolean;
  onRefreshRoom: () => void;
  onToggleOledSleep: () => void;
  onNavigateHome: () => void;
  onOpenProfile: () => void;
  onOpenFullProfile?: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenAdminPanel: () => void;
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
  myRole,
  isSuperAdmin,
  isRefreshing,
  onRefreshRoom,
  onToggleOledSleep,
  onNavigateHome,
  onOpenProfile,
  onOpenFullProfile,
  onOpenAuth,
  onLogout,
  onOpenAdminPanel,
  onOpenSuperAdminDashboard,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';
  const isMember = currentUser.provider === 'google' || currentUser.provider === 'facebook';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    onShowToast('คัดลอกลิงก์ห้องแล้ว ส่งให้เพื่อนได้เลย! 📋', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="relative h-14 shrink-0 bg-[#12131c]/95 backdrop-blur-md border-b border-gray-800/80 px-2.5 sm:px-4 flex items-center justify-between z-40">
      {/* Left: Brand Logo & Room Info */}
      <div className="flex items-center gap-1.5 xs:gap-2.5 sm:gap-3 min-w-0">
        {/* Brand (Acts as Home button) */}
        <button
          onClick={onNavigateHome}
          className="cursor-pointer group shrink-0 focus:outline-none flex items-center"
          title="pleng.online - กลับหน้าหลัก"
        >
          <PlengLogo size="sm" animated={true} />
        </button>

        {/* If inside a Room: Room Badge & Desktop Invite */}
        {currentView === 'room' && (
          <>
            <div className="h-4 w-[1px] bg-gray-800 shrink-0 hidden xs:block" />

            <div className="flex items-center gap-1.5 bg-[#181a26] border border-gray-800/90 px-2 py-1 rounded-lg min-w-0">
              {isPrivate ? (
                <Lock className="w-3 h-3 text-purple-400 shrink-0" />
              ) : (
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
              )}
              <span className="font-medium text-[11px] sm:text-xs text-gray-200 truncate max-w-[75px] xs:max-w-[110px] sm:max-w-[160px]">
                {roomName || roomId}
              </span>
            </div>

            {/* Desktop Invite Button (hidden on mobile < md:, inside mobile 3-dots menu) */}
            <button
              onClick={handleCopyLink}
              title="คัดลอกลิงก์ชวนเพื่อน"
              className={`hidden md:flex px-2.5 py-1 rounded-lg border text-xs font-medium transition-all items-center gap-1.5 cursor-pointer shrink-0 ${
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
              <span>{copied ? 'คัดลอกแล้ว' : 'ชวนเพื่อน'}</span>
            </button>
          </>
        )}
      </div>

      {/* Right Controls: Responsive Layout */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* --- DESKTOP ONLY CONTROLS (hidden md:flex) --- */}
        {/* Refresh Button */}
        {onRefreshRoom && (
          <button
            onClick={onRefreshRoom}
            disabled={isRefreshing}
            className="hidden md:flex px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700/60 hover:text-white text-xs font-medium transition-all cursor-pointer items-center gap-1.5 disabled:opacity-50 shrink-0"
            title={currentView === 'home' ? 'รีเฟรชรายการห้อง' : 'รีเฟรชข้อมูลห้อง (Sync ใหม่)'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-pink-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'รีเฟรช...' : 'รีเฟรช'}</span>
          </button>
        )}

        {/* Desktop In-Room Controls */}
        {currentView === 'room' && (
          <>
            {/* Online Count Badge */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-gray-800 rounded-lg text-xs text-gray-300"
              title={`มีคนอยู่ในห้อง ${onlineCount} คน`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white">{onlineCount}</span>
            </div>

            {/* OLED Sleep Mode Button */}
            {onToggleOledSleep && (
              <button
                onClick={onToggleOledSleep}
                className="hidden md:flex px-2.5 py-1 rounded-lg bg-zinc-800/70 hover:bg-zinc-700 text-purple-300 border border-purple-500/30 text-xs font-medium transition-all cursor-pointer items-center gap-1.5 shrink-0"
                title="โหมดพักหน้าจอประหยัดแบตเตอรี่ (หน้าจอดำสนิท ฟังเพลงไม่ตัด)"
              >
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>พักจอ</span>
              </button>
            )}

            {/* Room Owner / Admin Management Button */}
            {isAdminOrOwner && onOpenAdminPanel && (
              <button
                onClick={onOpenAdminPanel}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-medium transition-colors cursor-pointer"
                title="จัดการห้อง"
              >
                {myRole === 'owner' ? (
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>จัดการห้อง</span>
              </button>
            )}
          </>
        )}

        {/* Super Admin Dashboard Trigger */}
        {isSuperAdmin && onOpenSuperAdminDashboard && (
          <button
            onClick={onOpenSuperAdminDashboard}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-medium hover:bg-amber-500/30 transition-colors cursor-pointer"
            title="แดชบอร์ดเจ้าของเว็บ"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>แดชบอร์ด</span>
          </button>
        )}

        {/* Desktop Guest Sign In Button */}
        {!isMember && onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="hidden md:flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-medium text-xs shadow-md shadow-rose-500/20 items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="เข้าสู่ระบบด้วย Google หรือ Facebook"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>เข้าสู่ระบบ</span>
          </button>
        )}

        {/* User Profile Pill (Visible on both desktop and mobile, with responsive width) */}
        <button
          onClick={onOpenFullProfile || onOpenProfile}
          title={
            isMember
              ? 'เปิดหน้าโปรไฟล์ส่วนตัวของคุณ'
              : 'แก้ไขโปรไฟล์ / บัญชีของคุณ'
          }
          className="flex items-center gap-1.5 sm:gap-2 p-1 pr-2 sm:pr-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-gray-800 hover:border-gray-700 transition-colors group cursor-pointer shrink-0"
        >
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden border-2 shrink-0 relative"
            style={{ borderColor: currentUser.color }}
          >
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          </div>
          <span className="text-[11px] sm:text-xs font-medium text-gray-200 group-hover:text-white max-w-[60px] xs:max-w-[85px] sm:max-w-[120px] truncate">
            {currentUser.name}
          </span>
          {currentUser.provider === 'google' && (
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Google Account" />
          )}
          {currentUser.provider === 'facebook' && (
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Facebook Account" />
          )}
        </button>

        {/* Desktop Quick Sign Out icon button */}
        {isMember && onLogout && (
          <button
            onClick={onLogout}
            title="ออกจากระบบ (Sign Out)"
            className="hidden md:flex p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border border-gray-800 hover:border-rose-500/30 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

        {/* --- MOBILE ONLY 3-DOTS MENU BUTTON (md:hidden) --- */}
        <div className="relative md:hidden" ref={menuRef}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`px-2 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1 ${
              isMobileMenuOpen
                ? 'bg-purple-600/40 text-purple-200 border-purple-500/60 shadow-lg shadow-purple-500/25 ring-2 ring-purple-500/30'
                : 'bg-zinc-800/90 hover:bg-zinc-700 text-purple-300 border border-purple-500/40 hover:border-purple-400'
            }`}
            aria-label="เมนูเพิ่มเติม (3 จุด)"
            title="เมนูเพิ่มเติม"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-purple-300" />
            ) : (
              <MoreHorizontal className="w-4 h-4 text-purple-300" />
            )}
          </button>

          {/* Mobile Dropdown Popover */}
          {isMobileMenuOpen && (
            <>
              {/* Invisible touch backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Floating Dropdown Card */}
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#181a26] border border-gray-700/80 shadow-2xl shadow-black/80 z-50 p-2 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1">
                {/* Header in dropdown */}
                <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {currentView === 'room' ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="text-xs font-semibold text-gray-200 truncate">
                          {roomName || roomId}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-gray-300">เมนูหลัก</span>
                    )}
                  </div>
                  {currentView === 'room' && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full shrink-0">
                      <Users className="w-3 h-3" />
                      <span>{onlineCount} คน</span>
                    </div>
                  )}
                </div>

                {/* Mobile Actions in Room */}
                {currentView === 'room' && (
                  <>
                    {/* Invite Link */}
                    <button
                      onClick={() => {
                        handleCopyLink();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-left text-xs text-gray-200 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Copy className="w-4 h-4 text-purple-400" />
                        <span>คัดลอกลิงก์ชวนเพื่อน</span>
                      </div>
                      {copied && <span className="text-[10px] text-emerald-400 font-medium">คัดลอกแล้ว</span>}
                    </button>

                    {/* Refresh Room Sync */}
                    {onRefreshRoom && (
                      <button
                        onClick={() => {
                          onRefreshRoom();
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={isRefreshing}
                        className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-left text-xs text-gray-200 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 text-pink-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>{isRefreshing ? 'กำลังรีเฟรชข้อมูล...' : 'รีเฟรชข้อมูลห้อง (Sync ใหม่)'}</span>
                      </button>
                    )}

                    {/* OLED Sleep */}
                    {onToggleOledSleep && (
                      <button
                        onClick={() => {
                          onToggleOledSleep();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-left text-xs text-purple-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Moon className="w-4 h-4 text-purple-400" />
                        <span>โหมดพักหน้าจอ (ประหยัดแบตเตอรี่)</span>
                      </button>
                    )}

                    {/* Admin Panel */}
                    {isAdminOrOwner && onOpenAdminPanel && (
                      <button
                        onClick={() => {
                          onOpenAdminPanel();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl hover:bg-purple-600/20 text-left text-xs text-purple-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        {myRole === 'owner' ? (
                          <Crown className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Shield className="w-4 h-4 text-purple-400" />
                        )}
                        <span>จัดการห้อง (สิทธิ์ผู้ดูแล)</span>
                      </button>
                    )}
                  </>
                )}

                {/* Super Admin Dashboard in Mobile */}
                {isSuperAdmin && onOpenSuperAdminDashboard && (
                  <button
                    onClick={() => {
                      onOpenSuperAdminDashboard();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-amber-500/20 text-left text-xs text-amber-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>แดชบอร์ดเจ้าของเว็บ</span>
                  </button>
                )}

                <div className="h-[1px] bg-gray-800 my-1" />

                {/* Profile / Account Settings */}
                <button
                  onClick={() => {
                    if (onOpenFullProfile) onOpenFullProfile();
                    else onOpenProfile();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-left text-xs text-gray-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>โปรไฟล์ของฉัน</span>
                </button>

                {/* Auth / Login for Guest */}
                {!isMember && onOpenAuth && (
                  <button
                    onClick={() => {
                      onOpenAuth();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-left text-xs text-white font-medium flex items-center gap-2.5 transition-all cursor-pointer shadow-md"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบ (Google / Facebook)</span>
                  </button>
                )}

                {/* Sign Out for Logged in user */}
                {isMember && onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-rose-500/15 text-left text-xs text-rose-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
