import React, { useState } from 'react';
import { UserProfile, RoomSummary } from '../../types/index.js';

interface StitchHeaderProps {
  currentTab: 'explore' | 'feed' | 'favorites' | 'popular' | 'my-rooms' | 'live-stage';
  onTabChange: (tab: 'explore' | 'feed' | 'favorites' | 'popular' | 'my-rooms' | 'live-stage') => void;
  onOpenCreateRoom: () => void;
  onOpenRoomCodeModal: () => void;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onNavigateToPublicProfile?: (handle: string) => void;
  currentUser?: UserProfile;
  myActiveRoom?: RoomSummary;
  onSelectRoom?: (roomId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const StitchHeader: React.FC<StitchHeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenCreateRoom,
  onOpenRoomCodeModal,
  onOpenProfile,
  onOpenAuth,
  onLogout,
  onNavigateToPublicProfile,
  currentUser,
  myActiveRoom,
  onSelectRoom,
  searchQuery,
  onSearchChange,
  theme = 'dark',
  onToggleTheme,
}) => {
  const isLight = theme === 'light';
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b shadow-sm transition-colors duration-300 ${
      isLight ? 'bg-[#faf8ff]/95 border-[#dae2fd]' : 'bg-[#111319]/90 border-white/[0.06] shadow-[0_1px_16px_rgba(0,0,0,0.5)]'
    }`}>
      <div className="h-14 sm:h-16 md:h-18 max-w-[1440px] mx-auto px-3 sm:px-5 md:px-8 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Mobile Live Badge */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 min-w-0">
          <button 
            onClick={() => onTabChange('explore')}
            className="flex items-center gap-2 sm:gap-2.5 group text-left transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#0075de] to-[#00daf3] flex items-center justify-center text-white shadow-[0_0_16px_rgba(0,117,222,0.45)]">
              <span className="material-symbols-outlined text-[20px] sm:text-[22px] animate-pulse">graphic_eq</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-[#111319]" />
            </div>
            <div className="flex flex-col">
              <span className={`font-black text-base sm:text-lg md:text-xl tracking-tight leading-tight ${
                isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'
              }`}>
                Pleng<span className={isLight ? 'text-[#006194]' : 'text-[#00daf3]'}>.online</span>
              </span>
              <span className={`font-mono text-[9px] tracking-wider uppercase hidden xs:inline ${
                isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'
              }`}>
                Realtime Stage
              </span>
            </div>
          </button>

          {/* Realtime Live Pulse Pill (Visible on xs+) */}
          <div className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${
            isLight ? 'bg-white border-[#dae2fd] text-[#131b2e]' : 'bg-[#191b22] border-white/10 text-[#e2e2ea]'
          }`}>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span className="font-semibold text-[#10B981]">LIVE</span>
          </div>

          {/* Search Bar Desktop */}
          <div className="hidden lg:flex items-center relative w-64 xl:w-72">
            <span className={`material-symbols-outlined absolute left-3 pointer-events-none text-[18px] ${
              isLight ? 'text-[#707881]' : 'text-[#94A3B8]'
            }`}>
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาห้องเพลง หรือเพลย์ลิสต์..."
              className={`w-full pl-9 pr-4 py-1.5 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0075de] transition-all shadow-xs ${
                isLight
                  ? 'bg-white border border-[#dae2fd] text-[#131b2e] placeholder-[#707881]'
                  : 'bg-[#191b22] border border-white/[0.08] text-[#e2e2ea] placeholder-[#8b919e]'
              }`}
            />
          </div>
        </div>

        {/* Center Navigation Tabs (Stitch Style on Desktop) */}
        <nav className={`hidden xl:flex items-center gap-1 p-1 rounded-full border ${
          isLight ? 'bg-[#f2f3ff] border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.04]'
        }`}>
          <button
            onClick={() => onTabChange('explore')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'explore'
                ? isLight ? 'bg-white text-[#006194] shadow-xs font-bold' : 'bg-[#282a30] text-[#e2e2ea] shadow-inner font-bold'
                : isLight ? 'text-[#475569] hover:text-[#131b2e] hover:bg-white/60' : 'text-[#c1c6d5] hover:text-[#e2e2ea] hover:bg-[#1d1f26]'
            }`}
          >
            สำรวจห้อง
          </button>
          <button
            onClick={() => onTabChange('feed')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'feed'
                ? isLight ? 'bg-white text-[#006194] shadow-xs font-bold' : 'bg-[#282a30] text-[#00daf3] shadow-inner font-bold'
                : isLight ? 'text-[#475569] hover:text-[#131b2e] hover:bg-white/60' : 'text-[#c1c6d5] hover:text-[#e2e2ea] hover:bg-[#1d1f26]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dynamic_feed</span>
            <span>ฟีดชุมชน</span>
          </button>
          <button
            onClick={() => onTabChange('favorites')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'favorites'
                ? isLight ? 'bg-white text-[#006194] shadow-xs font-bold' : 'bg-[#282a30] text-[#e2e2ea] shadow-inner font-bold'
                : isLight ? 'text-[#475569] hover:text-[#131b2e] hover:bg-white/60' : 'text-[#c1c6d5] hover:text-[#e2e2ea] hover:bg-[#1d1f26]'
            }`}
          >
            ห้องโปรด
          </button>
          <button
            onClick={() => onTabChange('popular')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'popular'
                ? isLight ? 'bg-white text-[#006194] shadow-xs font-bold' : 'bg-[#282a30] text-[#e2e2ea] shadow-inner font-bold'
                : isLight ? 'text-[#475569] hover:text-[#131b2e] hover:bg-white/60' : 'text-[#c1c6d5] hover:text-[#e2e2ea] hover:bg-[#1d1f26]'
            }`}
          >
            ยอดนิยม
          </button>
          <button
            onClick={() => onTabChange('live-stage')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'live-stage'
                ? isLight ? 'bg-white text-[#006194] shadow-xs font-bold' : 'bg-[#282a30] text-[#00daf3] shadow-inner font-bold'
                : isLight ? 'text-[#475569] hover:text-[#006194] hover:bg-white/60' : 'text-[#c1c6d5] hover:text-[#00daf3] hover:bg-[#1d1f26]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            Live Stage
          </button>
        </nav>

        {/* Right Controls: Mobile Search Toggle + Theme Switcher + Action CTA + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className={`lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
              isLight ? 'bg-white border-[#dae2fd] text-[#131b2e]' : 'bg-[#191b22] border-white/10 text-[#e2e2ea]'
            }`}
            title="ค้นหาห้อง"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isMobileSearchOpen ? 'close' : 'search'}
            </span>
          </button>

          {/* Theme Switcher Toggle (โหมดมืด / โหมดสว่าง) */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border transition-all duration-300 text-xs font-semibold select-none shadow-xs cursor-pointer ${
                isLight
                  ? 'bg-white border-[#dae2fd] text-[#131b2e] hover:bg-[#eaedff]'
                  : 'bg-[#191b22] border-white/10 text-[#e2e2ea] hover:bg-[#282a30]'
              }`}
              title={isLight ? 'สลับเป็นโหมดมืด' : 'สลับเป็นโหมดสว่าง'}
            >
              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-transform duration-300 ${
                isLight ? 'bg-[#eef0ff]' : 'bg-[#282a30]'
              }`}>
                {isLight ? (
                  <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-[#006194]">
                    light_mode
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-[#ffb955]">
                    dark_mode
                  </span>
                )}
              </div>
              <span className="font-medium text-[10px] sm:text-[11px] hidden xs:inline">
                {isLight ? 'สว่าง' : 'มืด'}
              </span>
            </button>
          )}

          {/* Room Code Button (Desktop / Tablet) */}
          <button
            onClick={onOpenRoomCodeModal}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all border cursor-pointer ${
              isLight
                ? 'bg-white border-[#dae2fd] text-[#131b2e] hover:bg-[#f2f3ff]'
                : 'bg-[#282a30] hover:bg-[#373940] text-[#e2e2ea] border-transparent'
            }`}
            title="ใส่รหัสห้องเพื่อเข้าร่วม"
          >
            <span className={`material-symbols-outlined text-[15px] ${isLight ? 'text-[#006194]' : 'text-[#00daf3]'}`}>key</span>
            <span>ใส่รหัสห้อง</span>
          </button>

          {/* Create Room CTA (Desktop / Tablet) */}
          <button
            onClick={onOpenCreateRoom}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0075de] to-[#005eb4] text-white text-xs sm:text-sm font-bold shadow-[0_0_16px_rgba(0,117,222,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>สร้างห้อง</span>
          </button>

          {/* Login with Google / Member Button (shown for Guests) */}
          {(!currentUser || currentUser.provider === 'guest') && onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95 ${
                isLight
                  ? 'bg-white border-[#dae2fd] text-[#131b2e] hover:bg-[#eaedff] hover:border-[#0075de]/40'
                  : 'bg-[#191b22] border-white/10 text-[#e2e2ea] hover:bg-[#282a30] hover:border-[#00daf3]/40'
              }`}
              title="เข้าสู่ระบบด้วย Google หรืออีเมล"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>เข้าสู่ระบบ</span>
            </button>
          )}

          {/* User Profile Avatar & Dropdown Controller */}
          <div className="relative">
            <button
              onClick={() => {
                if (currentUser?.provider && currentUser.provider !== 'guest') {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                } else if (onOpenProfile) {
                  onOpenProfile();
                }
              }}
              className={`flex items-center gap-1.5 sm:gap-2 p-1 rounded-full border transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 ${
                isLight
                  ? 'bg-white border-[#dae2fd] text-[#131b2e] hover:border-[#0075de]/40'
                  : 'bg-[#191b22] border-white/10 text-[#e2e2ea] hover:border-[#00daf3]/40'
              }`}
              title={currentUser?.provider && currentUser.provider !== 'guest' ? `จัดการบัญชี: ${currentUser.name}` : 'โปรไฟล์ของฉัน'}
            >
              <div
                className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 shadow-xs bg-zinc-200 dark:bg-zinc-800"
                style={{ borderColor: currentUser?.color || "#0075de" }}
              >
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">person</span>
                )}
              </div>

              {currentUser?.provider && currentUser.provider !== 'guest' && (
                <div className="hidden xs:flex items-center gap-1 min-w-0 pr-2">
                  <span className="text-xs font-bold truncate max-w-[90px] sm:max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-zinc-400">
                    arrow_drop_down
                  </span>
                </div>
              )}
            </button>

            {/* Profile Management Dropdown Menu (เมื่อล็อกอินแล้ว) */}
            {isProfileDropdownOpen && currentUser && currentUser.provider !== 'guest' && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setIsProfileDropdownOpen(false)}
                />
                <div
                  className={`absolute right-0 top-11 sm:top-12 w-72 sm:w-80 rounded-3xl border shadow-2xl backdrop-blur-2xl z-50 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-200 ${
                    isLight
                      ? 'bg-white/95 border-[#dae2fd] text-[#131b2e] shadow-[0_12px_36px_rgba(0,117,222,0.15)]'
                      : 'bg-[#191b22]/95 border-white/10 text-[#e2e2ea] shadow-[0_16px_40px_rgba(0,0,0,0.7)]'
                  }`}
                >
                  {/* User Profile Header Card */}
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#faf8ff] dark:bg-[#111319] border border-[#dae2fd]/60 dark:border-white/[0.06]">
                    <div
                      className="w-11 h-11 rounded-full overflow-hidden border-2 shrink-0 relative shadow-sm"
                      style={{ borderColor: currentUser.color || '#0075de' }}
                    >
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-xs sm:text-sm truncate max-w-[140px]">{currentUser.name}</h4>
                        <span className="px-1.5 py-0.2 rounded-full bg-blue-500/10 text-[#4285F4] text-[9px] font-bold">
                          Google
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748b] dark:text-[#94A3B8] font-mono truncate">
                        @{currentUser.username || currentUser.id}
                      </p>
                      {currentUser.email && (
                        <p className="text-[10px] text-[#707881] dark:text-[#8b919e] truncate mt-0.5">
                          {currentUser.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Active Party Room of User */}
                  {myActiveRoom && (
                    <div
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onSelectRoom) {
                          onSelectRoom(myActiveRoom.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer group shadow-sm hover:scale-[1.01] active:scale-[0.99] ${
                        isLight
                          ? 'bg-gradient-to-r from-blue-50/90 via-cyan-50/80 to-indigo-50/90 border-[#0075de]/30 hover:border-[#0075de]'
                          : 'bg-gradient-to-r from-[#0075de]/15 via-[#00daf3]/10 to-[#191b22] border-[#00daf3]/30 hover:border-[#00daf3]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-2 w-2 relative shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
                          </span>
                          <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">
                            ห้องปาร์ตี้ของคุณเปิดอยู่
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isLight ? 'bg-white text-[#006194] border border-[#dae2fd]' : 'bg-white/10 text-[#00daf3]'
                        }`}>
                          {myActiveRoom.onlineCount || 1} คนกำลังฟัง
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/20 shrink-0 relative border border-white/10">
                          <img
                            src={
                              myActiveRoom.currentVideo?.thumbnail ||
                              myActiveRoom.coverImage ||
                              'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'
                            }
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-bold truncate group-hover:text-[#0075de] dark:group-hover:text-[#00daf3] transition-colors ${
                            isLight ? 'text-[#131b2e]' : 'text-white'
                          }`}>
                            {myActiveRoom.name}
                          </h4>
                          <p className={`text-[10px] truncate mt-0.5 ${
                            isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'
                          }`}>
                            {myActiveRoom.currentVideo?.title ? `🎵 ${myActiveRoom.currentVideo.title}` : (myActiveRoom.description || 'แตะเพื่อเข้าห้องปาร์ตี้')}
                          </p>
                        </div>

                        <div className="w-7 h-7 rounded-full bg-[#0075de] text-white flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform shadow-sm">
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Menu Items */}
                  <div className="space-y-1">
                    {/* 1. Go to Public Profile Page */}
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onNavigateToPublicProfile) {
                          onNavigateToPublicProfile(currentUser.username || currentUser.id);
                        }
                      }}
                      className={`w-full p-2.5 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                        isLight ? 'hover:bg-[#f2f3ff]' : 'hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#0075de]/10 text-[#0075de] dark:text-[#00daf3] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">account_box</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-tight">หน้าเพจโปรไฟล์ของฉัน</p>
                        <p className="text-[10px] text-[#64748b] dark:text-[#94A3B8] truncate mt-0.5">
                          ดูหน้าโปรไฟล์สาธารณะ & เพลงโปรด
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-[#64748b] dark:text-[#94A3B8]">
                        chevron_right
                      </span>
                    </button>

                    {/* 2. Edit Profile & Personal Settings */}
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onOpenProfile) onOpenProfile();
                      }}
                      className={`w-full p-2.5 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                        isLight ? 'hover:bg-[#f2f3ff]' : 'hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-tight">แก้ไขโปรไฟล์ & ตั้งค่าส่วนตัว</p>
                        <p className="text-[10px] text-[#64748b] dark:text-[#94A3B8] truncate mt-0.5">
                          เปลี่ยนชื่อ, รูปโปรไฟล์, สีออร่า, สไตล์
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-[#64748b] dark:text-[#94A3B8]">
                        chevron_right
                      </span>
                    </button>

                    {/* Divider */}
                    <div className="border-t border-[#dae2fd]/60 dark:border-white/[0.06] my-1" />

                    {/* 3. Log Out */}
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full p-2.5 rounded-2xl flex items-center gap-3 text-left hover:bg-rose-500/10 text-rose-500 transition-all cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-tight">ออกจากระบบ</p>
                        <p className="text-[10px] text-rose-400/80 truncate mt-0.5">
                          กลับสู่โหมดผู้ฟังทั่วไป (Guest)
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Mobile Search Drawer */}
      {isMobileSearchOpen && (
        <div className={`lg:hidden px-3 py-2 border-t animate-in fade-in slide-in-from-top-2 duration-200 ${
          isLight ? 'bg-white/95 border-[#dae2fd]' : 'bg-[#191b22]/95 border-white/[0.08]'
        }`}>
          <div className="relative w-full">
            <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[18px] ${
              isLight ? 'text-[#707881]' : 'text-[#94A3B8]'
            }`}>
              search
            </span>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาห้องเพลง, DJ, หรือเพลย์ลิสต์..."
              className={`w-full pl-9 pr-9 py-2 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0075de] shadow-xs ${
                isLight
                  ? 'bg-[#f6f5f4] border border-[#dae2fd] text-[#131b2e] placeholder-[#707881]'
                  : 'bg-[#111319] border border-white/[0.08] text-[#e2e2ea] placeholder-[#8b919e]'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
