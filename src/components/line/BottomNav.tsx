import React from 'react';
import { Home, Palette, Package, Layers } from 'lucide-react';

export type NavTab = 'home' | 'preview' | 'export';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  stickerCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  stickerCount,
}) => {
  const tabs = [
    {
      id: 'home' as NavTab,
      labelTh: 'หน้าหลัก',
      subtitleTh: 'อัปโหลด + ตั้งค่า',
      icon: Home,
    },
    {
      id: 'preview' as NavTab,
      labelTh: 'Preview',
      subtitleTh: 'ดูสติกเกอร์ + main/tab',
      icon: Palette,
      badge: stickerCount > 0 ? stickerCount : undefined,
    },
    {
      id: 'export' as NavTab,
      labelTh: 'Export',
      subtitleTh: 'ดาวน์โหลด ZIP & ภาพรวม',
      icon: Package,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl safe-area-pb">
      <div className="max-w-md mx-auto grid grid-cols-3 h-16 items-center px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-colors font-['Prompt'] group ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Pill Indicator */}
              {isActive && (
                <div className="absolute top-1.5 w-8 h-1 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}

              <div className="relative mt-1">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-3.5 px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-mono text-[10px] font-bold rounded-full min-w-[16px] text-center leading-tight shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[11px] font-semibold mt-1 tracking-tight leading-none ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {tab.labelTh}
              </span>
              <span className="text-[9px] text-slate-400 leading-none mt-0.5 hidden xs:block">
                {tab.subtitleTh}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
