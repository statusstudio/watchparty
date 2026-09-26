import React from 'react';
import {
  Sliders,
  Sparkles,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { DEFAULT_PARAMS, ProcessingParams } from '../../types/sticker';

interface ParameterControlsProps {
  params: ProcessingParams;
  onChangeParams: (newParams: ProcessingParams) => void;
  onReprocessAll: () => void;
  isReprocessing: boolean;
  totalStickers: number;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  params,
  onChangeParams,
  onReprocessAll,
  isReprocessing,
  totalStickers,
}) => {
  const handleUpdate = <K extends keyof ProcessingParams>(key: K, value: ProcessingParams[K]) => {
    onChangeParams({
      ...params,
      [key]: value,
    });
  };

  const handleReset = () => {
    onChangeParams({ ...DEFAULT_PARAMS });
  };

  return (
    <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-4 sm:p-5 shadow-sm">
      {/* Title & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/60 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white font-['Prompt']">
              ปรับแต่งอัลกอริทึมลบพื้นหลัง (5-Step Algorithm)
            </h2>
            <p className="text-[11px] text-slate-400">
              ควบคุมการจับสี กัดขอบ ลบเงา และเพิ่มขอบขาวสติกเกอร์
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-700/50 flex items-center gap-1.5 transition-colors"
            title="รีเซ็ตค่ากลับเป็นค่ามาตรฐาน"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ต</span>
          </button>
          <button
            onClick={onReprocessAll}
            disabled={isReprocessing || totalStickers === 0}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all shadow-sm ${
              isReprocessing || totalStickers === 0
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
            <span>{isReprocessing ? 'กำลังประมวลผล...' : 'ประมวลผลใหม่ทั้งหมด'}</span>
          </button>
        </div>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Control 1: Tolerance Slider */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="tolerance-slider" className="font-medium text-slate-300 flex items-center gap-1">
              <span>Tolerance (ความกว้างสี)</span>
            </label>
            <span className="font-mono text-emerald-400 font-semibold tabular-nums">
              {params.tolerance}
            </span>
          </div>
          <input
            id="tolerance-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            value={params.tolerance}
            onChange={(e) => handleUpdate('tolerance', Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0 (แม่นยำ)</span>
            <span>20 (แนะนำ)</span>
            <span>100 (กว้าง)</span>
          </div>
        </div>

        {/* Control 2: Choke / Erosion Slider */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="choke-slider" className="font-medium text-slate-300 flex items-center gap-1">
              <span>Choke (กัดขอบ)</span>
            </label>
            <span className="font-mono text-emerald-400 font-semibold tabular-nums">
              {params.choke.toFixed(1)} px
            </span>
          </div>
          <input
            id="choke-slider"
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={params.choke}
            onChange={(e) => handleUpdate('choke', Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0 px</span>
            <span>1.2 px (ค่าปริยาย)</span>
            <span>3.0 px</span>
          </div>
        </div>

        {/* Control 3: BG Keying Mode Toggle */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">โหมดการเจาะสี (BG Mode)</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-800 rounded-lg">
            <button
              onClick={() => handleUpdate('bgMode', 'floodfill')}
              className={`py-1.5 px-2 text-[11px] font-medium rounded transition-all text-center ${
                params.bgMode === 'floodfill'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Floodfill (BFS)
            </button>
            <button
              onClick={() => handleUpdate('bgMode', 'global')}
              className={`py-1.5 px-2 text-[11px] font-medium rounded transition-all text-center ${
                params.bgMode === 'global'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Global (ทั่วทั้งภาพ)
            </button>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {params.bgMode === 'floodfill'
              ? 'เจาะจากขอบนอกเข้าใน (ปกป้องตา/สีขาวข้างใน)'
              : 'ลบทุกจุดที่มีสีเหมือนพื้นหลัง (เหมาะกับ Magenta)'}
          </p>
        </div>

        {/* Control 4: Toggles (Shadows & Defringe) */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between">
          <div className="space-y-2">
            {/* Remove Shadows toggle */}
            <label className="flex items-center justify-between cursor-pointer text-xs">
              <span className="text-slate-300">ลบเงาพื้น (Remove Shadows)</span>
              <input
                type="checkbox"
                checked={params.removeShadows}
                onChange={(e) => handleUpdate('removeShadows', e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </label>

            {/* Defringe toggle */}
            <label className="flex items-center justify-between cursor-pointer text-xs">
              <span className="text-slate-300">ลบสีรั่วขอบ (Defringe)</span>
              <input
                type="checkbox"
                checked={params.defringe}
                onChange={(e) => handleUpdate('defringe', e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </label>

            {/* Remove Enclosed Gaps toggle (ช่องระหว่างแขน/ขา) */}
            <label className="flex items-center justify-between cursor-pointer text-xs" title="ลบพื้นหลังที่ติดอยู่ในรูระหว่างแขน ขา หรือช่องว่างปิดล้อม">
              <span className="text-emerald-400 font-medium">ลบซอกแขน/ช่องปิดล้อม</span>
              <input
                type="checkbox"
                checked={!!params.removeEnclosedGaps}
                onChange={(e) => handleUpdate('removeEnclosedGaps', e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Spill Suppression: Magenta/Green/Blue</span>
          </div>
        </div>
      </div>

      {/* Bonus LINE Style: White Stroke Option */}
      <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={params.whiteStroke}
              onChange={(e) => handleUpdate('whiteStroke', e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
            />
            <span className="text-slate-200 font-medium font-['Prompt']">
              เพิ่มขอบขาวรอบตัวละคร (White Sticker Stroke)
            </span>
          </label>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            สไตล์สติกเกอร์ LINE ยอดฮิต ช่วยให้เห็นชัดเจนบนทุกสีพื้นหลังแชท
          </span>
        </div>

        {params.whiteStroke && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">ความหนา:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((w) => (
                <button
                  key={w}
                  onClick={() => handleUpdate('strokeWidth', w)}
                  className={`w-6 h-6 rounded text-xs font-mono transition-colors ${
                    params.strokeWidth === w
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {w}p
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
