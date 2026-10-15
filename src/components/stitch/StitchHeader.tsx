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

  return (
    <header className={`fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b shadow-sm transition-colors duration-300 ${
      isLight ? 'bg-[#faf8ff]/95 border-[#dae2fd]' : 'bg-[#111319]/90 border-white/[0.06] shadow-[0_1px_12px_rgba(0,0,0,0.5)]'
    }`}>
      <div className="h-20 max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 flex items-center justify-between gap-4">
        {/* Brand Logo & Search */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <button 
            onClick={() => onTabChange('explore')}
            className="flex items-center gap-3 group text-left transition-transform hover:scale-105"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0075de] to-[#00daf3] flex items-center justify-center text-white shadow-[0_0_16px_rgba(0,117,222,0.45)]">
              <span className="material-symbols-outlined text-[24px]">graphic_eq</span>
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-lg md:text-xl tracking-tight leading-tight ${
                isLight ? 'text-[#131b2e]' : 'text-[#e2e2ea]'
              }`}>
                Pleng<span className={isLight ? 'text-[#006194]' : 'text-[#00daf3]'}>.online</span>
              </span>
              <span className={`font-mono text-[10px] tracking-widest uppercase ${
                isLight ? 'text-[#64748b]' : 'text-[#94A3B8]'
              }`}>
                Realtime Audio Stage
              </span>
            </div>
          </button>

          {/* Search Bar Desktop */}
          <div className="hidden xl:flex items-center relative w-72">
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
              className={`w-full pl-9 pr-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0075de] transition-all shadow-sm ${
                isLight
                  ? 'bg-white border border-[#dae2fd] text-[#131b2e] placeholder-[#707881]'
                  : 'bg-[#191b22] border border-transparent text-[#e2e2ea] placeholder-[#8b919e]'
              }`}
            />
          </div>
        </div>

        {/* Center Navigation Tabs (Stitch Style) */}
        <nav className={`hidden lg:flex items-center gap-1 p-1 rounded-full border ${
          isLight ? 'bg-[#f2f3ff] border-[#dae2fd]' : 'bg-[#191b22] border-white/[0.04]'
        }`}>
          <button
            onClick={() => onTabChange('explore')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              currentTab === 'explore'
                ? isLight ? 'bg-white text-[#006194] shadow-sm font-bold' : 'bg-[#282a30] text-[#e2e2ea] shadow-inner font-bold'
                : isLight ? 'text-[#475569] hover:text-[#131b2e] hover:bg-white/60' : 'text-[#c1c6d5] hover:text-[#e2e2ea] hover:bg-[#1d1f26]'
            }`}
          >
            สำรวจห้องฟังเพลง
          </button>
          <button
            onClick={() => onTabChange('favorites')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              currentTab === 'favorites'
                ? isLight ? 'bg-white text-[#006194] shadow-sm font-bold' : 'bg-[#282a30] text-[#e2e2ea] shadow-inner font-bold'
                : isLight ? 'text-[#475569] hover:text-[#131b2e] hover:bg-white/60' : 'text-[#c1c6d5] hover:text-[#e2e2ea] hover:bg-[#1d1f26]'
            }`}
          >
            ห้องโปรดของฉัน
          </button>
          <button
            onClick={() => onTabChange('popular')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              currentTab === 'popular'
                ? isLight ? 'bg-white text-[#006194] shadow-sm font-bold' : 'bg-[#282a30] text-[#e2e2ea] shadow-inner font-bold'
                : isLight ? 'text-[#475569] hover:text-[#131b2e] hover:bg-white/60' : 'text-[#c1c6d5] hover:text-[#e2e2ea] hover:bg-[#1d1f26]'
            }`}
          >
            เพลย์ลิสต์ยอดนิยม
          </button>
          <button
            onClick={() => onTabChange('live-stage')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'live-stage'
                ? isLight ? 'bg-white text-[#006194] shadow-sm font-bold' : 'bg-[#282a30] text-[#00daf3] shadow-inner font-bold'
                : isLight ? 'text-[#475569] hover:text-[#006194] hover:bg-white/60' : 'text-[#c1c6d5] hover:text-[#00daf3] hover:bg-[#1d1f26]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            Live Stage
          </button>
        </nav>

        {/* Right CTA & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Theme Switcher Toggle (โหมดมืด / โหมดสว่าง) */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 text-xs font-semibold select-none shadow-sm ${
                isLight
                  ? 'bg-white border-[#dae2fd] text-[#131b2e] hover:bg-[#eaedff]'
                  : 'bg-[#191b22] border-white/10 text-[#e2e2ea] hover:bg-[#282a30]'
              }`}
              title={isLight ? 'สลับเป็นโหมดมืด (Dark Mode)' : 'สลับเป็นโหมดสว่าง (Light Mode)'}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300 ${
                isLight ? 'bg-[#eef0ff]' : 'bg-[#282a30]'
              }`}>
                {isLight ? (
                  <span className="material-symbols-outlined text-[15px] text-[#006194]">
                    light_mode
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[15px] text-[#ffb955]">
                    dark_mode
                  </span>
                )}
              </div>
              <span className="font-medium text-[11px] sm:text-xs">
                {isLight ? 'โหมดสว่าง' : 'โหมดมืด'}
              </span>
            </button>
          )}

          <button
            onClick={onOpenRoomCodeModal}
            className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold shadow-sm transition-all border ${
              isLight
                ? 'bg-white border-[#dae2fd] text-[#131b2e] hover:bg-[#f2f3ff]'
                : 'bg-[#282a30] hover:bg-[#373940] text-[#e2e2ea] border-transparent'
            }`}
            title="ใส่รหัสห้องเพื่อเข้าร่วม"
          >
            <span className={`material-symbols-outlined text-[16px] ${isLight ? 'text-[#006194]' : 'text-[#00daf3]'}`}>key</span>
            <span>ใส่รหัสห้อง</span>
          </button>

          <button
            onClick={onOpenCreateRoom}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#0075de] to-[#005eb4] text-white text-sm font-bold shadow-[0_0_20px_-3px_rgba(0,117,222,0.45)] hover:shadow-[0_0_28px_-2px_rgba(0,218,243,0.6)] hover:brightness-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span className="hidden sm:inline">สร้างห้องฟังเพลงใหม่</span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full bg-[#a8c8ff] text-[#003061] flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(168,200,255,0.35)] hover:scale-105 active:scale-95 transition-transform overflow-hidden"
          >
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[20px]">person</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
