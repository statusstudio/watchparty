import React from 'react';
import {
  Scissors,
  Download,
  BookOpen,
  Code2,
  Sparkles,
  Smartphone,
  Layers,
} from 'lucide-react';
import { STICKER_SPECS, StickerType } from '../../types/sticker';

interface HeaderProps {
  stickerType: StickerType;
  onSelectStickerType: (type: StickerType) => void;
  stickerCount: number;
  maxStickers: number;
  onOpenSpecsGuide: () => void;
  onOpenExportModal: () => void;
  onOpenCodeExport: () => void;
  onToggleChatSim: () => void;
  isChatSimOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  stickerType,
  onSelectStickerType,
  stickerCount,
  maxStickers,
  onOpenSpecsGuide,
  onOpenExportModal,
  onOpenCodeExport,
  onToggleChatSim,
  isChatSimOpen,
}) => {
  const spec = STICKER_SPECS[stickerType];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight font-['Prompt']">
                LINE Sticker Studio
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                2x2 Cut & Pack
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              ตัดภาพ 2x2 ลบพื้นหลัง 5 ขั้นตอน และแพ็ก ZIP ส่ง LINE Creators Market
            </p>
          </div>
        </div>

        {/* Zone 2: Sticker Type Selector & Count */}
        <div className="flex items-center gap-2">
          {/* Segmented control for sticker types */}
          <div className="hidden sm:flex items-center p-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
            {(['standard', 'big', 'emoji'] as StickerType[]).map((type) => {
              const itemSpec = STICKER_SPECS[type];
              const isSelected = stickerType === type;
              return (
                <button
                  key={type}
                  onClick={() => onSelectStickerType(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/40'
                  }`}
                  title={`${itemSpec.nameTh} (${itemSpec.width}x${itemSpec.height}px)`}
                >
                  {type === 'standard' && 'Standard'}
                  {type === 'big' && 'Big Sticker'}
                  {type === 'emoji' && 'Emoji'}
                  <span className="ml-1.5 opacity-75 text-[10px]">
                    {itemSpec.width}×{itemSpec.height}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sticker Count Metric */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-semibold text-white tabular-nums">
              {stickerCount}
            </span>
            <span className="text-slate-400">/ {maxStickers}</span>
            <span className="text-[11px] text-slate-400 hidden lg:inline">รูป</span>
          </div>
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Simulator toggle */}
          <button
            onClick={onToggleChatSim}
            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isChatSimOpen
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="จำลองห้องแชท LINE เพื่อทดสอบสติกเกอร์"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">จำลองแชท LINE</span>
          </button>

          {/* Code Export button */}
          <button
            onClick={onOpenCodeExport}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
            title="ดูโค้ด React Native & Flutter"
          >
            <Code2 className="w-4 h-4" />
          </button>

          {/* Guide button */}
          <button
            onClick={onOpenSpecsGuide}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
            title="คู่มือสเปคทางการ LINE Creators Market"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Export ZIP Primary CTA */}
          <button
            onClick={onOpenExportModal}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>แพ็กไฟล์ ZIP</span>
          </button>
        </div>
      </div>
    </header>
  );
};
