import React from 'react';
import {
  Star,
  Bookmark,
  Maximize2,
  Trash2,
  RefreshCw,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { STICKER_SPECS, StickerItem, StickerType } from '../../types/sticker';

interface StickerGridProps {
  stickers: StickerItem[];
  stickerType: StickerType;
  mainStickerId: string;
  tabStickerId: string;
  onSetMain: (id: string) => void;
  onSetTab: (id: string) => void;
  onSelectPreview: (sticker: StickerItem) => void;
  onDeleteSticker: (id: string) => void;
  onReprocessSticker: (sticker: StickerItem) => void;
  previewBg: string;
  onGoToHome?: () => void;
}

export const StickerGrid: React.FC<StickerGridProps> = ({
  stickers,
  stickerType,
  mainStickerId,
  tabStickerId,
  onSetMain,
  onSetTab,
  onSelectPreview,
  onDeleteSticker,
  onReprocessSticker,
  previewBg,
  onGoToHome,
}) => {
  const spec = STICKER_SPECS[stickerType];

  if (stickers.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 sm:p-14 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 mx-auto flex items-center justify-center text-slate-400 shadow-inner">
          <Sparkles className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base sm:text-lg font-bold text-white font-['Prompt']">
            ยังไม่มีสติกเกอร์ในชุด
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            เริ่มต้นโดยการลากรูปภาพ หรือไฟล์ <strong>.ZIP</strong> มาวางในหน้าหลักเพื่อนำเข้าและตัดพื้นหลังอัตโนมัติ
          </p>
        </div>
        {onGoToHome && (
          <button
            onClick={onGoToHome}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <span>ไปที่หน้าหลักเพื่ออัปโหลด</span>
          </button>
        )}
      </div>
    );
  }

  // Get background style for the card preview
  const getCardBgStyle = () => {
    switch (previewBg) {
      case 'white':
        return { backgroundColor: '#FFFFFF' };
      case 'black':
        return { backgroundColor: '#0F172A' };
      case 'darkgray':
        return { backgroundColor: '#334155' };
      case 'lineblue':
        return { backgroundColor: '#849EBF' };
      case 'green':
        return { backgroundColor: '#00B900' };
      case 'checker':
      default:
        return {
          backgroundImage: `
            linear-gradient(45deg, #1e293b 25%, transparent 25%),
            linear-gradient(-45deg, #1e293b 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #1e293b 75%),
            linear-gradient(-45deg, transparent 75%, #1e293b 75%)
          `,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          backgroundColor: '#0f172a',
        };
    }
  };

  return (
    <div className="space-y-3">
      {/* Grid Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">
            รายการสติกเกอร์ ({stickers.length} รูป)
          </span>
          <span className="text-[11px] text-slate-400">
            • ขนาดตามสเปค: {spec.width}×{spec.height}px (Margin {spec.margin}px)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>Main (240x240)</span>
          </span>
          <span className="flex items-center gap-1 text-sky-400">
            <Bookmark className="w-3.5 h-3.5 fill-sky-400" />
            <span>Tab Icon (96x74)</span>
          </span>
        </div>
      </div>

      {/* 4-Column Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {stickers.map((sticker, idx) => {
          const num = idx + 1;
          const displayNum = spec.namePattern === '001'
            ? num.toString().padStart(3, '0')
            : num.toString().padStart(2, '0');
          const isMain = sticker.id === mainStickerId || sticker.isMain;
          const isTab = sticker.id === tabStickerId || sticker.isTab;

          return (
            <div
              key={sticker.id}
              className={`group relative bg-slate-900 rounded-2xl border transition-all overflow-hidden flex flex-col ${
                isMain
                  ? 'border-amber-500/80 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : isTab
                  ? 'border-sky-500/80 shadow-md shadow-sky-500/10 ring-1 ring-sky-500/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Badges */}
              <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-sm text-white font-mono text-[11px] font-bold border border-slate-700/80 shadow-xs">
                    {displayNum}.png
                  </span>
                  {sticker.quadrant && (
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                      {sticker.quadrant}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {isMain && spec.hasMain && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-bold shadow-xs flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-slate-950" />
                      <span>MAIN</span>
                    </span>
                  )}
                  {isTab && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-500 text-slate-950 text-[10px] font-bold shadow-xs flex items-center gap-0.5">
                      <Bookmark className="w-3 h-3 fill-slate-950" />
                      <span>TAB</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Canvas Area */}
              <div
                onClick={() => onSelectPreview(sticker)}
                className="relative aspect-[370/320] w-full flex items-center justify-center p-3 cursor-pointer overflow-hidden group-hover:opacity-95 transition-opacity"
                style={getCardBgStyle()}
              >
                <img
                  src={sticker.processedDataUrl}
                  alt={`Sticker ${displayNum}`}
                  className="w-full h-full object-contain drop-shadow-md select-none pointer-events-none transition-transform duration-200 group-hover:scale-105"
                />

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-900/80 text-white backdrop-blur-sm shadow-md">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Bottom Quick Controls */}
              <div className="p-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs gap-1">
                <div className="flex items-center gap-1">
                  {spec.hasMain && (
                    <button
                      onClick={() => onSetMain(sticker.id)}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors ${
                        isMain
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title="ตั้งเป็นรูปหลัก (main.png 240x240)"
                    >
                      <Star className={`w-3 h-3 ${isMain ? 'fill-amber-400' : ''}`} />
                      <span className="hidden sm:inline">Main</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSetTab(sticker.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors ${
                      isTab
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="ตั้งเป็นรูปแท็บ (tab.png 96x74)"
                  >
                    <Bookmark className={`w-3 h-3 ${isTab ? 'fill-sky-400' : ''}`} />
                    <span className="hidden sm:inline">Tab</span>
                  </button>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onReprocessSticker(sticker)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
                    title="ประมวลผลสติกเกอร์นี้ใหม่"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteSticker(sticker.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                    title="ลบสติกเกอร์นี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
