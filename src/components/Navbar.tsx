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
    <header className="relative h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#e6e6e6] px-2.5 sm:px-4 flex items-center justify-between z-40 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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
            <div className="h-4 w-[1px] bg-[#e6e6e6] shrink-0 hidden xs:block" />

            <div className="flex items-center gap-1.5 bg-[#f6f5f4] border border-[#e6e6e6] px-2 py-1 rounded-md min-w-0">
              {isPrivate ? (
                <Lock className="w-3 h-3 text-[#dd5b00] shrink-0" />
              ) : (
                <Radio className="w-3 h-3 text-[#1aae39] animate-pulse shrink-0" />
              )}
              <span className="font-medium text-[11px] sm:text-xs text-[#31302e] truncate max-w-[75px] xs:max-w-[110px] sm:max-w-[160px]">
                {roomName || roomId}
              </span>
            </div>

            {/* Desktop Invite Button (hidden on mobile < md:, inside mobile 3-dots menu) */}
            <button
              onClick={handleCopyLink}
              title="คัดลอกลิงก์ชวนเพื่อน"
              className={`hidden md:flex px-2.5 py-1 rounded-md border text-xs font-medium transition-all items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                copied
                  ? 'bg-[#1aae39]/10 text-[#1aae39] border-[#1aae39]/30'
                  : 'bg-white hover:bg-[#f6f5f4] text-[#31302e] border-[#e6e6e6] hover:text-[#000000]'
              }`}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#1aae39]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#0075de]" />
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
            className="hidden md:flex px-2.5 py-1 rounded-md bg-white hover:bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6] hover:text-[#000000] text-xs font-medium transition-all cursor-pointer items-center gap-1.5 disabled:opacity-50 shrink-0 shadow-xs"
            title={currentView === 'home' ? 'รีเฟรชรายการห้อง' : 'รีเฟรชข้อมูลห้อง (Sync ใหม่)'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0075de] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'รีเฟรช...' : 'รีเฟรช'}</span>
          </button>
        )}

        {/* Desktop In-Room Controls */}
        {currentView === 'room' && (
          <>
            {/* Online Count Badge */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#f6f5f4] border border-[#e6e6e6] rounded-md text-xs text-[#31302e]"
              title={`มีคนอยู่ในห้อง ${onlineCount} คน`}
            >
              <Users className="w-3.5 h-3.5 text-[#2a9d99]" />
              <span className="font-semibold text-[#000000]">{onlineCount}</span>
            </div>

            {/* OLED Sleep Mode Button */}
            {onToggleOledSleep && (
              <button
                onClick={onToggleOledSleep}
                className="hidden md:flex px-2.5 py-1 rounded-md bg-white hover:bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6] text-xs font-medium transition-all cursor-pointer items-center gap-1.5 shrink-0 shadow-xs"
                title="โหมดพักหน้าจอประหยัดแบตเตอรี่ (หน้าจอดำสนิท ฟังเพลงไม่ตัด)"
              >
                <Moon className="w-3.5 h-3.5 text-[#615d59]" />
                <span>พักจอ</span>
              </button>
            )}

            {/* Room Owner / Admin Management Button */}
            {isAdminOrOwner && onOpenAdminPanel && (
              <button
                onClick={onOpenAdminPanel}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#d6b6f6]/25 hover:bg-[#d6b6f6]/40 text-[#391c57] border border-[#d6b6f6]/60 text-xs font-medium transition-colors cursor-pointer shadow-xs"
                title="จัดการห้อง"
              >
                {myRole === 'owner' ? (
                  <Crown className="w-3.5 h-3.5 text-[#dd5b00]" />
                ) : (
                  <Shield className="w-3.5 h-3.5 text-[#391c57]" />
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
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#dd5b00]/10 text-[#dd5b00] border border-[#dd5b00]/30 text-xs font-medium hover:bg-[#dd5b00]/20 transition-colors cursor-pointer shadow-xs"
            title="แดชบอร์ดเจ้าของเว็บ"
          >
            <Crown className="w-3.5 h-3.5 text-[#dd5b00]" />
            <span>แดชบอร์ด</span>
          </button>
        )}

        {/* Desktop Guest Sign In Button - Notion Blue Pill */}
        {!isMember && onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="hidden md:flex px-3.5 py-1.5 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white font-medium text-xs shadow-[0_1px_2px_rgba(0,117,222,0.2)] items-center gap-1.5 transition-all cursor-pointer shrink-0"
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
          className="flex items-center gap-1.5 sm:gap-2 p-1 pr-2 sm:pr-2.5 rounded-full bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] transition-colors group cursor-pointer shrink-0 shadow-xs"
        >
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden border shrink-0 relative"
            style={{ borderColor: currentUser.color || '#e6e6e6' }}
          >
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          </div>
          <span className="text-[11px] sm:text-xs font-medium text-[#31302e] group-hover:text-[#000000] max-w-[60px] xs:max-w-[85px] sm:max-w-[120px] truncate">
            {currentUser.name}
          </span>
          {currentUser.provider === 'google' && (
            <span className="w-2 h-2 rounded-full bg-[#dd5b00] shrink-0" title="Google Account" />
          )}
          {currentUser.provider === 'facebook' && (
            <span className="w-2 h-2 rounded-full bg-[#0075de] shrink-0" title="Facebook Account" />
          )}
        </button>

        {/* Desktop Quick Sign Out icon button */}
        {isMember && onLogout && (
          <button
            onClick={onLogout}
            title="ออกจากระบบ (Sign Out)"
            className="hidden md:flex p-1.5 sm:p-2 rounded-md text-[#615d59] hover:text-rose-600 hover:bg-rose-50 border border-[#e6e6e6] hover:border-rose-200 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

        {/* --- MOBILE ONLY 3-DOTS MENU BUTTON (md:hidden) --- */}
        <div className="relative md:hidden" ref={menuRef}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`px-2 py-1.5 rounded-md border transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs ${
              isMobileMenuOpen
                ? 'bg-[#0075de]/10 text-[#0075de] border-[#0075de]/40 ring-2 ring-[#0075de]/20'
                : 'bg-white hover:bg-[#f6f5f4] text-[#31302e] border-[#e6e6e6]'
            }`}
            aria-label="เมนูเพิ่มเติม (3 จุด)"
            title="เมนูเพิ่มเติม"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-[#0075de]" />
            ) : (
              <MoreHorizontal className="w-4 h-4 text-[#31302e]" />
            )}
          </button>

          {/* Mobile Dropdown Popover */}
          {isMobileMenuOpen && (
            <>
              {/* Invisible touch backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Floating Dropdown Card - Notion Style */}
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white border border-[#e6e6e6] shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-0.5">
                {/* Header in dropdown */}
                <div className="px-3 py-2 border-b border-[#e6e6e6] flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {currentView === 'room' ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-[#1aae39] animate-pulse shrink-0" />
                        <span className="text-xs font-semibold text-[#000000] truncate">
                          {roomName || roomId}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-[#31302e]">เมนูหลัก</span>
                    )}
                  </div>
                  {currentView === 'room' && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#2a9d99] bg-[#2a9d99]/10 px-2 py-0.5 rounded-full shrink-0">
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
                      className="w-full px-3 py-2 rounded-lg hover:bg-[#f6f5f4] text-left text-xs text-[#31302e] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Copy className="w-4 h-4 text-[#0075de]" />
                        <span>คัดลอกลิงก์ชวนเพื่อน</span>
                      </div>
                      {copied && <span className="text-[10px] text-[#1aae39] font-medium">คัดลอกแล้ว</span>}
                    </button>

                    {/* Refresh Room Sync */}
                    {onRefreshRoom && (
                      <button
                        onClick={() => {
                          onRefreshRoom();
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={isRefreshing}
                        className="w-full px-3 py-2 rounded-lg hover:bg-[#f6f5f4] text-left text-xs text-[#31302e] flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 text-[#0075de] ${isRefreshing ? 'animate-spin' : ''}`} />
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
                        className="w-full px-3 py-2 rounded-lg hover:bg-[#f6f5f4] text-left text-xs text-[#615d59] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Moon className="w-4 h-4 text-[#615d59]" />
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
                        className="w-full px-3 py-2 rounded-lg hover:bg-[#d6b6f6]/20 text-left text-xs text-[#391c57] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        {myRole === 'owner' ? (
                          <Crown className="w-4 h-4 text-[#dd5b00]" />
                        ) : (
                          <Shield className="w-4 h-4 text-[#391c57]" />
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
                    className="w-full px-3 py-2 rounded-lg hover:bg-[#dd5b00]/10 text-left text-xs text-[#dd5b00] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-[#dd5b00]" />
                    <span>แดชบอร์ดเจ้าของเว็บ</span>
                  </button>
                )}

                <div className="h-[1px] bg-[#e6e6e6] my-1" />

                {/* Profile / Account Settings */}
                <button
                  onClick={() => {
                    if (onOpenFullProfile) onOpenFullProfile();
                    else onOpenProfile();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg hover:bg-[#f6f5f4] text-left text-xs text-[#31302e] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#0075de]" />
                  <span>โปรไฟล์ของฉัน</span>
                </button>

                {/* Auth / Login for Guest - Notion Blue Pill */}
                {!isMember && onOpenAuth && (
                  <button
                    onClick={() => {
                      onOpenAuth();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-full bg-[#0075de] hover:bg-[#005bab] text-left text-xs text-white font-medium flex items-center gap-2.5 transition-all cursor-pointer shadow-xs mt-1"
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
                    className="w-full px-3 py-2 rounded-lg hover:bg-rose-50 text-left text-xs text-rose-600 flex items-center gap-2.5 transition-colors cursor-pointer"
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
