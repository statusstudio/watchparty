import React, { useState, useEffect } from 'react';
import {
  X,
  Grid2X2,
  Check,
  Scissors,
  Layers,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { slice2x2Grid } from '../../services/stickerProcessor';

interface GridSlicerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
  onConfirmSlices: (slices: { TL: string; TR: string; BL: string; BR: string }) => void;
}

export const GridSlicerModal: React.FC<GridSlicerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageName,
  onConfirmSlices,
}) => {
  const [splitX, setSplitX] = useState(0.5);
  const [splitY, setSplitY] = useState(0.5);
  const [slices, setSlices] = useState<{ TL: string; TR: string; BL: string; BR: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && imageUrl) {
      updateSlices(splitX, splitY);
    }
  }, [isOpen, imageUrl, splitX, splitY]);

  const updateSlices = async (sx: number, sy: number) => {
    try {
      setIsProcessing(true);
      const res = await slice2x2Grid(imageUrl, sx, sy);
      setSlices({
        TL: res.TL,
        TR: res.TR,
        BL: res.BL,
        BR: res.BR,
      });
    } catch (err) {
      console.error('Failed to slice 2x2 grid:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Grid2X2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white font-['Prompt']">
                ตัดภาพแบบ 2x2 Grid (4 ชิ้นต่อภาพ)
              </h3>
              <p className="text-xs text-slate-400">
                แบ่งภาพออกเป็น TL (บนซ้าย), TR (บนขวา), BL (ล่างซ้าย), BR (ล่างขวา)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: Interactive 2x2 Slice Overlay */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium">ตำแหน่งเส้นแบ่ง 2x2 (ตรงกึ่งกลาง)</span>
                <button
                  onClick={() => {
                    setSplitX(0.5);
                    setSplitY(0.5);
                  }}
                  className="text-emerald-400 hover:underline text-[11px]"
                >
                  คืนค่า 50% / 50%
                </button>
              </div>

              <div className="relative aspect-square w-full max-w-[360px] mx-auto rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center group shadow-md">
                <img
                  src={imageUrl}
                  alt={imageName}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />

                {/* Vertical Cut Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.8)] pointer-events-none z-10"
                  style={{ left: `${splitX * 100}%` }}
                />

                {/* Horizontal Cut Line */}
                <div
                  className="absolute left-0 right-0 h-0.5 bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.8)] pointer-events-none z-10"
                  style={{ top: `${splitY * 100}%` }}
                />

                {/* Quadrant Overlays */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none z-20">
                  <div className="p-2 flex items-start justify-start">
                    <span className="bg-slate-900/80 backdrop-blur-sm text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shadow-xs">
                      TL (บนซ้าย)
                    </span>
                  </div>
                  <div className="p-2 flex items-start justify-end">
                    <span className="bg-slate-900/80 backdrop-blur-sm text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shadow-xs">
                      TR (บนขวา)
                    </span>
                  </div>
                  <div className="p-2 flex items-end justify-start">
                    <span className="bg-slate-900/80 backdrop-blur-sm text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shadow-xs">
                      BL (ล่างซ้าย)
                    </span>
                  </div>
                  <div className="p-2 flex items-end justify-end">
                    <span className="bg-slate-900/80 backdrop-blur-sm text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shadow-xs">
                      BR (ล่างขวา)
                    </span>
                  </div>
                </div>
              </div>

              {/* Adjust sliders */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-slate-400 flex justify-between">
                    <span>แกน X:</span>
                    <span className="font-mono text-emerald-400">{Math.round(splitX * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="0.7"
                    step="0.01"
                    value={splitX}
                    onChange={(e) => setSplitX(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-700 accent-emerald-500 rounded"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 flex justify-between">
                    <span>แกน Y:</span>
                    <span className="font-mono text-emerald-400">{Math.round(splitY * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="0.7"
                    step="0.01"
                    value={splitY}
                    onChange={(e) => setSplitY(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-700 accent-emerald-500 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Right: Preview of 4 Slices */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium">พรีวิวชิ้นงาน 4 ชิ้นที่จะได้:</span>
                <span className="text-[11px] text-emerald-400 font-mono">4 ชิ้นพร้อมตัด</span>
              </div>

              {slices ? (
                <div className="grid grid-cols-2 gap-3 max-w-[360px] mx-auto">
                  {(['TL', 'TR', 'BL', 'BR'] as const).map((quad) => (
                    <div
                      key={quad}
                      className="bg-slate-950 rounded-xl border border-slate-800 p-2 text-center space-y-1.5 relative shadow-xs"
                    >
                      <div className="aspect-square rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center p-1 border border-slate-800/80">
                        <img
                          src={slices[quad]}
                          alt={quad}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="inline-block text-[11px] font-semibold text-slate-300 font-mono">
                        {quad} ({quad === 'TL' && 'บนซ้าย'}
                        {quad === 'TR' && 'บนขวา'}
                        {quad === 'BL' && 'ล่างซ้าย'}
                        {quad === 'BR' && 'ล่างขวา'})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
                  กำลังสร้างชิ้นงาน...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            ระบบจะส่งทั้ง 4 ชิ้นเข้าสู่กระบวนการลบพื้นหลัง 5 ขั้นตอนอัตโนมัติ
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => {
                if (slices) onConfirmSlices(slices);
              }}
              disabled={!slices || isProcessing}
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Scissors className="w-4 h-4" />
              <span>ยืนยันตัด 4 สติกเกอร์</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
