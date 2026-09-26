import React, { useState } from 'react';
import {
  Package,
  Download,
  Share2,
  Grid,
  CheckCircle2,
  AlertTriangle,
  Star,
  Bookmark,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  FileArchive,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Wand2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { STICKER_SPECS, StickerItem, StickerType } from '../../types/sticker';
import {
  downloadBlob,
  exportStickerPackZip,
  validateStickerPack,
} from '../../services/zipExport';
import {
  formatInfoMarkdown,
  generateStickerInfoFromAi,
  LineStickerAiInfo,
} from '../../services/infoGenerator';

interface ExportTabProps {
  stickers: StickerItem[];
  stickerType: StickerType;
  mainStickerId: string;
  tabStickerId: string;
  onOpenCompositeModal: () => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

/**
 * Format a string safely into a filename for ZIP
 */
function sanitizeZipFilename(name: string): string {
  if (!name) return 'line_stickers';
  // Allow Thai, English, digits, spaces replaced with underscores, hyphens
  const clean = name
    .trim()
    .replace(/[\\/:*?"<>|#%&{}$!'`@+=]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60);
  return clean || 'line_stickers';
}

export const ExportTab: React.FC<ExportTabProps> = ({
  stickers,
  stickerType,
  mainStickerId,
  tabStickerId,
  onOpenCompositeModal,
  onShowToast,
}) => {
  const [packTitle, setPackTitle] = useState('line_stickers_pack1');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isSharingZip, setIsSharingZip] = useState(false);
  const spec = STICKER_SPECS[stickerType];

  // AI-generated info.md state (null until generated or edited)
  const [aiInfo, setAiInfo] = useState<LineStickerAiInfo | null>(null);
  const [isGeneratingAiInfo, setIsGeneratingAiInfo] = useState(false);
  const [isCopiedInfo, setIsCopiedInfo] = useState(false);

  const mainSticker = stickers.find((s) => s.id === mainStickerId) || stickers[0];
  const tabSticker = stickers.find((s) => s.id === tabStickerId) || stickers[0];

  /**
   * Helper function to execute AI naming and metadata generation
   */
  const executeAiGeneration = async (): Promise<LineStickerAiInfo | null> => {
    if (stickers.length === 0) return null;
    setIsGeneratingAiInfo(true);
    try {
      const sampleIndices = [
        0,
        Math.floor(stickers.length / 2),
        Math.max(0, stickers.length - 1),
      ];
      const uniqueIndices = Array.from(new Set(sampleIndices));
      const sampleImages = uniqueIndices
        .map((idx) => stickers[idx]?.processedDataUrl)
        .filter(Boolean);

      const generated = await generateStickerInfoFromAi(
        stickers.length,
        packTitle,
        sampleImages
      );

      setAiInfo(generated);

      // Auto update the ZIP packTitle to match the AI-generated title
      if (generated?.titleTh) {
        setPackTitle(sanitizeZipFilename(generated.titleTh));
      } else if (generated?.titleEn) {
        setPackTitle(sanitizeZipFilename(generated.titleEn));
      }

      return generated;
    } catch (err) {
      console.error('Error generating AI info:', err);
      return null;
    } finally {
      setIsGeneratingAiInfo(false);
    }
  };

  const handleRegenerateAiInfo = async () => {
    const res = await executeAiGeneration();
    if (res) {
      onShowToast('Ai วิเคราะห์รูปและคิดชื่อสติกเกอร์ให้เรียบร้อย!', 'success');
    }
  };

  // Content for info.md
  const currentAiInfo: LineStickerAiInfo = aiInfo || {
    titleTh: 'น้องคิวท์ ส่งความสุข',
    titleEn: 'Cute Character Daily Moments',
    descriptionTh: 'ส่งต่อความน่ารักสดใสและรอยยิ้มในทุกๆ วัน ด้วยสติกเกอร์สุดน่ารัก ใช้งานง่าย เหมาะกับทุกการแชท!',
    descriptionEn: 'Brighten your daily chats with these super cute and expressive stickers! Perfect for sharing feelings and daily vibes.',
  };

  const infoMarkdownContent = formatInfoMarkdown(
    currentAiInfo,
    stickers.length,
    `${spec.width} x ${spec.height} px`
  );

  const handleCopyInfo = () => {
    navigator.clipboard.writeText(infoMarkdownContent);
    setIsCopiedInfo(true);
    onShowToast('คัดลอกข้อความ info.md เรียบร้อยแล้ว', 'success');
    setTimeout(() => setIsCopiedInfo(false), 2000);
  };

  /**
   * Main download ZIP handler:
   * 1. If AI info has not been generated yet, generate it first on-the-fly!
   * 2. Use the AI-generated sticker title as the ZIP filename!
   * 3. Include info.md in the package!
   */
  const handleDownloadZip = async () => {
    if (stickers.length === 0) {
      onShowToast('ยังไม่มีสติกเกอร์ในชุด กรุณาตัดหรืออัปโหลดรูปภาพก่อน', 'error');
      return;
    }

    try {
      setIsExportingZip(true);

      // 1. Let AI analyze and think of the name at download time if not done yet
      let activeInfo = aiInfo;
      if (!activeInfo) {
        onShowToast('Ai กำลังวิเคราะห์รูปและคิดชื่อชุดสติกเกอร์...', 'info');
        activeInfo = await executeAiGeneration();
      }

      // 2. Set the ZIP filename from the sticker title
      const rawTitle = activeInfo?.titleTh || activeInfo?.titleEn || packTitle;
      const finalZipName = sanitizeZipFilename(rawTitle);

      const zipBlob = await exportStickerPackZip(
        stickers,
        stickerType,
        finalZipName,
        mainStickerId,
        tabStickerId,
        activeInfo
      );

      // 3. Download the ZIP with the sticker title
      downloadBlob(zipBlob, `${finalZipName}.zip`);
      onShowToast(`ดาวน์โหลดไฟล์ "${finalZipName}.zip" พร้อม info.md สำเร็จแล้ว!`, 'success');

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Error generating ZIP:', err);
      onShowToast('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP', 'error');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleShareZip = async () => {
    if (stickers.length === 0) {
      onShowToast('ยังไม่มีสติกเกอร์ในชุด', 'error');
      return;
    }

    try {
      setIsSharingZip(true);

      let activeInfo = aiInfo;
      if (!activeInfo) {
        onShowToast('Ai กำลังวิเคราะห์รูปและคิดชื่อชุดสติกเกอร์...', 'info');
        activeInfo = await executeAiGeneration();
      }

      const rawTitle = activeInfo?.titleTh || activeInfo?.titleEn || packTitle;
      const finalZipName = sanitizeZipFilename(rawTitle);

      const zipBlob = await exportStickerPackZip(
        stickers,
        stickerType,
        finalZipName,
        mainStickerId,
        tabStickerId,
        activeInfo
      );

      const filename = `${finalZipName}.zip`;
      const file = new File([zipBlob], filename, { type: 'application/zip' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${rawTitle} (${stickers.length} รูป)`,
          text: `ชุดสติกเกอร์ LINE: ${rawTitle} พร้อมส่งขายบน LINE Creators Market`,
          files: [file],
        });
        onShowToast('แชร์ไฟล์ ZIP ผ่าน Share Sheet สำเร็จ', 'success');
      } else {
        downloadBlob(zipBlob, filename);
        onShowToast(`บันทึกไฟล์ "${filename}" ลงเครื่องเรียบร้อยแล้ว`, 'info');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing ZIP:', err);
        handleDownloadZip();
      }
    } finally {
      setIsSharingZip(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Package className="w-3.5 h-3.5" />
            <span>LINE Creators Market Exporter + AI Smart Naming</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Prompt']">
            แพ็กเกจส่งออกสติกเกอร์ LINE
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            เมื่อกดดาวน์โหลด <strong>Ai จะวิเคราะห์ตัวละครและคิดชื่อชุดให้ทันที</strong> พร้อมนำชื่อชุดนั้นไปตั้งเป็นชื่อไฟล์ ZIP และสร้างไฟล์ <strong>info.md</strong> บรรจุไว้ด้านในให้อัตโนมัติ
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadZip}
              disabled={isExportingZip || isGeneratingAiInfo || stickers.length === 0}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {isExportingZip
                  ? isGeneratingAiInfo
                    ? 'Ai กำลังคิดชื่อสติกเกอร์...'
                    : 'กำลังแพ็ก ZIP...'
                  : 'แพ็กและบันทึกไฟล์ ZIP (Ai คิดชื่อให้)'}
              </span>
            </button>

            <button
              onClick={handleShareZip}
              disabled={isSharingZip || isGeneratingAiInfo || stickers.length === 0}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 border border-slate-700 active:scale-95 transition-all disabled:opacity-50"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>แชร์ผ่าน Share Sheet</span>
            </button>

            <button
              onClick={onOpenCompositeModal}
              disabled={stickers.length === 0}
              className="px-5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-medium text-xs sm:text-sm flex items-center gap-2 border border-slate-700 active:scale-95 transition-all disabled:opacity-50"
            >
              <Grid className="w-4 h-4 text-sky-400" />
              <span>ภาพรวม 4×10 Composite Sheet</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Package Filename Setting */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <span>ชื่อไฟล์ ZIP (ตั้งตามชื่อชุดสติกเกอร์อัตโนมัติ):</span>
            <span className="text-[10px] text-emerald-400 font-normal">
              {aiInfo ? '✓ เชื่อมโยงกับชื่อที่ Ai คิดให้แล้ว' : '(จะถูกตั้งตามชื่อที่ Ai คิดให้เมื่อกดดาวน์โหลด)'}
            </span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={packTitle}
            onChange={(e) => setPackTitle(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
            placeholder="ชื่อชุดสติกเกอร์"
          />
          <span className="text-xs text-slate-400 font-mono">.zip</span>
        </div>
      </div>

      {/* AI info.md Live Preview & Editor Card */}
      <div className="bg-slate-900/80 rounded-2xl border border-emerald-500/40 p-4 sm:p-5 space-y-4 shadow-lg shadow-emerald-500/5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-['Prompt']">
                  ไฟล์ info.md (สร้างอัตโนมัติด้วย Ai)
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  รวมใน ZIP อัตโนมัติ
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {aiInfo
                  ? 'Ai วิเคราะห์รูปและใส่ข้อมูลพร้อมนำไปลงทะเบียนเรียบร้อยแล้ว'
                  : 'กดปุ่มด้านล่างหรือกดปุ่มแพ็กไฟล์ ZIP ด้านบนเพื่อสั่งให้ Ai วิเคราะห์รูปทันที'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerateAiInfo}
              disabled={isGeneratingAiInfo || stickers.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="ให้ Ai คิดชื่อและคำอธิบายชุดสติกเกอร์ใหม่"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isGeneratingAiInfo ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAiInfo ? 'กำลังวิเคราะห์รูป...' : 'ให้ Ai คิดให้ใหม่'}</span>
            </button>

            <button
              onClick={handleCopyInfo}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
            >
              {isCopiedInfo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isCopiedInfo ? 'คัดลอกแล้ว' : 'คัดลอก info.md'}</span>
            </button>
          </div>
        </div>

        {/* Editable Fields generated by AI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <span>ชื่อชุดสติกเกอร์ (ไทย):</span>
              <span className="text-[10px] text-emerald-400 font-normal">
                {aiInfo ? '(Ai คิดให้แล้ว)' : '(รอกดคิดชื่อ)'}
              </span>
            </label>
            <input
              type="text"
              value={currentAiInfo.titleTh}
              onChange={(e) => {
                const updated = { ...currentAiInfo, titleTh: e.target.value };
                setAiInfo(updated);
                setPackTitle(sanitizeZipFilename(e.target.value));
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <span>ชื่อชุดสติกเกอร์ (อังกฤษ):</span>
              <span className="text-[10px] text-emerald-400 font-normal">
                {aiInfo ? '(Ai คิดให้แล้ว)' : '(รอกดคิดชื่อ)'}
              </span>
            </label>
            <input
              type="text"
              value={currentAiInfo.titleEn}
              onChange={(e) => {
                const updated = { ...currentAiInfo, titleEn: e.target.value };
                setAiInfo(updated);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <span>คำอธิบายสติกเกอร์ (ไทย):</span>
              <span className="text-[10px] text-emerald-400 font-normal">
                {aiInfo ? '(Ai คิดให้แล้ว)' : '(รอกดคิดชื่อ)'}
              </span>
            </label>
            <textarea
              rows={3}
              value={currentAiInfo.descriptionTh}
              onChange={(e) => {
                const updated = { ...currentAiInfo, descriptionTh: e.target.value };
                setAiInfo(updated);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <span>คำอธิบายสติกเกอร์ (อังกฤษ):</span>
              <span className="text-[10px] text-emerald-400 font-normal">
                {aiInfo ? '(Ai คิดให้แล้ว)' : '(รอกดคิดชื่อ)'}
              </span>
            </label>
            <textarea
              rows={3}
              value={currentAiInfo.descriptionEn}
              onChange={(e) => {
                const updated = { ...currentAiInfo, descriptionEn: e.target.value };
                setAiInfo(updated);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Live Raw Preview of info.md */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400">เนื้อหาไฟล์ info.md ที่จะอยู่ใน ZIP:</span>
          <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300/90 whitespace-pre-wrap leading-relaxed select-all">
            {infoMarkdownContent}
          </pre>
        </div>
      </div>

      {/* 4x10 Composite Preview Card */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white font-['Prompt']">
                Composite Preview Sheet (Grid 4×10)
              </h3>
              <p className="text-[11px] text-slate-400">
                รวมสติกเกอร์ทั้งหมด {stickers.length} รูป จัดเรียง 4 คอลัมน์ x 10 แถว
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCompositeModal}
            disabled={stickers.length === 0}
            className="px-3.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-xs font-medium border border-sky-500/30 transition-colors disabled:opacity-50"
          >
            เปิดหน้าต่างพรีวิว & ดาวน์โหลด
          </button>
        </div>
      </div>

      {/* LINE Standards Validation Checklist */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white font-['Prompt']">
              การตรวจสอบความสมบูรณ์ตามสเปค LINE Creators Market
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            {spec.nameTh}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Check 1: Count */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2">
              {spec.allowedCounts.includes(stickers.length) ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="font-semibold text-white">
                จำนวนสติกเกอร์: {stickers.length} รูป
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {spec.allowedCounts.includes(stickers.length)
                ? 'ตรงตามชุดทางการ (8, 16, 24, 32 หรือ 40 รูป)'
                : 'LINE กำหนดชุดละ 8, 16, 24, 32 หรือ 40 รูป'}
            </p>
          </div>

          {/* Check 2: Resolution */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-white">
                ขนาดรูปภาพ: {spec.width}×{spec.height} px
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              พิกเซลเป็นเลขคู่เสมอ + เว้นขอบเซฟตี้ {spec.margin}px อัตโนมัติ
            </p>
          </div>

          {/* Check 3: main.png */}
          {spec.hasMain && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white flex items-center gap-1">
                  <span>main.png (240×240 px)</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                รูปหน้าปกสำหรับแสดงบน LINE STORE
              </p>
            </div>
          )}

          {/* Check 4: tab.png */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-white flex items-center gap-1">
                <span>tab.png (96×74 px)</span>
                <Bookmark className="w-3.5 h-3.5 fill-sky-400 text-sky-400" />
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              ไอคอนแท็บสติกเกอร์ในหน้าห้องแชท LINE
            </p>
          </div>
        </div>

        {/* Upload Guide Link */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
          <span>พร้อมนำไฟล์ ZIP ไปอัปโหลดขายได้ทันที</span>
          <a
            href="https://creator.line.me"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>เปิด LINE Creators Market (creator.line.me)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
