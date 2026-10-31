import React, { useState } from 'react';
import { UserProfile } from '../../types/index.js';

interface StitchHeaderProps {
  currentTab: 'explore' | 'favorites' | 'popular' | 'my-rooms' | 'live-stage';
  onTabChange: (tab: 'explore' | 'favorites' | 'popular' | 'my-rooms' | 'live-stage') => void;
  onOpenCreateRoom: () => void;
  onOpenRoomCodeModal: () => void;
  onOpenProfile?: () => void;
  currentUser?: UserProfile;
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
  currentUser,
  searchQuery,
  onSearchChange,
  theme = 'dark',
  onToggleTheme,
}) => {
  const isLight = theme === 'light';
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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

          {/* User Profile Avatar */}
          <button
            onClick={onOpenProfile}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#a8c8ff] text-[#003061] flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs hover:scale-105 active:scale-95 transition-transform overflow-hidden cursor-pointer ring-2 ring-[#00daf3]/40"
            title="โปรไฟล์ของฉัน"
          >
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">person</span>
            )}
          </button>
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
