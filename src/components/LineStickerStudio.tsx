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
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Palette,
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
  createCompositeSheet,
  LinePackageType,
  LINE_PACKAGE_SPECS,
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
  const [tolerance, setTolerance] = useState<number>(20);
  const [choke, setChoke] = useState<number>(1.2);
  const [removeShadows, setRemoveShadows] = useState<boolean>(true);
  const [defringe, setDefringe] = useState<boolean>(true);
  const [addWhiteStroke, setAddWhiteStroke] = useState<boolean>(false);
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [bgMode, setBgMode] = useState<'floodfill' | 'global'>('floodfill');
  const [fixedCanvasSize, setFixedCanvasSize] = useState<boolean>(true);
  const [packageType, setPackageType] = useState<LinePackageType>('standard');

  const handleSelectColorSwatch = (swatch: { name: string; hex: string; r: number; g: number; b: number }) => {
    setTargetColor(swatch);
    if (swatch.hex.toLowerCase() === '#ffffff') {
      setBgMode('floodfill');
      setChoke(0.5);
      setRemoveShadows(false);
    } else if (swatch.hex.toLowerCase() === '#e00096') {
      setBgMode('global');
      setChoke(1.2);
      setRemoveShadows(true);
    }
  };

  // Cached raw sliced stickers for instant re-processing when adjusting sliders
  const [rawSlices, setRawSlices] = useState<StickerSlice[]>([]);

  // Main & Tab sticker selection (indexes in stickers array)
  const [mainStickerIndex, setMainStickerIndex] = useState<number>(0);
  const [tabStickerIndex, setTabStickerIndex] = useState<number>(0);
  const [mainDataUrl, setMainDataUrl] = useState<string>('');
  const [tabDataUrl, setTabDataUrl] = useState<string>('');

  // Preview modal for full-size inspection with Next/Prev
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Gallery layout: '4x10' (default) or 'carousel'
  const [galleryLayout, setGalleryLayout] = useState<'4x10' | 'carousel'>('4x10');
  const carouselRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Background inspection color presets
  type InspectBgMode = 'checker' | 'white' | 'black' | 'dark' | 'line' | 'green' | 'custom';
  const [inspectBg, setInspectBg] = useState<InspectBgMode>('checker');
  const [customInspectColor, setCustomInspectColor] = useState<string>('#f5576c');

  // 4x10 Composite Sheet Modal
  const [compositeSheetDataUrl, setCompositeSheetDataUrl] = useState<string | null>(null);
  const [isGeneratingSheet, setIsGeneratingSheet] = useState(false);
  const [sheetBg, setSheetBg] = useState<string>('white');

  const getInspectBgStyle = (): { style: React.CSSProperties; className: string } => {
    if (inspectBg === 'checker') {
      return { style: {}, className: 'checkerboard-bg' };
    }
    const colors: Record<string, string> = {
      white: '#ffffff',
      black: '#000000',
      dark: '#1e1e1e',
      line: '#849ebf',
      green: '#00e676',
      custom: customInspectColor,
    };
    return {
      style: { backgroundColor: colors[inspectBg] || '#ffffff' },
      className: '',
    };
  };

  const handleExportCompositeSheet = async (bgChoice?: string) => {
    if (stickers.length === 0) return;
    setIsGeneratingSheet(true);
    try {
      const stickerUrls = stickers.map((s) => s.processedDataUrl);
      const choice = bgChoice !== undefined ? bgChoice : sheetBg;
      let exportBg = 'transparent';
      if (choice === 'white') exportBg = '#ffffff';
      else if (choice === 'black') exportBg = '#000000';
      else if (choice === 'line') exportBg = '#849ebf';
      else if (choice === 'current') {
        const cur = getInspectBgStyle();
        exportBg = (cur.style.backgroundColor as string) || 'transparent';
      }

      const sheetUrl = await createCompositeSheet(stickerUrls, {
        columns: 4,
        packageType,
        backgroundColor: exportBg,
        padding: 30,
        gapX: 20,
        gapY: 28,
        scale: 1.0,
      });
      setCompositeSheetDataUrl(sheetUrl);
    } catch (err) {
      console.error('Failed to export composite sheet', err);
    } finally {
      setIsGeneratingSheet(false);
    }
  };

  const handlePackageTypeChange = async (newType: LinePackageType) => {
    setPackageType(newType);
    if (rawSlices.length > 0) {
      setIsProcessing(true);
      setProcessProgress(0);
      setProcessStatusText(`กำลังปรับรูปแบบสติกเกอร์เป็น ${LINE_PACKAGE_SPECS[newType].name}...`);
      try {
        const options: RemoveBgOptions = {
          targetColor: { r: targetColor.r, g: targetColor.g, b: targetColor.b },
          autoSampleCorners: true,
          packageType: newType,
          tolerance,
          hueTolerance: 28,
          removeShadows,
          choke,
          defringe,
          addWhiteStroke,
          strokeWidth,
          mode: bgMode,
          margin: newType === 'emoji' ? 2 : 10,
          fixedCanvasSize,
        };
        const processedSlices: StickerSlice[] = [];
        for (let i = 0; i < rawSlices.length; i++) {
          const s = rawSlices[i];
          const processedUrl = await processStickerImage(s.dataUrl, options);
          processedSlices.push({
            ...s,
            processedDataUrl: processedUrl,
          });
          setProcessProgress(Math.round(((i + 1) / rawSlices.length) * 100));
        }
        setStickers(processedSlices);
      } catch (err) {
        console.error('Error switching package type:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Auto-scroll active thumbnail into view inside preview modal
  useEffect(() => {
    if (previewIndex !== null && activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [previewIndex]);

  // Keyboard navigation for preview modal (ArrowLeft / ArrowRight / Escape)
  useEffect(() => {
    if (previewIndex === null || stickers.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPreviewIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : stickers.length - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPreviewIndex((prev) => (prev !== null && prev < stickers.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPreviewIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewIndex, stickers.length]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -carouselRef.current.clientWidth * 0.75 : carouselRef.current.clientWidth * 0.75;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || stickers.length === 0) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        // Swiped left -> next
        setPreviewIndex((prev) => (prev !== null && prev < stickers.length - 1 ? prev + 1 : 0));
      } else {
        // Swiped right -> prev
        setPreviewIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : stickers.length - 1));
      }
    }
    touchStartX.current = null;
  };

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
    setRawSlices([]);

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
    setProcessStatusText('กำลังเตรียมภาพสติกเกอร์...');

    try {
      let currentSlices = rawSlices;

      // Step 1: Slice all grid images if not already sliced
      if (currentSlices.length !== gridImages.length * 4) {
        setProcessStatusText('กำลังตัดรูปภาพ 2x2 ออกเป็นสติกเกอร์ย่อย...');
        const allSlices: StickerSlice[] = [];
        for (let g = 0; g < gridImages.length; g++) {
          setProcessStatusText(`กำลังตัดภาพชุดที่ ${g + 1} / ${gridImages.length}...`);
          const slices = await slice2x2Grid(gridImages[g].dataUrl, g);
          allSlices.push(...slices);
        }
        currentSlices = allSlices;
        setRawSlices(allSlices);
      }

      // Step 2: Remove background and format each slice to LINE specs
      const options: RemoveBgOptions = {
        targetColor: { r: targetColor.r, g: targetColor.g, b: targetColor.b },
        autoSampleCorners: true,
        packageType,
        tolerance,
        hueTolerance: 28,
        removeShadows,
        choke,
        defringe,
        addWhiteStroke,
        strokeWidth,
        mode: bgMode,
        margin: packageType === 'emoji' ? 2 : 10,
        fixedCanvasSize,
      };

      const processedSlices: StickerSlice[] = [];
      const totalSlices = currentSlices.length;

      for (let i = 0; i < totalSlices; i++) {
        setProcessProgress(Math.round(((i + 1) / totalSlices) * 100));
        setProcessStatusText(`กำลังไดคัท & ลบขอบสีสติกเกอร์ที่ ${i + 1} / ${totalSlices}...`);

        const slice = currentSlices[i];
        const processedUrl = await processStickerImage(slice.dataUrl, options);
        processedSlices.push({
          ...slice,
          processedDataUrl: processedUrl,
        });
      }

      setStickers(processedSlices);
      setMainStickerIndex(0);
      setTabStickerIndex(0);
      setProcessStatusText('ไดคัท & ลบขอบสีเสร็จสมบูรณ์ 100%!');
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
          if (r > 215 && g > 215 && b > 215) {
            setBgMode('floodfill');
          }
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
    const spec = LINE_PACKAGE_SPECS[packageType];
    if (stickers.length === 0 || (spec.hasMain && !mainDataUrl) || !tabDataUrl) {
      alert('กรุณาประมวลผลสติกเกอร์ก่อนดาวน์โหลด');
      return;
    }

    try {
      const stickerUrls = stickers.map((s) => s.processedDataUrl);
      const zipBlob = await createLineStickerZip(
        stickerUrls,
        mainDataUrl,
        tabDataUrl,
        `line_${packageType}_${stickers.length}pcs.zip`,
        packageType
      );
      downloadBlob(zipBlob, `line_${packageType}_${stickers.length}pcs.zip`);
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
    setRawSlices([]);
    setStickers([]);
  };

  // Clear all
  const handleClearAll = () => {
    if (confirm('คุณต้องการล้างข้อมูลภาพทั้งหมดใช่หรือไม่?')) {
      setGridImages([]);
      setRawSlices([]);
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
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-[#000000]">LINE Sticker Studio</h1>
                <span className="px-2 py-0.5 rounded-full bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/20 text-[10px] font-bold">
                  LINE Creators Standard
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#0075de]/10 text-[#0075de] border border-[#0075de]/20 text-[10px] font-mono font-bold">
                  v2.5 DeepClean Pro
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-[#06C755]">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#000000]">
                  2. ตั้งค่าการไดคัท & ลบขอบสีอัจฉริยะ (Smart Matte & Defringe)
                </h3>
                <p className="text-xs text-[#615d59]">
                  ลบพื้นหลัง, ตัดเงาพื้นอัตโนมัติ, พร้อมลอกขอบสีชมพู/ม่วงและฟอกขอบขาวให้คมชัด
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0075de] text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>โหมดอัจฉริยะ: ตัดเงาพื้น + ลอกขอบม่วง</span>
            </div>
          </div>

          {/* Package Type Selector (Standard, Big Sticker, Emoji) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 via-blue-50/50 to-purple-50/60 border border-emerald-200/80 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <label className="text-xs font-bold text-[#000000] flex items-center gap-1.5">
                  <span>เลือกประเภทสติกเกอร์ LINE ที่ต้องการสร้าง</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    LINE Creators Market Specs
                  </span>
                </label>
                <p className="text-[11px] text-[#615d59]">
                  กำหนดขนาดภาพ, สัดส่วน, รูป Main/Tab และชื่อไฟล์อัตโนมัติตามมาตรฐานทางการของ LINE
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {(Object.keys(LINE_PACKAGE_SPECS) as LinePackageType[]).map((typeKey) => {
                const spec = LINE_PACKAGE_SPECS[typeKey];
                const isSelected = packageType === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => handlePackageTypeChange(typeKey)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-[#06C755] ring-2 ring-[#06C755]/25 shadow-xs'
                        : 'bg-white/80 hover:bg-white border-[#e6e6e6] hover:border-[#cccccc]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#000000] flex items-center gap-1.5">
                          {spec.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-[#f0eee9] text-[#615d59]'
                          }`}
                        >
                          {spec.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#615d59] leading-snug">{spec.description}</p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-[#f0eee9] flex items-center justify-between text-[10px] text-[#888580]">
                      <span>{spec.hasMain ? 'รวม main + tab' : 'ไม่มี main, รวม tab'}</span>
                      <span className="font-mono">{spec.filenamePad === 3 ? '001-040.png' : '01-40.png'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Color Selection */}
            <div className="p-4 rounded-xl bg-[#faf9f8] border border-[#e6e6e6] space-y-3">
              <label className="block text-xs font-bold text-[#000000]">
                สีพื้นหลังหลัก (Chroma Key Color)
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
                      if (r > 215 && g > 215 && b > 215) {
                        setBgMode('floodfill');
                      }
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
                    onClick={() => handleSelectColorSwatch(swatch)}
                    title={swatch.name}
                    className="w-5 h-5 rounded-full border border-black/15 cursor-pointer shadow-2xs hover:scale-110 transition-transform"
                    style={{ backgroundColor: swatch.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Choke & Tolerance Sliders */}
            <div className="p-4 rounded-xl bg-[#faf9f8] border border-[#e6e6e6] space-y-3.5">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#000000]">ลอกขอบสีส่วนเกิน (Choke / Defringe)</span>
                  <span className="font-mono text-[#0075de] font-bold">{choke.toFixed(1)}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3.0"
                  step="0.1"
                  value={choke}
                  onChange={(e) => setChoke(parseFloat(e.target.value))}
                  className="w-full accent-[#0075de] cursor-pointer"
                />
                <p className="text-[10px] text-[#615d59]">
                  หดขอบเข้ามากินขอบสีม่วง/ชมพูรอบตัวละครและผมออกให้เกลี้ยง (แนะนำ: 1.2px)
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#000000]">ความคลาดเคลื่อนสี (Tolerance)</span>
                  <span className="font-mono text-[#0075de] font-bold">{tolerance}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
                  className="w-full accent-[#0075de] cursor-pointer"
                />
                <p className="text-[10px] text-[#615d59]">
                  ค่าเริ่มต้น ~20% ระบบจะดูดสีจาก 4 มุมของแต่ละรูปให้อัตโนมัติ
                </p>
              </div>
            </div>

            {/* Smart Removal Options & White Outline */}
            <div className="p-4 rounded-xl bg-[#faf9f8] border border-[#e6e6e6] space-y-2.5">
              <label className="block text-xs font-bold text-[#000000]">
                ฟังก์ชันปรับแต่งอัจฉริยะ (Smart Enhancements)
              </label>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeShadows}
                    onChange={(e) => setRemoveShadows(e.target.checked)}
                    className="accent-[#06C755] rounded"
                  />
                  <div>
                    <span className="font-semibold text-[#000000]">ตัดเงาพื้นอัจฉริยะ (Remove Shadows)</span>
                    <p className="text-[10px] text-[#615d59]">ลบแถบเงาเข้มที่พื้นใต้เท้าตัวการ์ตูน 100%</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defringe}
                    onChange={(e) => setDefringe(e.target.checked)}
                    className="accent-[#06C755] rounded"
                  />
                  <div>
                    <span className="font-semibold text-[#000000]">ล้างคราบสีตก & ขอบม่วง (Defringe)</span>
                    <p className="text-[10px] text-[#615d59]">ล้างคราบม่วงบนผม หมวก เสื้อผ้า และขอบขาว</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addWhiteStroke}
                    onChange={(e) => setAddWhiteStroke(e.target.checked)}
                    className="accent-[#0075de] rounded"
                  />
                  <div>
                    <span className="font-semibold text-[#0075de]">เพิ่มขอบขาวสติกเกอร์ LINE (White Stroke)</span>
                    <p className="text-[10px] text-[#615d59]">เพิ่มเส้นขอบขาวไดคัทรอบตัวการ์ตูนสไตล์ LINE</p>
                  </div>
                </label>

                {addWhiteStroke && (
                  <div className="pl-6 pt-1 flex items-center gap-2 text-xs">
                    <span className="text-[11px] text-[#615d59]">ความหนาขอบ:</span>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
                      className="w-24 accent-[#0075de]"
                    />
                    <span className="font-mono text-[#0075de] font-bold text-[11px]">{strokeWidth}px</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#e6e6e6] space-y-2">
                <label className="block text-[11px] font-bold text-[#000000]">
                  ขอบเขตการลบพื้นหลัง (Removal Mode)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setBgMode('floodfill')}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      bgMode === 'floodfill'
                        ? 'bg-emerald-50 border-[#06C755] ring-1 ring-[#06C755] text-emerald-950 shadow-2xs'
                        : 'bg-white border-[#e6e6e6] text-[#615d59] hover:bg-[#faf9f8]'
                    }`}
                  >
                    <div className="font-bold text-[11px] flex items-center gap-1 text-[#000000]">
                      <span>🛡️ ลบจากขอบนอก (Flood Fill)</span>
                    </div>
                    <p className="text-[10px] text-[#615d59] mt-0.5 leading-snug">
                      แนะนำสำหรับพื้นขาว: ปกป้องเนื้อสีขาวในตัวหนังสือ ลายเสื้อ ดวงตา และผม
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgMode('global')}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      bgMode === 'global'
                        ? 'bg-emerald-50 border-[#06C755] ring-1 ring-[#06C755] text-emerald-950 shadow-2xs'
                        : 'bg-white border-[#e6e6e6] text-[#615d59] hover:bg-[#faf9f8]'
                    }`}
                  >
                    <div className="font-bold text-[11px] flex items-center gap-1 text-[#000000]">
                      <span>🌐 ลบทุกจุด (Global Chroma)</span>
                    </div>
                    <p className="text-[10px] text-[#615d59] mt-0.5 leading-snug">
                      เหมาะกับพื้นเขียว/ชมพู: ลบสีเป้าหมายทั่วทั้งภาพรวมถึงช่องว่างระหว่างแขน
                    </p>
                  </button>
                </div>

                {targetColor.r > 215 && targetColor.g > 215 && targetColor.b > 215 && (
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-[10px] text-blue-800 leading-snug flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>ตรวจพบพื้นหลังสีขาว:</strong> ระบบเปิดโหมดปกป้องเนื้อภาพ (Flood Fill) ให้อัตโนมัติ เพื่อป้องกันไม่ให้สีขาวในผม ลายเสื้อ และตัวหนังสือ กลายเป็นรูโหว่โปร่งใส
                    </span>
                  </div>
                )}

                <label className="flex items-center gap-2 text-xs cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={fixedCanvasSize}
                    onChange={(e) => setFixedCanvasSize(e.target.checked)}
                    className="accent-[#06C755] rounded"
                  />
                  <span className="text-[11px] text-[#31302e]">
                    ล็อกขนาด Canvas ตามมาตรฐาน (<strong>{LINE_PACKAGE_SPECS[packageType].badge}</strong>)
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

            <div className="flex items-center gap-2 w-full sm:w-auto">
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
                      {stickers.length > 0
                        ? `ไดคัท & อัปเดตใหม่ทันที (${stickers.length} รูป)`
                        : `ตัดภาพ 2x2 & ลบพื้นหลังทันที (${gridImages.length * 4 || 0} รูป)`}
                    </span>
                  </>
                )}
              </button>
            </div>
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
                    {stickers.length} {LINE_PACKAGE_SPECS[packageType].hasMain ? 'สติกเกอร์ + main.png + tab.png' : 'อิโมจิ + tab.png'}
                  </span>
                </h3>
                <p className="text-xs text-[#615d59] mt-0.5">
                  {LINE_PACKAGE_SPECS[packageType].hasMain
                    ? 'ตรวจสอบความโปร่งใส เลือกรูปที่ต้องการตั้งเป็น Main และ Tab หรือดาวน์โหลด ZIP ทั้งชุด'
                    : 'ตรวจสอบความโปร่งใส เลือกรูปที่ต้องการตั้งเป็น Tab หรือดาวน์โหลด ZIP ทั้งชุด'}
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
                  <span>ดาวน์โหลด ZIP ({stickers.length + (LINE_PACKAGE_SPECS[packageType].hasMain ? 2 : 1)} ไฟล์)</span>
                </button>
              </div>
            </div>

            {/* Special LINE Images: main.png and tab.png */}
            <div className={`grid ${LINE_PACKAGE_SPECS[packageType].hasMain ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-xl mx-auto'} gap-4 p-4 rounded-xl bg-[#faf9f8] border border-[#e6e6e6]`}>
              {/* main.png card - only for packages requiring main image */}
              {LINE_PACKAGE_SPECS[packageType].hasMain && (
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
              )}

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

            {/* 40 Stickers Grid / Carousel Display */}
            <div className="space-y-3">
              {/* Top Controls: Layout, Background Inspection, and Export 4x10 */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#000000]">รายการสติกเกอร์ทั้งหมด ({stickers.length} รูป)</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#0075de]/10 text-[#0075de] text-[10px] font-bold">
                        {galleryLayout === '4x10' ? 'มุมมอง 4x10 แถว (แนะนำ)' : 'สไลด์เลื่อนซ้าย-ขวา'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#615d59] mt-0.5">
                      💡 คลิกที่รูปเพื่อเปิดดูขนาดใหญ่พร้อมกดเลื่อนซ้าย-ขวา (Arrow Keys ◀ ▶) ได้ทันที
                    </p>
                  </div>

                  {/* Actions: Layout Switcher + Export Sheet */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleExportCompositeSheet()}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="รวม 40 รูปเป็นแผ่นเดียว 4 คอลัมน์ x 10 แถว"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Export แผ่นรวม 4x10</span>
                    </button>

                    <div className="flex items-center gap-1 bg-[#f6f5f4] p-1 rounded-xl border border-[#e6e6e6]">
                      <button
                        type="button"
                        onClick={() => setGalleryLayout('4x10')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          galleryLayout === '4x10'
                            ? 'bg-white text-[#0075de] shadow-xs'
                            : 'text-[#615d59] hover:text-[#000000]'
                        }`}
                        title="แสดงแบบ 4 คอลัมน์ x 10 แถว (ตามมาตรฐาน)"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>4x10 แถว</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGalleryLayout('carousel')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          galleryLayout === 'carousel'
                            ? 'bg-white text-[#0075de] shadow-xs'
                            : 'text-[#615d59] hover:text-[#000000]'
                        }`}
                        title="แสดงแบบสไลด์เลื่อนซ้าย-ขวา"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>สไลด์ซ้าย-ขวา</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Background Color Inspection Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#faf9f8] border border-[#e6e6e6]">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#0075de]" />
                    <span className="text-xs font-bold text-[#000000]">สีพื้นหลังตรวจสอบสีรั่ว:</span>
                    <span className="text-[11px] text-[#615d59] hidden md:inline">
                      (เปลี่ยนสีพื้นเพื่อเช็คขอบม่วง แสงสะท้อน หรือเงาตกค้าง)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {/* Checkerboard (Transparent) */}
                    <button
                      type="button"
                      onClick={() => setInspectBg('checker')}
                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        inspectBg === 'checker'
                          ? 'bg-white border-[#0075de] text-[#0075de] ring-2 ring-[#0075de]/20 shadow-xs'
                          : 'bg-white border-[#e6e6e6] text-[#615d59] hover:text-[#000000]'
                      }`}
                      title="ตารางหมากรุก (โปร่งใส)"
                    >
                      <span className="w-3.5 h-3.5 rounded border border-[#ccc] checkerboard-bg inline-block" />
                      <span>โปร่งใส</span>
                    </button>

                    {/* White */}
                    <button
                      type="button"
                      onClick={() => setInspectBg('white')}
                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        inspectBg === 'white'
                          ? 'bg-white border-[#0075de] text-[#0075de] ring-2 ring-[#0075de]/20 shadow-xs'
                          : 'bg-white border-[#e6e6e6] text-[#615d59] hover:text-[#000000]'
                      }`}
                      title="พื้นขาว (เช็คคราบเงาและสีเข้มตกค้าง)"
                    >
                      <span className="w-3.5 h-3.5 rounded border border-[#ddd] bg-white inline-block" />
                      <span>สีขาว</span>
                    </button>

                    {/* Black */}
                    <button
                      type="button"
                      onClick={() => setInspectBg('black')}
                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        inspectBg === 'black'
                          ? 'bg-white border-[#0075de] text-[#0075de] ring-2 ring-[#0075de]/20 shadow-xs'
                          : 'bg-white border-[#e6e6e6] text-[#615d59] hover:text-[#000000]'
                      }`}
                      title="พื้นดำ (เช็คขอบขาวและขอบม่วงฟุ้ง)"
                    >
                      <span className="w-3.5 h-3.5 rounded bg-black inline-block" />
                      <span>สีดำ</span>
                    </button>

                    {/* Dark Gray */}
                    <button
                      type="button"
                      onClick={() => setInspectBg('dark')}
                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        inspectBg === 'dark'
                          ? 'bg-white border-[#0075de] text-[#0075de] ring-2 ring-[#0075de]/20 shadow-xs'
                          : 'bg-white border-[#e6e6e6] text-[#615d59] hover:text-[#000000]'
                      }`}
                      title="สีเทาเข้ม (#1e1e1e)"
                    >
                      <span className="w-3.5 h-3.5 rounded bg-[#1e1e1e] inline-block" />
                      <span>เทาเข้ม</span>
                    </button>

                    {/* LINE Chat Blue */}
                    <button
                      type="button"
                      onClick={() => setInspectBg('line')}
                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        inspectBg === 'line'
                          ? 'bg-white border-[#0075de] text-[#0075de] ring-2 ring-[#0075de]/20 shadow-xs'
                          : 'bg-white border-[#e6e6e6] text-[#615d59] hover:text-[#000000]'
                      }`}
                      title="สีแชท LINE ยอดนิยม (#849ebf)"
                    >
                      <span className="w-3.5 h-3.5 rounded bg-[#849ebf] inline-block" />
                      <span>แชท LINE</span>
                    </button>

                    {/* Green */}
                    <button
                      type="button"
                      onClick={() => setInspectBg('green')}
                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        inspectBg === 'green'
                          ? 'bg-white border-[#0075de] text-[#0075de] ring-2 ring-[#0075de]/20 shadow-xs'
                          : 'bg-white border-[#e6e6e6] text-[#615d59] hover:text-[#000000]'
                      }`}
                      title="สีเขียวสะท้อนแสง"
                    >
                      <span className="w-3.5 h-3.5 rounded bg-[#00e676] inline-block" />
                      <span>เขียวสด</span>
                    </button>

                    {/* Custom Color */}
                    <label
                      className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        inspectBg === 'custom'
                          ? 'bg-white border-[#0075de] text-[#0075de] ring-2 ring-[#0075de]/20 shadow-xs'
                          : 'bg-white border-[#e6e6e6] text-[#615d59] hover:text-[#000000]'
                      }`}
                      title="เลือกสีพื้นหลังเอง"
                    >
                      <input
                        type="color"
                        value={customInspectColor}
                        onChange={(e) => {
                          setCustomInspectColor(e.target.value);
                          setInspectBg('custom');
                        }}
                        className="w-3.5 h-3.5 rounded cursor-pointer border-0 p-0"
                      />
                      <span>เลือกสี</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Render Cards according to selected layout */}
              {(() => {
                const inspectBgStyle = getInspectBgStyle();

                return galleryLayout === 'carousel' ? (
                  <div className="relative group/carousel">
                    <button
                      type="button"
                      onClick={() => scrollCarousel('left')}
                      className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-white/95 hover:bg-white text-[#31302e] shadow-md border border-[#e6e6e6] transition-all hover:scale-110 cursor-pointer hidden sm:flex items-center justify-center"
                      title="เลื่อนซ้าย"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#31302e]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCarousel('right')}
                      className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-white/95 hover:bg-white text-[#31302e] shadow-md border border-[#e6e6e6] transition-all hover:scale-110 cursor-pointer hidden sm:flex items-center justify-center"
                      title="เลื่อนขวา"
                    >
                      <ChevronRight className="w-5 h-5 text-[#31302e]" />
                    </button>

                    {/* Mobile Controls */}
                    <div className="flex sm:hidden justify-between items-center pb-2">
                      <button
                        type="button"
                        onClick={() => scrollCarousel('left')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#e6e6e6] text-xs font-semibold flex items-center gap-1 text-[#31302e] cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>เลื่อนซ้าย</span>
                      </button>
                      <span className="text-[11px] text-[#615d59]">ปัดซ้าย-ขวาได้</span>
                      <button
                        type="button"
                        onClick={() => scrollCarousel('right')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#e6e6e6] text-xs font-semibold flex items-center gap-1 text-[#31302e] cursor-pointer"
                      >
                        <span>เลื่อนขวา</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div
                      ref={carouselRef}
                      className="overflow-x-auto flex gap-3 pb-3 pt-1 scroll-smooth snap-x snap-mandatory"
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      {stickers.map((stk, idx) => {
                        const spec = LINE_PACKAGE_SPECS[packageType];
                        const filename = `${(idx + 1).toString().padStart(spec.filenamePad, '0')}.png`;
                        const isMain = spec.hasMain && idx === mainStickerIndex;
                        const isTab = idx === tabStickerIndex;

                        return (
                          <div
                            key={stk.id}
                            className={`relative group rounded-xl border bg-white overflow-hidden transition-all shadow-2xs hover:shadow-xs flex flex-col min-w-[160px] sm:min-w-[190px] shrink-0 snap-start ${
                              isMain
                                ? 'border-amber-400 ring-2 ring-amber-400/30'
                                : isTab
                                ? 'border-purple-400 ring-2 ring-purple-400/30'
                                : 'border-[#e6e6e6]'
                            }`}
                          >
                            <div
                              onClick={() => setPreviewIndex(idx)}
                              style={inspectBgStyle.style}
                              className={`aspect-square w-full ${inspectBgStyle.className} p-2 flex items-center justify-center cursor-pointer relative transition-colors`}
                              title="คลิกเพื่อดูรูปขนาดเต็มพร้อมเลื่อนซ้าย-ขวา"
                            >
                              <img
                                src={stk.processedDataUrl}
                                alt={filename}
                                className="max-w-full max-h-full object-contain filter drop-shadow-xs"
                              />
                              <div className="absolute top-1 left-1 flex items-center gap-1">
                                <span className="px-1.5 py-0.5 rounded-md bg-black/75 text-white font-mono text-[9px] font-bold">
                                  {filename}
                                </span>
                              </div>
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
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                {spec.hasMain && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMainStickerIndex(idx);
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      isMain ? 'bg-amber-500 text-white' : 'bg-white/90 hover:bg-white text-[#31302e]'
                                    }`}
                                    title="ตั้งเป็น Main (รูปหลัก)"
                                  >
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTabStickerIndex(idx);
                                  }}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isTab ? 'bg-purple-600 text-white' : 'bg-white/90 hover:bg-white text-[#31302e]'
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
                            <div className="p-1.5 border-t border-[#f0eee9] text-center bg-[#faf9f8] flex items-center justify-between px-2">
                              <span className="text-[10px] font-mono text-[#615d59]">
                                {fixedCanvasSize ? spec.badge : 'Auto'}
                              </span>
                              <span className="text-[9px] text-[#06C755] font-semibold">
                                {packageType === 'emoji' ? 'Margin 0-2px' : 'Margin 10px'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
                    {stickers.map((stk, idx) => {
                      const spec = LINE_PACKAGE_SPECS[packageType];
                      const filename = `${(idx + 1).toString().padStart(spec.filenamePad, '0')}.png`;
                      const isMain = spec.hasMain && idx === mainStickerIndex;
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
                          <div
                            onClick={() => setPreviewIndex(idx)}
                            style={inspectBgStyle.style}
                            className={`aspect-square w-full ${inspectBgStyle.className} p-2 flex items-center justify-center cursor-pointer relative transition-colors`}
                            title="คลิกเพื่อดูรูปขนาดเต็มพร้อมเลื่อนซ้าย-ขวา"
                          >
                            <img
                              src={stk.processedDataUrl}
                              alt={filename}
                              className="max-w-full max-h-full object-contain filter drop-shadow-xs"
                            />
                            <div className="absolute top-1 left-1 flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded-md bg-black/75 text-white font-mono text-[9px] font-bold">
                                {filename}
                              </span>
                            </div>
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
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              {spec.hasMain && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMainStickerIndex(idx);
                                  }}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isMain ? 'bg-amber-500 text-white' : 'bg-white/90 hover:bg-white text-[#31302e]'
                                  }`}
                                  title="ตั้งเป็น Main (รูปหลัก)"
                                >
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTabStickerIndex(idx);
                                }}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isTab ? 'bg-purple-600 text-white' : 'bg-white/90 hover:bg-white text-[#31302e]'
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
                          <div className="p-1.5 border-t border-[#f0eee9] text-center bg-[#faf9f8] flex items-center justify-between px-2">
                            <span className="text-[10px] font-mono text-[#615d59]">
                              {fixedCanvasSize ? spec.badge : 'Auto'}
                            </span>
                            <span className="text-[9px] text-[#06C755] font-semibold">
                              {packageType === 'emoji' ? 'Margin 0-2px' : 'Margin 10px'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Bottom Big Download Bar */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2 justify-center sm:justify-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    ไฟล์ชุด{packageType === 'emoji' ? 'อิโมจิ' : 'สติกเกอร์'}ครบ {stickers.length + (LINE_PACKAGE_SPECS[packageType].hasMain ? 2 : 1)} ไฟล์พร้อมอัปโหลดแล้ว!
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  {packageType === 'emoji'
                    ? `ในไฟล์ ZIP จะประกอบด้วย 001.png - ${(stickers.length).toString().padStart(3, '0')}.png และ tab.png ตรงตามกฎ LINE Emoji ทุกประการ`
                    : `ในไฟล์ ZIP จะประกอบด้วย 01.png - ${(stickers.length).toString().padStart(2, '0')}.png, main.png และ tab.png ตรงตามกฎของ LINE ทุกประการ`}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleExportCompositeSheet()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="รวม 40 รูปเป็นแผ่นเดียว 4 คอลัมน์ x 10 แถว"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Export แผ่นรวม 4x10 (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadZip}
                  className="px-5 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด ZIP ครบ {stickers.length + (LINE_PACKAGE_SPECS[packageType].hasMain ? 2 : 1)} ไฟล์</span>
                </button>
              </div>
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

      {/* Full-size preview modal with Left / Right Navigation */}
      {previewIndex !== null && stickers[previewIndex] && (() => {
        const spec = LINE_PACKAGE_SPECS[packageType];
        const curStk = stickers[previewIndex];
        const filename = `${(previewIndex + 1).toString().padStart(spec.filenamePad, '0')}.png`;
        const isMain = spec.hasMain && previewIndex === mainStickerIndex;
        const isTab = previewIndex === tabStickerIndex;

        return (
          <div
            onClick={() => setPreviewIndex(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-4 sm:p-5 max-w-lg w-full shadow-2xl space-y-3.5 flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-sm sm:text-base text-[#000000]">{filename}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#f6f5f4] text-[#615d59] font-mono text-[11px] font-bold border border-[#e6e6e6]">
                    {previewIndex + 1} / {stickers.length}
                  </span>
                  {isMain && (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold">
                      MAIN
                    </span>
                  )}
                  {isTab && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[9px] font-bold">
                      TAB
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewIndex(null)}
                  className="p-1.5 rounded-lg text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4] transition-colors cursor-pointer text-xs font-semibold"
                  title="ปิด (Esc)"
                >
                  ✕ ปิด
                </button>
              </div>

              {/* Main Preview with Floating Left & Right Arrows */}
              <div
                style={getInspectBgStyle().style}
                className={`relative ${getInspectBgStyle().className} rounded-xl p-4 sm:p-6 flex items-center justify-center min-h-[280px] sm:min-h-[340px] border border-[#e6e6e6] overflow-hidden select-none transition-colors`}
              >
                {/* Left Arrow Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : stickers.length - 1));
                  }}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-2.5 rounded-full bg-white/90 hover:bg-white text-[#31302e] shadow-md border border-[#e6e6e6] transition-all hover:scale-110 cursor-pointer flex items-center justify-center"
                  title="ภาพก่อนหน้า (กดแป้น ◀ บนคีย์บอร์ด)"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[#31302e]" />
                </button>

                {/* Sticker Image */}
                <img
                  src={curStk.processedDataUrl}
                  alt={filename}
                  className="max-w-full max-h-[280px] sm:max-h-[340px] object-contain drop-shadow-md transition-all"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                />

                {/* Right Arrow Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewIndex((prev) => (prev !== null && prev < stickers.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-2.5 rounded-full bg-white/90 hover:bg-white text-[#31302e] shadow-md border border-[#e6e6e6] transition-all hover:scale-110 cursor-pointer flex items-center justify-center"
                  title="ภาพต่อไป (กดแป้น ▶ บนคีย์บอร์ด)"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#31302e]" />
                </button>
              </div>

              {/* Action Bar (Set Main / Set Tab / Download) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#e6e6e6]">
                <div className="flex items-center gap-1.5">
                  {spec.hasMain && (
                    <button
                      type="button"
                      onClick={() => setMainStickerIndex(previewIndex)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isMain
                          ? 'bg-amber-500 text-white'
                          : 'bg-[#faf9f8] hover:bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6]'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{isMain ? 'เป็นรูป Main แล้ว' : 'ตั้งเป็น Main'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setTabStickerIndex(previewIndex)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isTab
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#faf9f8] hover:bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                    <span>{isTab ? 'เป็นรูป Tab แล้ว' : 'ตั้งเป็น Tab'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadSingle(curStk.processedDataUrl, filename)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0075de] hover:bg-[#005bab] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs ml-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด {filename}</span>
                </button>
              </div>

              {/* Mini Thumbnail Carousel Strip */}
              <div className="pt-2 border-t border-[#f0eee9] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#615d59]">
                  <span>เลือกดูรูปในชุด ({stickers.length} รูป)</span>
                  <span>กดปุ่มลูกศร ◀ ▶ หรือปัดจอเพื่อเปลี่ยนรูป</span>
                </div>
                <div
                  className="overflow-x-auto flex items-center gap-1.5 p-1.5 bg-[#f6f5f4] rounded-xl border border-[#e6e6e6]"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {stickers.map((stk, i) => {
                    const isCur = i === previewIndex;
                    const thumbName = `${(i + 1).toString().padStart(spec.filenamePad, '0')}.png`;
                    return (
                      <button
                        key={stk.id}
                        type="button"
                        ref={isCur ? activeThumbRef : null}
                        onClick={() => setPreviewIndex(i)}
                        className={`relative shrink-0 w-10 h-10 rounded-lg border overflow-hidden p-0.5 checkerboard-bg transition-all cursor-pointer ${
                          isCur
                            ? 'ring-2 ring-[#0075de] border-[#0075de] scale-105 shadow-xs'
                            : 'border-[#d8d8d8] opacity-60 hover:opacity-100'
                        }`}
                        title={thumbName}
                      >
                        <img src={stk.processedDataUrl} alt="" className="w-full h-full object-contain" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] text-white font-mono text-center">
                          {(i + 1).toString().padStart(spec.filenamePad, '0')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 4x10 Composite Sheet Preview & Download Modal */}
      {compositeSheetDataUrl && (
        <div
          onClick={() => setCompositeSheetDataUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#e6e6e6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#000000]">แผ่นรวมสติกเกอร์ 4x10 แถว ({stickers.length} รูป)</h3>
                  <p className="text-[11px] text-[#615d59]">ภาพรวมขนาดเต็มความละเอียดสูง เรียง 4 คอลัมน์ x 10 แถว</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCompositeSheetDataUrl(null)}
                className="p-1.5 rounded-lg text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4] cursor-pointer text-xs font-semibold"
              >
                ✕ ปิด
              </button>
            </div>

            {/* Background Selector for Re-export */}
            <div className="px-4 py-2.5 bg-[#faf9f8] border-b border-[#e6e6e6] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#615d59] font-medium">
                <span>เลือกสีพื้นหลังของแผ่น:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'white', label: 'พื้นขาว' },
                  { id: 'transparent', label: 'โปร่งใส' },
                  { id: 'black', label: 'พื้นดำ' },
                  { id: 'line', label: 'แชท LINE' },
                  { id: 'current', label: 'สีตรวจสอบปัจจุบัน' },
                ].map((bgItem) => (
                  <button
                    key={bgItem.id}
                    type="button"
                    disabled={isGeneratingSheet}
                    onClick={() => {
                      setSheetBg(bgItem.id);
                      handleExportCompositeSheet(bgItem.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      sheetBg === bgItem.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-[#31302e] border-[#e6e6e6] hover:bg-[#f6f5f4]'
                    }`}
                  >
                    {bgItem.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Area (Scrollable) */}
            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center checkerboard-bg min-h-[350px]">
              {isGeneratingSheet ? (
                <div className="flex flex-col items-center gap-2 p-8">
                  <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                  <span className="text-xs text-[#615d59] font-medium">กำลังรวมภาพ 4x10 แถว...</span>
                </div>
              ) : (
                <img
                  src={compositeSheetDataUrl}
                  alt="แผ่นรวมสติกเกอร์ 4x10"
                  className="max-w-full max-h-[58vh] object-contain shadow-md rounded-lg border border-[#e6e6e6]"
                />
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[#e6e6e6] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#faf9f8]">
              <span className="text-[11px] text-[#615d59]">
                จัดเรียง 4 คอลัมน์ 10 แถว รวม {stickers.length} รูป ความละเอียดสูง
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleDownloadSingle(compositeSheetDataUrl, `line_stickers_4x10_sheet_${sheetBg}.png`)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดภาพแผ่นรวม 4x10 (PNG)</span>
                </button>
              </div>
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
