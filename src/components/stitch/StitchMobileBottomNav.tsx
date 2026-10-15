import React from 'react';

interface StitchMobileBottomNavProps {
  currentTab: 'explore' | 'favorites' | 'create' | 'live-stage' | 'profile';
  onTabChange: (tab: 'explore' | 'favorites' | 'create' | 'live-stage' | 'profile') => void;
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
    <nav className={`fixed bottom-0 inset-x-0 h-16 backdrop-blur-2xl border-t shadow-lg z-40 flex items-center justify-around px-2 lg:hidden transition-colors duration-300 ${
      isLight ? 'bg-[#faf8ff]/95 border-[#dae2fd]' : 'bg-[#111319]/95 border-white/[0.08]'
    }`}>
      {/* 1. Explore */}
      <button
        onClick={() => onTabChange('explore')}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${
          currentTab === 'explore'
            ? isLight ? 'text-[#006194] font-bold' : 'text-[#00daf3] font-bold'
            : isLight ? 'text-[#707881]' : 'text-[#94A3B8]'
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">explore</span>
        <span className="text-[10px] font-semibold">สำรวจ</span>
      </button>

      {/* 2. Favorites */}
      <button
        onClick={() => onTabChange('favorites')}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${
          currentTab === 'favorites' ? 'dark:text-[#00daf3] text-[#006194] font-bold' : 'dark:text-[#94A3B8] text-[#707881]'
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">favorite</span>
        <span className="text-[10px] font-semibold">ห้องโปรด</span>
      </button>

      {/* 3. Center Create Room CTA */}
      <button
        onClick={onOpenCreateRoom}
        className="flex flex-col items-center justify-center -mt-5"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0075de] to-[#00daf3] text-white flex items-center justify-center shadow-[0_0_16px_rgba(0,117,222,0.6)] active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[26px]">add</span>
        </div>
        <span className="text-[10px] font-bold dark:text-[#e2e2ea] text-[#131b2e] mt-0.5">สร้างห้อง</span>
      </button>

      {/* 4. Live Stage */}
      <button
        onClick={() => onTabChange('live-stage')}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all ${
          currentTab === 'live-stage' ? 'dark:text-[#00daf3] text-[#006194] font-bold' : 'dark:text-[#94A3B8] text-[#707881]'
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">podcasts</span>
        <span className="text-[10px] font-semibold">Live Stage</span>
      </button>

      {/* 5. Profile */}
      <button
        onClick={onOpenProfile}
        className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 dark:text-[#94A3B8] text-[#707881]"
      >
        <span className="material-symbols-outlined text-[22px]">account_circle</span>
        <span className="text-[10px] font-semibold">โปรไฟล์</span>
      </button>
    </nav>
  );
};
