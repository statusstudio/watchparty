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
  HelpCircle,
  Star,
  ExternalLink,
  Minimize2,
  Gamepad2,
  Megaphone,
  Edit3,
  Trash2,
  Share2,
  Download,
  Smartphone,
  Tv,
  Trophy,
} from 'lucide-react';
import { PlengLogo } from './PlengLogo.js';
import { UserProfile, UserRole } from '../types/index.js';

interface NavbarProps {
  currentView: 'home' | 'room';
  roomId: string;
  roomName?: string;
  roomAnnouncement?: string;
  onSetAnnouncement?: (announcement: string) => void;
  isPrivate?: boolean;
  onlineCount: number;
  currentUser: UserProfile;
  myRole: UserRole;
  isSuperAdmin?: boolean;
  isRefreshing?: boolean;
  isFavoriteRoom?: boolean;
  isGameActive?: boolean;
  onToggleGame?: () => void;
  onToggleFavoriteRoom?: () => void;
  onRefreshRoom: () => void;
  onToggleOledSleep: () => void;
  onOpenShareCard?: () => void;
  onInstallApp?: () => void;
  onOpenLiveTV?: () => void;
  onMinimizeRoom?: () => void;
  onLeaveRoom?: () => void;
  onNavigateHome: () => void;
  onOpenProfile: () => void;
  onOpenFullProfile?: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenAdminPanel: () => void;
  onOpenSuperAdminDashboard: () => void;
  onOpenAdminLogin?: () => void;
  onOpenSupport?: () => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  roomId,
  roomName,
  roomAnnouncement,
  onSetAnnouncement,
  isPrivate,
  onlineCount,
  currentUser,
  myRole,
  isSuperAdmin,
  isRefreshing,
  isFavoriteRoom,
  isGameActive,
  onToggleGame,
  onToggleFavoriteRoom,
  onRefreshRoom,
  onToggleOledSleep,
  onOpenShareCard,
  onInstallApp,
  onOpenLiveTV,
  onMinimizeRoom,
  onLeaveRoom,
  onNavigateHome,
  onOpenProfile,
  onOpenFullProfile,
  onOpenAuth,
  onLogout,
  onOpenAdminPanel,
  onOpenSuperAdminDashboard,
  onOpenAdminLogin,
  onOpenSupport,
  onShowToast,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [copied, setCopied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';
  const isMember = Boolean(
    (currentUser.provider !== 'guest' && currentUser.email) ||
    currentUser.provider === 'email' ||
    currentUser.provider === 'google' ||
    currentUser.provider === 'facebook'
  );

  // Stealth Admin Triggers: 5 rapid clicks on logo
  const logoClickCountRef = useRef<number>(0);
  const logoClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    logoClickCountRef.current += 1;
    if (logoClickTimeoutRef.current) {
      clearTimeout(logoClickTimeoutRef.current);
    }

    if (logoClickCountRef.current >= 5) {
      logoClickCountRef.current = 0;
      if (onOpenAdminLogin) {
        onShowToast('🔑 กำลังเปิดหน้าต่างสำหรับเจ้าของระบบ...', 'info');
        onOpenAdminLogin();
      }
      return;
    }

    logoClickTimeoutRef.current = setTimeout(() => {
      if (logoClickCountRef.current === 1) {
        if (currentView === 'room' && onMinimizeRoom) {
          onMinimizeRoom();
        } else {
          onNavigateHome();
        }
      }
      logoClickCountRef.current = 0;
    }, 350);
  };

