import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  Grid,
  Sparkles,
  Check,
  RefreshCw,
} from 'lucide-react';
import { CompositeBgColor, generateCompositeSheet } from '../../services/compositeSheet';
import { StickerItem, StickerType } from '../../types/sticker';

interface CompositeSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  stickers: StickerItem[];
  stickerType: StickerType;
  onShowToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export const CompositeSheetModal: React.FC<CompositeSheetModalProps> = ({
  isOpen,
  onClose,
  stickers,
  stickerType,
  onShowToast,
}) => {
  const [bgColor, setBgColor] = useState<CompositeBgColor>('lineblue');
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && stickers.length > 0) {
      renderSheet(bgColor);
    }
  }, [isOpen, bgColor, stickers, stickerType]);

  const renderSheet = async (bg: CompositeBgColor) => {
    try {
      setIsGenerating(true);
      const url = await generateCompositeSheet({
        stickers,
        stickerType,
        bgColor: bg,
        title: 'LINE STICKER 4×10 COMPOSITE PREVIEW',
      });
      setSheetUrl(url);
    } catch (err) {
      console.error('Error generating composite sheet:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!sheetUrl) return;
    const a = document.createElement('a');
    a.href = sheetUrl;
    a.download = `line_sticker_preview_sheet_4x10_${bgColor}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast('ดาวน์โหลดภาพรวม 4×10 สำเร็จ', 'success');
  };

  const handleShare = async () => {
    if (!sheetUrl) return;

    // Check if navigator.share with files is supported
    if (navigator.share) {
      try {
        const res = await fetch(sheetUrl);
        const blob = await res.blob();
        const file = new File([blob], 'line_sticker_preview_sheet_4x10.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'LINE Sticker Preview Sheet (Grid 4x10)',
            text: `ภาพรวมชุดสติกเกอร์ LINE ${stickers.length} รูป จัดเรียงแบบ 4x10 Grid`,
            files: [file],
          });
          onShowToast('แชร์ภาพรวมผ่าน Share Sheet สำเร็จ', 'success');
          return;
        } else {
          await navigator.share({
            title: 'LINE Sticker Preview Sheet (Grid 4x10)',
            text: `ภาพรวมชุดสติกเกอร์ LINE ${stickers.length} รูป`,
            url: window.location.href,
          });
          onShowToast('แชร์ลิงก์สำเร็จ', 'success');
          return;
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Share error:', err);
          handleDownload();
        }
      }
    } else {
      // Fallback
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white font-['Prompt']">
                Composite Preview Sheet (Grid 4×10)
              </h3>
              <p className="text-xs text-slate-400">
                ภาพรวมสติกเกอร์ทั้งหมดในชุด จัดเรียงตามลำดับสำหรับพรีวิวหรือทำใบเสนอขาย
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Controls Bar: Background Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-medium">เลือกสีพื้นหลังภาพรวม:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'transparent' as CompositeBgColor, label: 'โปร่งใส (Transparent)' },
                  { id: 'white' as CompositeBgColor, label: 'ขาว (White)' },
                  { id: 'black' as CompositeBgColor, label: 'ดำ (Black)' },
                  { id: 'lineblue' as CompositeBgColor, label: 'LINE Blue (#849EBF)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setBgColor(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      bgColor === item.id
                        ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-emerald-400 font-mono">
              ความละเอียดสูง 4×10 คอลัมน์/แถว
            </span>
          </div>

          {/* Sheet Preview Container */}
          <div className="relative w-full aspect-[4/3] max-h-[500px] rounded-2xl overflow-auto border border-slate-800 bg-slate-950 p-4 flex items-center justify-center">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>กำลังสร้างภาพรวม 4×10 Grid...</span>
              </div>
            ) : sheetUrl ? (
              <img
                src={sheetUrl}
                alt="Composite Preview Sheet"
                className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
              />
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <p className="text-xs text-slate-400 hidden sm:block">
            เหมาะสำหรับส่งตรวจ หรือโพสต์โปรโมตบนโซเชียลมีเดีย
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              disabled={isGenerating || !sheetUrl}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>แชร์ (Share Sheet)</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating || !sheetUrl}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>บันทึกรูปภาพ (PNG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
