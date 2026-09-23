import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Pipette,
  Sliders,
  Trash2,
  Eye,
  Star,
  Bookmark,
  ArrowLeft,
  Layers,
  HelpCircle,
  FileArchive,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  StickerSlice,
  RemoveBgOptions,
  slice2x2Grid,
  detectBackgroundColor,
  processStickerImage,
  createMainImage,
  createTabImage,
  createLineStickerZip,
  downloadBlob,
} from '../services/stickerProcessor.js';

interface UploadedGridImage {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export const LineStickerStudio: React.FC = () => {
  // Uploaded 2x2 grid images (up to 10 images = 40 stickers)
  const [gridImages, setGridImages] = useState<UploadedGridImage[]>([]);
  // Processed individual sticker slices (4 per grid image)
  const [stickers, setStickers] = useState<StickerSlice[]>([]);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processStatusText, setProcessStatusText] = useState('');

  // Background removal options
  const [targetColor, setTargetColor] = useState<{ r: number; g: number; b: number; hex: string }>({
    r: 224,
    g: 0,
    b: 150,
    hex: '#e00096', // Default magenta matching sample
  });
  const [tolerance, setTolerance] = useState<number>(24);
  const [feather, setFeather] = useState<number>(2);
  const [bgMode, setBgMode] = useState<'floodfill' | 'global'>('floodfill');
  const [fixedCanvasSize, setFixedCanvasSize] = useState<boolean>(true); // 370x320

  // Main & Tab sticker selection (indexes in stickers array)
  const [mainStickerIndex, setMainStickerIndex] = useState<number>(0);
  const [tabStickerIndex, setTabStickerIndex] = useState<number>(0);
  const [mainDataUrl, setMainDataUrl] = useState<string>('');
  const [tabDataUrl, setTabDataUrl] = useState<string>('');

  // Preview modal for full-size inspection
  const [previewSticker, setPreviewSticker] = useState<{ url: string; title: string } | null>(null);

  // Eyedropper state
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update main and tab previews whenever selected sticker changes
  useEffect(() => {
    const updateMainAndTab = async () => {
      if (stickers.length === 0) {
        setMainDataUrl('');
        setTabDataUrl('');
        return;
      }

      const mainSrc = stickers[mainStickerIndex]?.processedDataUrl || stickers[0]?.processedDataUrl;
      const tabSrc = stickers[tabStickerIndex]?.processedDataUrl || stickers[0]?.processedDataUrl;

      if (mainSrc) {
        const m = await createMainImage(mainSrc);
        setMainDataUrl(m);
      }
      if (tabSrc) {
        const t = await createTabImage(tabSrc);
        setTabDataUrl(t);
      }
    };
    updateMainAndTab();
  }, [stickers, mainStickerIndex, tabStickerIndex]);