  // Stealth Keyboard Shortcut: Ctrl + Shift + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (onOpenAdminLogin) {
          onShowToast('🔑 คีย์ลัดเจ้าของระบบ (Admin Portal)', 'info');
          onOpenAdminLogin();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenAdminLogin, onShowToast]);

  const handleCopyLink = () => {
    const cleanUrl = `${window.location.origin}/#${roomId}`;
    navigator.clipboard.writeText(cleanUrl);
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
    <header className="sticky top-0 h-14 shrink-0 bg-white/95 dark:bg-[#111319]/90 backdrop-blur-md border-b border-[#e6e6e6] dark:border-white/[0.06] text-[#31302e] dark:text-[#e2e2ea] px-2.5 sm:px-4 flex items-center justify-between z-40 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors duration-300">
      {/* Left: Brand Logo & Room Info */}
      <div className="flex items-center gap-1.5 xs:gap-2.5 sm:gap-3 min-w-0">
        {/* Brand (Acts as Home button & Stealth Admin Easter Egg on 5 clicks) */}
        <button
          onClick={handleLogoClick}
          className="cursor-pointer group shrink-0 focus:outline-none flex items-center select-none"
          title={currentView === 'room' ? 'ย่อห้องปาร์ตี้ไว้มุมล่างซ้าย (ไปหน้าหลัก)' : 'pleng.online - หน้าหลัก'}
        >
          <PlengLogo size="sm" animated={true} />
        </button>

        {/* If inside a Room: Room Badge & Desktop Invite */}
        {currentView === 'room' && (
          <>
            <div className="h-4 w-[1px] bg-[#e6e6e6] shrink-0 hidden xs:block" />

            <div className="flex items-center gap-1.5 bg-[#f6f5f4] border border-[#e6e6e6] px-2 py-1 rounded-md min-w-0 shrink-0">
              {isPrivate ? (
                <Lock className="w-3 h-3 text-[#dd5b00] shrink-0" />
              ) : (
                <Radio className="w-3 h-3 text-[#1aae39] animate-pulse shrink-0" />
              )}
              <span className="font-medium text-[11px] sm:text-xs text-[#31302e] truncate max-w-[75px] xs:max-w-[110px] sm:max-w-[160px]">
                {roomName || roomId}
              </span>
            </div>

            {/* Room Announcement pill/button right next to room name */}
            {roomAnnouncement ? (
              <button
                type="button"
                onClick={() => {
                  setAnnouncementDraft(roomAnnouncement);
                  setIsEditingAnnouncement(false);
                  setIsAnnouncementModalOpen(true);
                }}
                title={`📢 ประกาศประจำห้อง: ${roomAnnouncement} (คลิกเพื่ออ่านทั้งหมด)`}
                className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 border border-amber-500/30 text-amber-900 px-2 py-1 rounded-md transition-all cursor-pointer min-w-0 max-w-[90px] xs:max-w-[140px] sm:max-w-[220px] md:max-w-[320px] shadow-xs group shrink"
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] sm:text-xs font-medium truncate text-amber-950">
                  {roomAnnouncement}
                </span>
              </button>
            ) : (
              isAdminOrOwner && onSetAnnouncement && (
                <button
                  type="button"
                  onClick={() => {
                    setAnnouncementDraft('');
                    setIsEditingAnnouncement(true);
                    setIsAnnouncementModalOpen(true);
                  }}
                  title="ตั้งประกาศประจำห้อง"
                  className="hidden xs:flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300/70 px-2 py-1 rounded-md transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <Megaphone className="w-3 h-3 text-amber-600" />
                  <span className="hidden sm:inline">ตั้งประกาศ</span>
                </button>
              )
            )}

            {/* Favorite / Follow Room Star Button */}
            {onToggleFavoriteRoom && (
              <button
                type="button"
                onClick={onToggleFavoriteRoom}
                title={isFavoriteRoom ? 'เลิกติดตามห้องนี้' : 'บันทึกเป็นห้องโปรด ⭐'}
                className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer shrink-0 shadow-xs flex items-center justify-center ${
                  isFavoriteRoom
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    : 'bg-white hover:bg-[#f6f5f4] text-[#a39e98] border-[#e6e6e6]'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isFavoriteRoom ? 'fill-current text-amber-500' : ''}`} />
              </button>
            )}

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

      {/* Right Controls: Streamlined & Clean Minimalist Layout */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Core In-Room Status: Online Count, Invite & Live TV */}
        {currentView === 'room' && (
          <>
            {/* Online Count Badge */}
            <div
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-[#f6f5f4] border border-[#e6e6e6] rounded-full text-xs text-[#31302e] shadow-xs"
              title={`มีคนอยู่ในห้อง ${onlineCount} คน`}
            >
              <Users className="w-3.5 h-3.5 text-[#2a9d99]" />
              <span className="font-semibold text-[#000000]">{onlineCount}</span>
            </div>

            {/* Desktop / Tablet Invite Button */}
            <button
              onClick={handleCopyLink}
              title="คัดลอกลิงก์ชวนเพื่อน"
              className={`hidden sm:flex px-2.5 py-1 rounded-full border text-xs font-medium transition-all items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
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

            {/* Live TV Button */}
            {onOpenLiveTV && (
              <button
                type="button"
                onClick={onOpenLiveTV}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
                title="ดูทีวีดิจิทัล & ช่องสดออนไลน์พร้อมกัน (Live TV 623 ช่อง)"
              >
                <Tv className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden xs:inline">ดูทีวีสด 📺</span>
              </button>
            )}
          </>
        )}

        {/* Guest Sign In Button (When not logged in) */}
        {!isMember && onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="flex px-3 py-1 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white font-medium text-xs shadow-xs items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="เข้าสู่ระบบสมาชิก"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">เข้าสู่ระบบ</span>
          </button>
        )}

        {/* Theme Switcher Toggle (โหมดมืด / โหมดสว่าง) */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 text-xs font-semibold select-none shadow-xs shrink-0 cursor-pointer ${
              theme === 'light'
                ? 'bg-white border-[#dae2fd] text-[#131b2e] hover:bg-[#eaedff]'
                : 'bg-[#191b22] border-white/10 text-[#e2e2ea] hover:bg-[#282a30]'
            }`}
            title={theme === 'light' ? 'สลับเป็นโหมดมืด (Dark Mode)' : 'สลับเป็นโหมดสว่าง (Light Mode)'}
          >
            <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-transform duration-300 ${
              theme === 'light' ? 'bg-[#eef0ff]' : 'bg-[#282a30]'
            }`}>
              {theme === 'light' ? (
                <span className="material-symbols-outlined text-[14px] text-[#006194]">light_mode</span>
              ) : (
                <span className="material-symbols-outlined text-[14px] text-[#ffb955]">dark_mode</span>
              )}
            </div>
            <span className="font-medium text-[11px] hidden sm:inline">
              {theme === 'light' ? 'โหมดสว่าง' : 'โหมดมืด'}
            </span>
          </button>
        )}

        {/* User Profile Pill */}
        <button
          onClick={onOpenFullProfile || onOpenProfile}
          title={isMember ? 'เปิดหน้าโปรไฟล์ส่วนตัวของคุณ' : 'แก้ไขโปรไฟล์ / บัญชีของคุณ'}
          className="flex items-center gap-1.5 sm:gap-2 p-1 pr-2 sm:pr-2.5 rounded-full bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] transition-colors group cursor-pointer shrink-0 shadow-xs"
        >
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden border shrink-0 relative"
            style={{ borderColor: currentUser.color || '#e6e6e6' }}
          >
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          </div>
          <span className="text-[11px] sm:text-xs font-medium text-[#31302e] group-hover:text-[#000000] max-w-[60px] xs:max-w-[85px] sm:max-w-[110px] truncate">
            {currentUser.name}
          </span>
          {currentUser.provider === 'email' && (
            <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0" title="สมาชิก (Email)" />
          )}
          {currentUser.provider === 'google' && (
            <span className="w-2 h-2 rounded-full bg-[#dd5b00] shrink-0" title="Google Account" />
          )}
          {currentUser.provider === 'facebook' && (
            <span className="w-2 h-2 rounded-full bg-[#0075de] shrink-0" title="Facebook Account" />
          )}
        </button>

        {/* Unified Tools & Options Dropdown Menu Button (Universal for Desktop, Tablet & Mobile) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`px-2 py-1.5 rounded-full border transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs ${
              isMobileMenuOpen
                ? 'bg-[#0075de]/10 text-[#0075de] border-[#0075de]/40 ring-2 ring-[#0075de]/20'
                : 'bg-white hover:bg-[#f6f5f4] text-[#31302e] border-[#e6e6e6]'
            }`}
            aria-label="เมนูเครื่องมือ"
            title="เครื่องมือและเมนูเพิ่มเติม"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-[#0075de]" />
            ) : (
              <MoreHorizontal className="w-4 h-4 text-[#31302e]" />
            )}
          </button>

          {/* Clean Dropdown Popover */}
          {isMobileMenuOpen && (
            <>
              {/* Invisible backdrop to dismiss on outside click */}
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Floating Dropdown Card */}
              <div className="absolute right-0 top-full mt-2 w-68 sm:w-72 rounded-2xl bg-white border border-[#e6e6e6] shadow-[0_16px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] z-50 p-2 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1 text-[#31302e] max-h-[85vh] overflow-y-auto">
                {/* Dropdown Header */}
                <div className="px-3 py-2 border-b border-[#f0efed] flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {currentView === 'room' ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-[#1aae39] animate-pulse shrink-0" />
                        <span className="text-xs font-bold text-[#000000] truncate">
                          {roomName || roomId}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-[#000000]">เมนูและการตั้งค่า</span>
                    )}
                  </div>
                  {currentView === 'room' && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#2a9d99] bg-[#2a9d99]/10 px-2 py-0.5 rounded-full shrink-0">
                      <Users className="w-3 h-3" />
                      <span>{onlineCount} คน</span>
                    </div>
                  )}
                </div>

                {/* Section 1: In-Room Tools & Features */}
                {currentView === 'room' && (
                  <div className="py-1 flex flex-col gap-0.5">
                    {/* Invite Link */}
                    <button
                      onClick={() => {
                        handleCopyLink();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl hover:bg-[#f6f5f4] text-left text-xs text-[#31302e] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Copy className="w-4 h-4 text-[#0075de]" />
                        <span>คัดลอกลิงก์ชวนเพื่อน</span>
                      </div>
                      {copied && <span className="text-[10px] text-[#1aae39] font-medium">คัดลอกแล้ว</span>}
                    </button>

                    {/* Room Announcement */}
                    {roomAnnouncement ? (
                      <button
                        onClick={() => {
                          setAnnouncementDraft(roomAnnouncement);
                          setIsEditingAnnouncement(false);
                          setIsAnnouncementModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-amber-50 text-left text-xs text-amber-950 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="font-medium">ประกาศประจำห้อง</span>
                        </div>
                        <span className="text-[10px] text-amber-800 bg-amber-100 border border-amber-300/60 px-1.5 py-0.5 rounded-md font-medium truncate max-w-[80px]">
                          {roomAnnouncement}
                        </span>
                      </button>
                    ) : (
                      isAdminOrOwner && onSetAnnouncement && (
                        <button
                          onClick={() => {
                            setAnnouncementDraft('');
                            setIsEditingAnnouncement(true);
                            setIsAnnouncementModalOpen(true);
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full px-2.5 py-2 rounded-xl hover:bg-amber-50 text-left text-xs text-amber-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>ตั้งประกาศประจำห้อง</span>
                        </button>
                      )
                    )}

                    {/* Live TV in Menu */}
                    {onOpenLiveTV && (
                      <button
                        onClick={() => {
                          onOpenLiveTV();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-rose-50 text-left text-xs text-rose-800 font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Tv className="w-4 h-4 text-rose-600" />
                        <span>ดูทีวีสด & ดิจิทัล (623 ช่อง) 📺</span>
                      </button>
                    )}

                    {/* Install App APK */}
                    {onInstallApp && (
                      <button
                        onClick={() => {
                          onInstallApp();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-emerald-50 text-left text-xs text-emerald-800 font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span>ดาวน์โหลดแอป Android (.APK)</span>
                      </button>
                    )}

                    {/* OLED Sleep */}
                    {onToggleOledSleep && (
                      <button
                        onClick={() => {
                          onToggleOledSleep();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-[#f6f5f4] text-left text-xs text-[#615d59] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Moon className="w-4 h-4 text-[#615d59]" />
                        <span>โหมดพักหน้าจอ (ประหยัดแบตเตอรี่)</span>
                      </button>
                    )}

                    {/* Share Card Modal */}
                    {onOpenShareCard && (
                      <button
                        onClick={() => {
                          onOpenShareCard();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-purple-50 text-left text-xs text-purple-700 font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 text-purple-600" />
                        <span>สร้างการ์ดแชร์ห้อง (Story & QR)</span>
                      </button>
                    )}

                    {/* Refresh Room Sync */}
                    {onRefreshRoom && (
                      <button
                        onClick={() => {
                          onRefreshRoom();
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={isRefreshing}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-[#f6f5f4] text-left text-xs text-[#31302e] flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 text-[#0075de] ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>{isRefreshing ? 'กำลังรีเฟรชข้อมูล...' : 'รีเฟรชข้อมูลห้อง (Sync ใหม่)'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Section 2: Room Admin & Fun Games */}
                {currentView === 'room' && (isAdminOrOwner || isSuperAdmin) && (
                  <div className="border-t border-[#f0efed] pt-1 mt-1 flex flex-col gap-0.5">
                    {/* Admin Panel */}
                    {isAdminOrOwner && onOpenAdminPanel && (
                      <button
                        onClick={() => {
                          onOpenAdminPanel();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-[#d6b6f6]/20 text-left text-xs text-[#391c57] font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        {myRole === 'owner' ? (
                          <Crown className="w-4 h-4 text-[#dd5b00]" />
                        ) : (
                          <Shield className="w-4 h-4 text-[#391c57]" />
                        )}
                        <span>จัดการห้อง (สิทธิ์ผู้ดูแล)</span>
                      </button>
                    )}

                    {/* 2D Draw and Guess Game */}
                    {onToggleGame && (
                      <button
                        onClick={() => {
                          onToggleGame();
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                          isGameActive
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <Gamepad2 className="w-4 h-4" />
                        <span>{isGameActive ? 'ยุติเกมวาดรูปทายคำ' : 'เริ่มเกมวาดรูปทายคำ (Game Mode)'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Section 3: System & Profile Actions */}
                <div className="border-t border-[#f0efed] pt-1 mt-1 flex flex-col gap-0.5">
                  {/* Super Admin Dashboard (Super Admin only) */}
                  {isSuperAdmin && onOpenSuperAdminDashboard && (
                    <button
                      onClick={() => {
                        onOpenSuperAdminDashboard();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl hover:bg-[#dd5b00]/10 text-left text-xs text-[#dd5b00] font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-[#dd5b00]" />
                      <span>ระบบหลังบ้าน (Backoffice)</span>
                    </button>
                  )}

                  {/* Support / Feedback */}
                  {onOpenSupport && (
                    <button
                      onClick={() => {
                        onOpenSupport();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl hover:bg-[#f6f5f4] text-left text-xs text-[#615d59] hover:text-[#000000] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-[#0075de]" />
                      <span>แจ้งปัญหา / ส่งข้อเสนอแนะ</span>
                    </button>
                  )}

                  {/* Minimize Room */}
                  {currentView === 'room' && onMinimizeRoom && (
                    <button
                      onClick={() => {
                        onMinimizeRoom();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl hover:bg-[#f6f5f4] text-left text-xs text-[#0075de] font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Minimize2 className="w-4 h-4 text-[#0075de]" />
                      <span>ย่อห้องไว้มุมจอ (ไปหน้าหลัก)</span>
                    </button>
                  )}

                  {/* Profile / Account */}
                  <button
                    onClick={() => {
                      if (onOpenFullProfile) onOpenFullProfile();
                      else onOpenProfile();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl hover:bg-[#f6f5f4] text-left text-xs text-[#31302e] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#0075de]" />
                    <span>โปรไฟล์ของฉัน</span>
                  </button>

                  {isMember && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        const handle = currentUser.username || currentUser.name.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        window.location.href = `/@${handle}`;
                      }}
                      className="w-full px-2.5 py-2 rounded-xl hover:bg-[#0075de]/10 text-left text-xs text-[#0075de] font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-[#0075de]" />
                      <span>ดูหน้าเพจของฉัน (@{currentUser.username || 'user'})</span>
                    </button>
                  )}

                  {/* Leave Room */}
                  {currentView === 'room' && onLeaveRoom && (
                    <button
                      onClick={() => {
                        onLeaveRoom();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl hover:bg-rose-50 text-left text-xs text-rose-600 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>ออกจากห้องปาร์ตี้</span>
                    </button>
                  )}

                  {/* Sign Out for Logged in user */}
                  {isMember && onLogout && (
                    <button
                      onClick={() => {
                        onLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl hover:bg-rose-50 text-left text-xs text-rose-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ออกจากระบบ (Sign Out)</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Room Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-[#31302e]">
          <div className="bg-white border border-[#e6e6e6] rounded-2xl w-full max-w-md p-4 sm:p-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#f0efed]">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 border border-amber-500/20 shrink-0">
                  <Megaphone className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#000000] truncate">
                    {isEditingAnnouncement
                      ? (roomAnnouncement ? 'แก้ไขประกาศประจำห้อง' : 'ตั้งประกาศประจำห้อง')
                      : 'ประกาศประจำห้อง'}
                  </h3>
                  <p className="text-[11px] text-[#615d59] truncate">
                    {roomName || roomId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAnnouncementModalOpen(false);
                  setIsEditingAnnouncement(false);
                }}
                className="text-[#a39e98] hover:text-[#000000] p-1.5 rounded-lg hover:bg-[#f6f5f4] cursor-pointer shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isEditingAnnouncement ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (onSetAnnouncement) {
                    onSetAnnouncement(announcementDraft.trim());
                    setIsAnnouncementModalOpen(false);
                    setIsEditingAnnouncement(false);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#31302e] mb-1">
                    ข้อความประกาศ
                  </label>
                  <textarea
                    rows={4}
                    value={announcementDraft}
                    onChange={(e) => setAnnouncementDraft(e.target.value.slice(0, 500))}
                    placeholder="พิมพ์ข้อความประกาศประจำห้อง... (จะแสดงข้างชื่อห้องด้านบน)"
                    className="w-full px-3 py-2 bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] placeholder-[#a39e98] focus:outline-none focus:border-[#0075de] shadow-xs resize-none select-text"
                    maxLength={500}
                    autoFocus
                  />
                  <div className="flex items-center justify-between text-[10px] text-[#a39e98] mt-1">
                    <span>* แสดงข้างชื่อห้องด้านบนสุด</span>
                    <span>{announcementDraft.length}/500 ตัวอักษร</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#f0efed]">
                  {roomAnnouncement ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('คุณต้องการลบประกาศประจำห้องนี้ใช่หรือไม่?')) {
                          if (onSetAnnouncement) {
                            onSetAnnouncement('');
                            setIsAnnouncementModalOpen(false);
                            setIsEditingAnnouncement(false);
                          }
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบประกาศ</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (roomAnnouncement) {
                          setIsEditingAnnouncement(false);
                        } else {
                          setIsAnnouncementModalOpen(false);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-[#e6e6e6] bg-white hover:bg-[#f6f5f4] text-xs font-medium text-[#31302e] transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={!announcementDraft.trim()}
                      className="px-4 py-1.5 rounded-xl bg-[#0075de] hover:bg-[#005bab] disabled:opacity-40 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                    >
                      บันทึกประกาศ
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-[#000000] font-medium leading-relaxed whitespace-pre-wrap select-text max-h-[55vh] overflow-y-auto">
                  {roomAnnouncement}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#f0efed]">
                  {isAdminOrOwner && onSetAnnouncement ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAnnouncementDraft(roomAnnouncement || '');
                          setIsEditingAnnouncement(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไขประกาศ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('คุณต้องการลบประกาศประจำห้องนี้ใช่หรือไม่?')) {
                            onSetAnnouncement('');
                            setIsAnnouncementModalOpen(false);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    onClick={() => setIsAnnouncementModalOpen(false)}
                    className="px-4 py-1.5 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
