import React, { useState } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  Star,
  Bookmark,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { STICKER_SPECS, StickerItem, StickerType } from '../../types/sticker';
import {
  downloadBlob,
  exportStickerPackZip,
  validateStickerPack,
} from '../../services/zipExport';
import { generateStickerInfoFromAi, LineStickerAiInfo } from '../../services/infoGenerator';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stickers: StickerItem[];
  stickerType: StickerType;
  mainStickerId: string;
  tabStickerId: string;
}

function sanitizeZipFilename(name: string): string {
  if (!name) return 'line_stickers';
  const clean = name
    .trim()
    .replace(/[\\/:*?"<>|#%&{}$!'`@+=]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60);
  return clean || 'line_stickers';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  stickers,
  stickerType,
  mainStickerId,
  tabStickerId,
}) => {
  const [packTitle, setPackTitle] = useState('line_stickers');
  const [isExporting, setIsExporting] = useState(false);
  const spec = STICKER_SPECS[stickerType];

  if (!isOpen) return null;

  const validation = validateStickerPack(stickers, stickerType, mainStickerId, tabStickerId);

  const mainSticker = stickers.find((s) => s.id === mainStickerId) || stickers[0];
  const tabSticker = stickers.find((s) => s.id === tabStickerId) || stickers[0];

  const handleDownload = async () => {
    try {
      setIsExporting(true);

      // On-demand AI analysis of character stickers
      const sampleIndices = [
        0,
        Math.floor(stickers.length / 2),
        Math.max(0, stickers.length - 1),
      ];
      const uniqueIndices = Array.from(new Set(sampleIndices));
      const sampleImages = uniqueIndices
        .map((idx) => stickers[idx]?.processedDataUrl)
        .filter(Boolean);

      const aiInfo = await generateStickerInfoFromAi(
        stickers.length,
        packTitle,
        sampleImages
      );

      const rawTitle = aiInfo?.titleTh || aiInfo?.titleEn || packTitle;
      const finalZipName = sanitizeZipFilename(rawTitle);

      const zipBlob = await exportStickerPackZip(
        stickers,
        stickerType,
        finalZipName,
        mainStickerId,
        tabStickerId,
        aiInfo
      );

      downloadBlob(zipBlob, `${finalZipName}.zip`);

      // Fire confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if confetti fails
      }
    } catch (err) {
      console.error('Error generating ZIP:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileArchive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white font-['Prompt']">
                ส่งออกแพ็กเกจ ZIP สำหรับ LINE Creators Market
              </h3>
              <p className="text-xs text-slate-400">
                บรรจุรูปตามโครงสร้างไฟล์ทางการ พร้อมอัปโหลดขึ้นเว็บ creator.line.me
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Package Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              ตั้งชื่อไฟล์ ZIP (Package Filename):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={packTitle}
                onChange={(e) => setPackTitle(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                placeholder="line_stickers_vol1"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-mono">.zip</span>
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white font-['Prompt'] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ตรวจสอบมาตรฐาน LINE Creators Market</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {spec.nameTh}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Check 1: Count */}
              <div className="flex items-start gap-2.5">
                {spec.allowedCounts.includes(stickers.length) ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-slate-200 font-medium">
                    จำนวนสติกเกอร์: {stickers.length} รูป
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {spec.allowedCounts.includes(stickers.length)
                      ? `ถูกต้องตามชุดมาตรฐาน (${spec.allowedCounts.join(', ')} รูป)`
                      : `แนะนำให้มี 8, 16, 24, 32 หรือ 40 รูป เพื่อให้อัปโหลดผ่านการอนุมัติ`}
                  </div>
                </div>
              </div>

              {/* Check 2: main.png & tab.png */}
              {spec.hasMain && (
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-200 font-medium">
                      รูปหลัก main.png ({spec.mainWidth}×{spec.mainHeight}px): พร้อมแล้ว
                    </div>
                    <div className="text-[11px] text-slate-400">
                      แสดงเป็นรูปหน้าปกบน LINE STORE
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-200 font-medium">
                    รูปแท็บ tab.png ({spec.tabWidth}×{spec.tabHeight}px): พร้อมแล้ว
                  </div>
                  <div className="text-[11px] text-slate-400">
                    แสดงเป็นไอคอนแท็บในห้องแชท LINE
                  </div>
                </div>
              </div>

              {/* Check 3: Margins & Format */}
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-200 font-medium">
                    รูปแบบไฟล์ PNG โปร่งใส + ปรับ Margin {spec.margin}px อัตโนมัติ
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ความกว้าง/ความสูงเป็นเลขคู่ตามกฎของ LINE
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main & Tab Visual Preview */}
          <div className="grid grid-cols-2 gap-3">
            {/* main.png preview */}
            {spec.hasMain && mainSticker && (
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-900 border border-amber-500/40 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={mainSticker.mainDataUrl || mainSticker.processedDataUrl}
                    alt="Main"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>main.png</span>
                  </div>
                  <div className="text-[10px] text-slate-400">240×240 px (รูปหน้าปก)</div>
                </div>
              </div>
            )}

            {/* tab.png preview */}
            {tabSticker && (
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-900 border border-sky-500/40 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={tabSticker.tabDataUrl || tabSticker.processedDataUrl}
                    alt="Tab"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-sky-400 flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5 fill-sky-400" />
                    <span>tab.png</span>
                  </div>
                  <div className="text-[10px] text-slate-400">96×74 px (ไอคอนแท็บ)</div>
                </div>
              </div>
            )}
          </div>

          {/* ZIP Structure Preview */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              โครงสร้างไฟล์ใน {packTitle || 'line_stickers'}.zip:
            </span>
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-[11px] text-slate-400 space-y-1 max-h-36 overflow-y-auto">
              {stickers.slice(0, 4).map((_, i) => (
                <div key={i} className="text-emerald-400 flex items-center gap-1">
                  <span>📄 {spec.namePattern === '001' ? `${(i + 1).toString().padStart(3, '0')}.png` : `${(i + 1).toString().padStart(2, '0')}.png`}</span>
                  <span className="text-slate-500 text-[10px]">({spec.width}x{spec.height}px)</span>
                </div>
              ))}
              {stickers.length > 4 && (
                <div className="text-slate-500">
                  ... และอีก {stickers.length - 4} ไฟล์ (ถึง {spec.namePattern === '001' ? `${stickers.length.toString().padStart(3, '0')}.png` : `${stickers.length.toString().padStart(2, '0')}.png`})
                </div>
              )}
              {spec.hasMain && <div className="text-amber-400">⭐ main.png (240x240px) - รูปหน้าปก</div>}
              <div className="text-sky-400">🔖 tab.png (96x74px) - ไอคอนแท็บ</div>
              <div className="text-emerald-400 font-semibold">📝 info.md (สร้างโดย Ai สำหรับลงทะเบียน)</div>
              <div className="text-slate-400">📋 README_LINE_SUBMISSION_TH.txt</div>
              <div className="text-slate-400">⚙️ package_metadata.json</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <a
            href="https://creator.line.me"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <span>ไปที่ LINE Creators Market</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              ปิด
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting || stickers.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'กำลังสร้าง ZIP...' : 'ดาวน์โหลดไฟล์ ZIP ทันที'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