  // Handle file uploads (2x2 grid images)
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const newGridImages: UploadedGridImage[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = dataUrl;
      });

      newGridImages.push({
        id: `grid-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        dataUrl,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    }

    const updatedGrid = [...gridImages, ...newGridImages];
    setGridImages(updatedGrid);

    // Auto-detect background color from the first image
    if (newGridImages.length > 0) {
      const firstImg = new Image();
      firstImg.onload = () => {
        const detected = detectBackgroundColor(firstImg);
        setTargetColor(detected);
      };
      firstImg.src = newGridImages[0].dataUrl;
    }
  };

  // Slice and remove background for all uploaded grid images
  const handleProcessAll = async () => {
    if (gridImages.length === 0) return;

    setIsProcessing(true);
    setProcessProgress(0);
    setProcessStatusText('กำลังตัดรูปภาพ 2x2 ออกเป็นสติกเกอร์ย่อย...');

    try {
      const allSlices: StickerSlice[] = [];

      // Step 1: Slice all grid images
      for (let g = 0; g < gridImages.length; g++) {
        setProcessStatusText(`กำลังตัดภาพชุดที่ ${g + 1} / ${gridImages.length}...`);
        const slices = await slice2x2Grid(gridImages[g].dataUrl, g);
        allSlices.push(...slices);
      }

      // Step 2: Remove background and format each slice to LINE specs
      const options: RemoveBgOptions = {
        targetColor: { r: targetColor.r, g: targetColor.g, b: targetColor.b },
        tolerance,
        feather,
        mode: bgMode,
        margin: 10,
        fixedCanvasSize,
      };

      const processedSlices: StickerSlice[] = [];
      const totalSlices = allSlices.length;

      for (let i = 0; i < totalSlices; i++) {
        setProcessProgress(Math.round(((i + 1) / totalSlices) * 100));
        setProcessStatusText(`กำลังลบพื้นหลังสติกเกอร์ที่ ${i + 1} / ${totalSlices}...`);

        const slice = allSlices[i];
        const processedUrl = await processStickerImage(slice.dataUrl, options);
        processedSlices.push({
          ...slice,
          processedDataUrl: processedUrl,
        });
      }

      setStickers(processedSlices);
      setMainStickerIndex(0);
      setTabStickerIndex(0);
      setProcessStatusText('ประมวลผลเสร็จสมบูรณ์!');
    } catch (err) {
      console.error('Processing error:', err);
      alert('เกิดข้อผิดพลาดในการประมวลผลภาพ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
    }
  };

  // Eyedropper API or Click-to-sample
  const triggerEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          const hex = result.sRGBHex;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          setTargetColor({ r, g, b, hex });
        }
      } catch (e) {
        // User cancelled eyedropper
      }
    } else {
      alert('เบราว์เซอร์ของคุณยังไม่รองรับ EyeDropper อัตโนมัติ สามารถใช้ Color Picker หรือกรอกรหัสสี Hex แทนได้ครับ');
    }
  };

  // Download entire ZIP package
  const handleDownloadZip = async () => {
    if (stickers.length === 0 || !mainDataUrl || !tabDataUrl) {
      alert('กรุณาประมวลผลสติกเกอร์ก่อนดาวน์โหลด');
      return;
    }

    try {
      const stickerUrls = stickers.map((s) => s.processedDataUrl);
      const zipBlob = await createLineStickerZip(
        stickerUrls,
        mainDataUrl,
        tabDataUrl,
        `line_stickers_${stickers.length}pcs.zip`
      );
      downloadBlob(zipBlob, `line_stickers_${stickers.length}pcs.zip`);
    } catch (e) {
      console.error('Zip generation error:', e);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP');
    }
  };

  // Download single sticker PNG
  const handleDownloadSingle = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Remove a grid image
  const handleRemoveGridImage = (id: string) => {
    setGridImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Clear all
  const handleClearAll = () => {
    if (confirm('คุณต้องการล้างข้อมูลภาพทั้งหมดใช่หรือไม่?')) {
      setGridImages([]);
      setStickers([]);
      setMainDataUrl('');
      setTabDataUrl('');
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-[#fbfbfa] text-[#31302e] font-sans flex flex-col selection:bg-[#0075de]/20">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e6e6e6] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="p-2 rounded-xl text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4] transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="กลับสู่หน้าหลัก WatchParty"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">หน้าหลัก</span>
          </a>
          <div className="h-4 w-px bg-[#e6e6e6]" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-[#000000]">LINE Sticker Studio</h1>
                <span className="px-2 py-0.5 rounded-full bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/20 text-[10px] font-bold">
                  LINE Creators Standard
                </span>
              </div>
              <p className="text-[11px] text-[#615d59] hidden sm:block">
                ตัดรูปกริด 2x2 ลบพื้นหลังโปร่งใส และแปลงเป็นแพ็กเกจสติกเกอร์ไลน์ 40 รูป พร้อม main.png & tab.png
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {stickers.length > 0 && (
            <button
              onClick={handleDownloadZip}
              className="px-4 py-2 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileArchive className="w-4 h-4" />
              <span>ดาวน์โหลด ZIP ({stickers.length + 2} ไฟล์)</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Intro & Spec Banner */}
        <div className="bg-white border border-[#e6e6e6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-[#000000] flex items-center gap-2">
                <span>✂️ เครื่องมือตัดรูปสติกเกอร์ไลน์ครบวงจร</span>
                <span className="text-xs font-normal text-[#a39e98]">(pleng.online/line)</span>
              </h2>
              <p className="text-xs text-[#615d59] leading-relaxed">
                อัปโหลดรูปภาพแบบกริด 2x2 จำนวน 10 ภาพ (หรือตามต้องการ) ระบบจะตัดแบ่งออกเป็น 4 รูปย่อยให้อัตโนมัติ (10 รูป = 40 สติกเกอร์) 
                พร้อมลบสีพื้นหลังให้โปร่งใส และปรับขนาดตรงตามข้อกำหนดของ LINE Creators Market 100%
              </p>
            </div>

            <a
              href="https://creator.line.me/th/guideline/sticker/"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs text-[#0075de] hover:underline flex items-center gap-1 font-medium"
            >
              <span>คู่มือสเปก LINE</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* LINE Specifications Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#f0eee9] text-xs">
            <div className="p-2.5 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] space-y-0.5">
              <p className="font-bold text-[#000000]">สติกเกอร์ 40 รูป</p>
              <p className="text-[11px] text-[#615d59]">01.png - 40.png</p>
              <p className="text-[10px] text-[#06C755] font-semibold">กว้างxสูง ไม่เกิน 370x320 (Margin 10px)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] space-y-0.5">
              <p className="font-bold text-[#000000]">รูปหลัก (Main)</p>
              <p className="text-[11px] text-[#615d59]">main.png</p>
              <p className="text-[10px] text-[#0075de] font-semibold">ขนาดเป๊ะ 240 x 240 px</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] space-y-0.5">
              <p className="font-bold text-[#000000]">ไอคอนแท็บ (Tab)</p>
              <p className="text-[11px] text-[#615d59]">tab.png</p>
              <p className="text-[10px] text-amber-600 font-semibold">ขนาดเป๊ะ 96 x 74 px</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] space-y-0.5">
              <p className="font-bold text-[#000000]">รูปแบบไฟล์</p>
              <p className="text-[11px] text-[#615d59]">PNG โปร่งใส (Transparent)</p>
              <p className="text-[10px] text-purple-600 font-semibold">RGB, ขนาดพิกเซลคู่ (Even W/H)</p>
            </div>
          </div>
        </div>

        {/* SECTION 1: UPLOAD 2x2 GRID IMAGES */}
        <section className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-[#0075de]">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#000000]">1. อัปโหลดภาพกริด 2x2 (ต้นฉบับสติกเกอร์)</h3>
                <p className="text-xs text-[#615d59]">
                  เลือกภาพที่มี 4 สติกเกอร์ใน 1 รูป (อัปโหลด 10 รูป จะได้ครบ 40 สติกเกอร์)
                </p>
              </div>
            </div>

            {gridImages.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างทั้งหมด</span>
              </button>
            )}
          </div>

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-[#dcdad7] hover:border-[#0075de] hover:bg-blue-50/20 rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer space-y-3 bg-[#faf9f8]"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#e6e6e6] text-[#0075de] shadow-xs flex items-center justify-center mx-auto">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-[#000000]">
                คลิกเลือกรูปภาพ หรือลากไฟล์ภาพกริด 2x2 มาวางที่นี่
              </p>
              <p className="text-[11px] text-[#615d59]">
                รองรับไฟล์ PNG, JPG, WebP (สามารถเลือกพร้อมกันได้หลายรูปจนครบ 10 รูป)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
            />
          </div>

          {/* Uploaded Grid Preview List */}
          {gridImages.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#000000]">
                  ภาพที่อัปโหลดแล้ว ({gridImages.length} รูป = ได้ {gridImages.length * 4} สติกเกอร์)
                </span>
                <span className="text-[#615d59]">
                  {gridImages.length >= 10
                    ? '🎉 ครบ 10 รูป (40 สติกเกอร์) ตามมาตรฐาน LINE แล้ว!'
                    : `ขาดอีก ${10 - gridImages.length} รูป เพื่อให้ครบ 40 สติกเกอร์`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2.5">
                {gridImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden border border-[#e6e6e6] bg-[#f6f5f4] aspect-square shadow-2xs"
                  >
                    <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                    {/* Grid overlay 2x2 hint */}
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
                      <div className="border-r border-b border-white/50" />
                      <div className="border-b border-white/50" />
                      <div className="border-r border-white/50" />
                      <div />
                    </div>
                    {/* Badge */}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-mono">
                      #{idx + 1}
                    </span>
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGridImage(img.id);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                      title="ลบรูปนี้"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: BACKGROUND REMOVAL & CROPPING CONTROLS */}
        <section className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-[#06C755]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#000000]">2. ตั้งค่าการลบพื้นหลัง (Background Removal)</h3>
              <p className="text-xs text-[#615d59]">
                เลือกลบสีพื้นหลังของรูป (เช่น สีชมพู Magenta ตามรูปตัวอย่าง) และปรับความเนียนของขอบ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Color Selection */}
            <div className="p-4 rounded-xl bg-[#faf9f8] border border-[#e6e6e6] space-y-3">
              <label className="block text-xs font-bold text-[#000000]">
                สีพื้นหลังที่ต้องการลบ (Target Color)
              </label>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border border-black/10 shadow-xs shrink-0 cursor-pointer relative overflow-hidden"
                  style={{ backgroundColor: targetColor.hex }}
                >
                  <input
                    type="color"
                    value={targetColor.hex}
                    onChange={(e) => {
                      const hex = e.target.value;
                      const r = parseInt(hex.slice(1, 3), 16);
                      const g = parseInt(hex.slice(3, 5), 16);
                      const b = parseInt(hex.slice(5, 7), 16);
                      setTargetColor({ r, g, b, hex });
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>

                <div className="flex-1 space-y-0.5">
                  <p className="font-mono text-xs font-bold text-[#000000] uppercase">{targetColor.hex}</p>
                  <p className="text-[10px] text-[#615d59]">RGB({targetColor.r}, {targetColor.g}, {targetColor.b})</p>
                </div>

                <button
                  type="button"
                  onClick={triggerEyedropper}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-[#e6e6e6] text-[#31302e] hover:bg-[#f6f5f4] text-xs font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="ดูดสีจากหน้าจอ"
                >
                  <Pipette className="w-3.5 h-3.5 text-[#0075de]" />
                  <span className="text-[11px]">ดูดสี</span>
                </button>
              </div>

              {/* Preset Color Swatches */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-[#615d59]">สีพบบ่อย:</span>
                {[
                  { name: 'Magenta (ตามรูป)', hex: '#e00096', r: 224, g: 0, b: 150 },
                  { name: 'Green Screen', hex: '#00ff00', r: 0, g: 255, b: 0 },
                  { name: 'White', hex: '#ffffff', r: 255, g: 255, b: 255 },
                  { name: 'Black', hex: '#000000', r: 0, g: 0, b: 0 },
                ].map((swatch) => (
                  <button
                    key={swatch.hex}
                    onClick={() => setTargetColor(swatch)}
                    title={swatch.name}
                    className="w-5 h-5 rounded-full border border-black/15 cursor-pointer shadow-2xs hover:scale-110 transition-transform"
                    style={{ backgroundColor: swatch.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Tolerance & Feathering Sliders */}
            <div className="p-4 rounded-xl bg-[#faf9f8] border border-[#e6e6e6] space-y-3.5">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#000000]">ความคลาดเคลื่อนสี (Tolerance)</span>
                  <span className="font-mono text-[#0075de] font-bold">{tolerance}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="70"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
                  className="w-full accent-[#0075de] cursor-pointer"
                />
                <p className="text-[10px] text-[#615d59]">
                  ค่าเริ่มต้น ~24% หากยังมีขอบสีติดอยู่ให้เลื่อนเพิ่มขึ้น
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#000000]">ความเนียนขอบ (Feathering)</span>
                  <span className="font-mono text-[#0075de] font-bold">{feather}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={feather}
                  onChange={(e) => setFeather(parseInt(e.target.value, 10))}
                  className="w-full accent-[#0075de] cursor-pointer"
                />
                <p className="text-[10px] text-[#615d59]">
                  เกลี่ยขอบให้นุ่มเนียนเป็นธรรมชาติ ไม่เป็นรอยหยัก
                </p>
              </div>
            </div>

            {/* Removal Mode & Sizing Options */}
            <div className="p-4 rounded-xl bg-[#faf9f8] border border-[#e6e6e6] space-y-3">
              <label className="block text-xs font-bold text-[#000000]">
                โหมดการตัดขอบ & มาตรฐาน LINE
              </label>

              <div className="space-y-2">
                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="bgMode"
                    checked={bgMode === 'floodfill'}
                    onChange={() => setBgMode('floodfill')}
                    className="mt-0.5 accent-[#06C755]"
                  />
                  <div>
                    <span className="font-semibold text-[#000000]">ลบจากขอบนอก (Flood-Fill)</span>
                    <p className="text-[10px] text-[#615d59]">
                      แนะนำ 👍 ป้องกันสีบนตัวการ์ตูนหรือข้อความไม่ให้ถูกลบไปด้วย
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="bgMode"
                    checked={bgMode === 'global'}
                    onChange={() => setBgMode('global')}
                    className="mt-0.5 accent-[#06C755]"
                  />
                  <div>
                    <span className="font-semibold text-[#000000]">ลบสีทั้งรูป (Global Key)</span>
                    <p className="text-[10px] text-[#615d59]">
                      ลบทุกพิกเซลที่สีตรงกัน ทั้งด้านนอกและซอกใน
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2 border-t border-[#e6e6e6]">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fixedCanvasSize}
                    onChange={(e) => setFixedCanvasSize(e.target.checked)}
                    className="accent-[#06C755] rounded"
                  />
                  <span className="text-[11px] text-[#31302e]">
                    ล็อกขนาด Canvas สติกเกอร์ที่ <strong>370 x 320 px</strong> (แนะนำสำหรับ LINE)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Process Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#615d59]">
              {gridImages.length === 0
                ? 'กรุณาอัปโหลดภาพกริด 2x2 ก่อนกดเริ่มประมวลผล'
                : `พร้อมตัดภาพ ${gridImages.length} รูป ออกเป็น ${gridImages.length * 4} สติกเกอร์`}
            </p>

            <button
              onClick={handleProcessAll}
              disabled={isProcessing || gridImages.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0075de] hover:bg-[#005bab] disabled:opacity-40 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{processStatusText || 'กำลังประมวลผล...'} ({processProgress}%)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    ตัดภาพ 2x2 & ลบพื้นหลังทันที ({gridImages.length * 4 || 0} รูป)
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div className="w-full bg-[#f6f5f4] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#0075de] h-full transition-all duration-300 rounded-full"
                style={{ width: `${processProgress}%` }}
              />
            </div>
          )}
        </section>

        {/* SECTION 3: STICKER RESULTS & EXPORT GALLERY */}
        {stickers.length > 0 && (
          <section className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0eee9]">
              <div>
                <h3 className="text-sm font-bold text-[#000000] flex items-center gap-2">
                  <span>3. แกลเลอรีสติกเกอร์ที่พร้อมใช้งาน</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
                    {stickers.length} สติกเกอร์ + main.png + tab.png
                  </span>
                </h3>
                <p className="text-xs text-[#615d59] mt-0.5">
                  ตรวจสอบความโปร่งใส เลือกรูปที่ต้องการตั้งเป็น Main และ Tab หรือดาวน์โหลด ZIP ทั้งชุด
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleProcessAll}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#e6e6e6] text-[#31302e] hover:bg-[#f6f5f4] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="ประมวลผลใหม่ด้วยค่าตั้งปัจจุบัน"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>รีเฟรชการลบพื้นหลัง</span>
                </button>

                <button
                  onClick={handleDownloadZip}
                  className="px-4 py-2 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FileArchive className="w-4 h-4" />
                  <span>ดาวน์โหลด ZIP ({stickers.length + 2} ไฟล์)</span>
                </button>
              </div>
            </div>

            {/* Special LINE Images: main.png and tab.png */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#faf9f8] border border-[#e6e6e6]">
              {/* main.png card */}
              <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-[#e6e6e6] shadow-2xs">
                <div
                  className="w-20 h-20 rounded-xl overflow-hidden border border-[#e6e6e6] shrink-0 checkerboard-bg flex items-center justify-center p-1"
                >
                  {mainDataUrl && (
                    <img src={mainDataUrl} alt="main.png" className="max-w-full max-h-full object-contain" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-xs text-[#000000]">main.png (รูปหลักร้านค้า)</span>
                  </div>
                  <p className="text-[11px] text-[#615d59]">
                    ขนาด: <strong className="text-[#0075de]">240 x 240 px</strong>
                  </p>
                  <p className="text-[10px] text-[#a39e98] truncate">
                    ใช้สติกเกอร์รูปที่ #{mainStickerIndex + 1}
                  </p>
                </div>
                <button
                  onClick={() => mainDataUrl && handleDownloadSingle(mainDataUrl, 'main.png')}
                  className="p-2 rounded-lg bg-[#f6f5f4] hover:bg-[#e6e6e6] text-[#31302e] transition-colors cursor-pointer"
                  title="ดาวน์โหลด main.png"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* tab.png card */}
              <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-[#e6e6e6] shadow-2xs">
                <div
                  className="w-20 h-20 rounded-xl overflow-hidden border border-[#e6e6e6] shrink-0 checkerboard-bg flex items-center justify-center p-1"
                >
                  {tabDataUrl && (
                    <img src={tabDataUrl} alt="tab.png" className="max-w-full max-h-full object-contain" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                    <span className="font-bold text-xs text-[#000000]">tab.png (ไอคอนแท็บห้องแชท)</span>
                  </div>
                  <p className="text-[11px] text-[#615d59]">
                    ขนาด: <strong className="text-purple-600">96 x 74 px</strong>
                  </p>
                  <p className="text-[10px] text-[#a39e98] truncate">
                    ใช้สติกเกอร์รูปที่ #{tabStickerIndex + 1}
                  </p>
                </div>
                <button
                  onClick={() => tabDataUrl && handleDownloadSingle(tabDataUrl, 'tab.png')}
                  className="p-2 rounded-lg bg-[#f6f5f4] hover:bg-[#e6e6e6] text-[#31302e] transition-colors cursor-pointer"
                  title="ดาวน์โหลด tab.png"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 40 Stickers Grid Display */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#000000]">รายการสติกเกอร์ทั้งหมด ({stickers.length} รูป)</span>
                <span className="text-[11px] text-[#615d59]">
                  💡 คลิก ⭐ เพื่อเลือกเป็น main.png หรือคลิก 📑 เพื่อเลือกเป็น tab.png
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
                {stickers.map((stk, idx) => {
                  const filename = `${(idx + 1).toString().padStart(2, '0')}.png`;
                  const isMain = idx === mainStickerIndex;
                  const isTab = idx === tabStickerIndex;

                  return (
                    <div
                      key={stk.id}
                      className={`relative group rounded-xl border bg-white overflow-hidden transition-all shadow-2xs hover:shadow-xs flex flex-col ${
                        isMain
                          ? 'border-amber-400 ring-2 ring-amber-400/30'
                          : isTab
                          ? 'border-purple-400 ring-2 ring-purple-400/30'
                          : 'border-[#e6e6e6]'
                      }`}
                    >
                      {/* Image Preview with Checkerboard */}
                      <div
                        onClick={() => setPreviewSticker({ url: stk.processedDataUrl, title: filename })}
                        className="aspect-square w-full checkerboard-bg p-2 flex items-center justify-center cursor-pointer relative"
                        title="คลิกเพื่อดูรูปขนาดเต็ม"
                      >
                        <img
                          src={stk.processedDataUrl}
                          alt={filename}
                          className="max-w-full max-h-full object-contain filter drop-shadow-xs"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-1 left-1 flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded-md bg-black/75 text-white font-mono text-[9px] font-bold">
                            {filename}
                          </span>
                        </div>

                        {/* Status Badges */}
                        <div className="absolute top-1 right-1 flex items-center gap-0.5">
                          {isMain && (
                            <span className="px-1 py-0.5 rounded-md bg-amber-500 text-white text-[8px] font-bold shadow-xs">
                              MAIN
                            </span>
                          )}
                          {isTab && (
                            <span className="px-1 py-0.5 rounded-md bg-purple-600 text-white text-[8px] font-bold shadow-xs">
                              TAB
                            </span>
                          )}
                        </div>

                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMainStickerIndex(idx);
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isMain
                                ? 'bg-amber-500 text-white'
                                : 'bg-white/90 hover:bg-white text-[#31302e]'
                            }`}
                            title="ตั้งเป็น Main (รูปหลัก)"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTabStickerIndex(idx);
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isTab
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/90 hover:bg-white text-[#31302e]'
                            }`}
                            title="ตั้งเป็น Tab (ไอคอนแท็บ)"
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadSingle(stk.processedDataUrl, filename);
                            }}
                            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-[#31302e] transition-colors cursor-pointer"
                            title={`ดาวน์โหลด ${filename}`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="p-1.5 border-t border-[#f0eee9] text-center bg-[#faf9f8] flex items-center justify-between px-2">
                        <span className="text-[10px] font-mono text-[#615d59]">
                          {fixedCanvasSize ? '370x320' : 'Auto'}
                        </span>
                        <span className="text-[9px] text-[#06C755] font-semibold">Margin 10px</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Big Download Bar */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2 justify-center sm:justify-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ไฟล์ชุดสติกเกอร์ครบ {stickers.length + 2} ไฟล์พร้อมอัปโหลดแล้ว!</span>
                </h4>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  ในไฟล์ ZIP จะประกอบด้วย 01.png - {stickers.length.toString().padStart(2, '0')}.png, main.png และ tab.png ตรงตามกฎของ LINE ทุกประการ
                </p>
              </div>

              <button
                onClick={handleDownloadZip}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด ZIP ครบ {stickers.length + 2} ไฟล์</span>
              </button>
            </div>
          </section>
        )}

        {/* SECTION 4: STEP-BY-STEP LINE CREATORS MARKET GUIDE */}
        <section className="bg-white border border-[#e6e6e6] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0075de]" />
            <h3 className="text-xs font-bold text-[#000000]">วิธีนำไฟล์ไปอัปโหลดขึ้น LINE Creators Market</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] space-y-1">
              <span className="font-bold text-[#0075de]">ขั้นตอนที่ 1</span>
              <p className="font-semibold text-[#000000]">ดาวน์โหลดไฟล์ ZIP จากเว็บนี้</p>
              <p className="text-[11px] text-[#615d59]">
                กดปุ่มดาวน์โหลด ZIP ระบบจะรวม 01.png-40.png + main.png + tab.png ให้ครบถ้วน
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] space-y-1">
              <span className="font-bold text-[#0075de]">ขั้นตอนที่ 2</span>
              <p className="font-semibold text-[#000000]">เข้าเว็บ creator.line.me</p>
              <p className="text-[11px] text-[#615d59]">
                เข้าสู่ระบบด้วย LINE Account ของคุณ แล้วไปที่หน้า "สร้างรายการใหม่" เลือก "สติกเกอร์ (Stickers)"
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] space-y-1">
              <span className="font-bold text-[#0075de]">ขั้นตอนที่ 3</span>
              <p className="font-semibold text-[#000000]">อัปโหลดไฟล์ ZIP ทั้งก้อนได้ทันที</p>
              <p className="text-[11px] text-[#615d59]">
                ที่แท็บ "รูปสติกเกอร์" กดปุ่ม "อัปโหลด ZIP แพ็กเกจ" ระบบของ LINE จะดึงสติกเกอร์เข้าที่ให้อัตโนมัติ!
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Full-size preview modal */}
      {previewSticker && (
        <div
          onClick={() => setPreviewSticker(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-4 max-w-md w-full shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold font-mono text-sm text-[#000000]">{previewSticker.title}</span>
              <button
                onClick={() => setPreviewSticker(null)}
                className="text-xs text-[#615d59] hover:text-[#000000] cursor-pointer"
              >
                ปิด ✕
              </button>
            </div>

            <div className="checkerboard-bg rounded-xl p-4 flex items-center justify-center min-h-[260px] border border-[#e6e6e6]">
              <img
                src={previewSticker.url}
                alt={previewSticker.title}
                className="max-w-full max-h-[340px] object-contain drop-shadow-md"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => handleDownloadSingle(previewSticker.url, previewSticker.title)}
                className="px-4 py-2 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดรูปนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Checkerboard Pattern for Transparency Preview */}
      <style>{`
        .checkerboard-bg {
          background-color: #ffffff;
          background-image: 
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 16px 16px;
          background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
        }
      `}</style>
    </div>
  );
};
