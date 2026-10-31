import React from 'react';

interface StitchMobileBottomNavProps {
  currentTab: 'explore' | 'feed' | 'favorites' | 'create' | 'live-stage' | 'profile';
  onTabChange: (tab: 'explore' | 'feed' | 'favorites' | 'create' | 'live-stage' | 'profile') => void;
  onOpenCreateRoom: () => void;
  onOpenProfile: () => void;
  theme?: 'dark' | 'light';
}

export const StitchMobileBottomNav: React.FC<StitchMobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenCreateRoom,
  onOpenProfile,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  return (
    <nav className={`fixed bottom-0 inset-x-0 h-16 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-2xl border-t shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-40 flex items-center justify-around px-2 lg:hidden transition-colors duration-300 select-none ${
      isLight ? 'bg-[#faf8ff]/95 border-[#dae2fd]' : 'bg-[#111319]/95 border-white/[0.08]'
    }`}>
      {/* 1. Explore */}
      <button
        type="button"
        onClick={() => onTabChange('explore')}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all cursor-pointer relative ${
          currentTab === 'explore'
            ? isLight ? 'text-[#006194] font-bold' : 'text-[#00daf3] font-bold'
            : isLight ? 'text-[#707881]' : 'text-[#94A3B8]'
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">explore</span>
        <span className="text-[10px] font-semibold">สำรวจ</span>
        {currentTab === 'explore' && (
          <span className={`w-1 h-1 rounded-full absolute -bottom-0.5 ${
            isLight ? 'bg-[#006194]' : 'bg-[#00daf3]'
          }`} />
        )}
      </button>

      {/* 2. Community Feed */}
      <button
        type="button"
        onClick={() => onTabChange('feed')}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all cursor-pointer relative ${
          currentTab === 'feed'
            ? isLight ? 'text-[#006194] font-bold' : 'text-[#00daf3] font-bold'
            : isLight ? 'text-[#707881]' : 'text-[#94A3B8]'
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">dynamic_feed</span>
        <span className="text-[10px] font-semibold">ฟีดชุมชน</span>
        {currentTab === 'feed' && (
          <span className={`w-1 h-1 rounded-full absolute -bottom-0.5 ${
            isLight ? 'bg-[#006194]' : 'bg-[#00daf3]'
          }`} />
        )}
      </button>

      {/* 3. Favorites */}
      <button
        type="button"
        onClick={() => onTabChange('favorites')}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all cursor-pointer relative ${
          currentTab === 'favorites'
            ? isLight ? 'text-[#006194] font-bold' : 'text-[#00daf3] font-bold'
            : isLight ? 'text-[#707881]' : 'text-[#94A3B8]'
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">favorite</span>
        <span className="text-[10px] font-semibold">ห้องโปรด</span>
        {currentTab === 'favorites' && (
          <span className={`w-1 h-1 rounded-full absolute -bottom-0.5 ${
            isLight ? 'bg-[#006194]' : 'bg-[#00daf3]'
          }`} />
        )}
      </button>

      {/* 3. Center Create Room FAB Button with Glow */}
      <button
        type="button"
        onClick={onOpenCreateRoom}
        className="flex flex-col items-center justify-center -mt-6 cursor-pointer group"
      >
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#0075de] to-[#00daf3] opacity-60 blur-md group-hover:opacity-100 transition-opacity animate-pulse" />
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#0075de] via-[#005eb4] to-[#00daf3] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(0,117,222,0.6)] active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-[26px]">add</span>
          </div>
        </div>
        <span className="text-[10px] font-bold dark:text-[#e2e2ea] text-[#131b2e] mt-0.5">สร้างห้อง</span>
      </button>

      {/* 4. Live Stage */}
      <button
        type="button"
        onClick={() => onTabChange('live-stage')}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all cursor-pointer relative ${
          currentTab === 'live-stage'
            ? isLight ? 'text-[#006194] font-bold' : 'text-[#00daf3] font-bold'
            : isLight ? 'text-[#707881]' : 'text-[#94A3B8]'
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">podcasts</span>
        <span className="text-[10px] font-semibold">Live Stage</span>
        {currentTab === 'live-stage' && (
          <span className={`w-1 h-1 rounded-full absolute -bottom-0.5 ${
            isLight ? 'bg-[#006194]' : 'bg-[#00daf3]'
          }`} />
        )}
      </button>

      {/* 5. Profile */}
      <button
        type="button"
        onClick={onOpenProfile}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all cursor-pointer ${
          isLight ? 'text-[#707881] hover:text-[#131b2e]' : 'text-[#94A3B8] hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">account_circle</span>
        <span className="text-[10px] font-semibold">โปรไฟล์</span>
      </button>
    </nav>
  );
};
