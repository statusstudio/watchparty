import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Star,
  Bookmark,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Sliders,
  Eye,
  Info,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Eraser,
  Undo2,
  Sparkles,
  Move,
  Scissors,
} from 'lucide-react';
import { PreviewBgColor, STICKER_SPECS, StickerItem, StickerType } from '../../types/sticker';
import {
  autoClearEnclosedGaps,
  brushEraseAtPoint,
  floodFillEraseAtPoint,
} from '../../services/stickerProcessor';

interface PreviewModalProps {
  sticker: StickerItem | null;
  stickers: StickerItem[];
  stickerType: StickerType;
  onClose: () => void;
  onSelectSticker: (sticker: StickerItem) => void;
  onSetMain: (id: string) => void;
  onSetTab: (id: string) => void;
  mainStickerId: string;
  tabStickerId: string;
  onUpdateSticker?: (sticker: StickerItem) => void;
}

export type EditTool = 'view' | 'magicWand' | 'eraser';

export const PreviewModal: React.FC<PreviewModalProps> = ({
  sticker,
  stickers,
  stickerType,
  onClose,
  onSelectSticker,
  onSetMain,
  onSetTab,
  mainStickerId,
  tabStickerId,
  onUpdateSticker,
}) => {
  const [bgType, setBgType] = useState<PreviewBgColor>('lineblue');
  const [customBg, setCustomBg] = useState('#849EBF');
  const [showMarginGuide, setShowMarginGuide] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Touch-up edit tools
  const [activeTool, setActiveTool] = useState<EditTool>('view');
  const [eraserRadius, setEraserRadius] = useState<number>(14);
  const [magicTolerance, setMagicTolerance] = useState<number>(25);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [isBrushing, setIsBrushing] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  const currentIndex = sticker ? stickers.findIndex((s) => s.id === sticker.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < stickers.length - 1;

  // Reset undo stack when switching sticker
  useEffect(() => {
    setUndoStack([]);
  }, [sticker?.id]);

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape, Ctrl+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sticker) return;
      if (e.key === 'ArrowLeft' && hasPrev && activeTool === 'view') {
        onSelectSticker(stickers[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && hasNext && activeTool === 'view') {
        onSelectSticker(stickers[currentIndex + 1]);
      } else if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sticker, currentIndex, stickers, hasPrev, hasNext, activeTool, onSelectSticker, onClose]);

  if (!sticker) return null;

  const spec = STICKER_SPECS[stickerType];
  const isMain = sticker.id === mainStickerId;
  const isTab = sticker.id === tabStickerId;

  const getBgStyle = () => {
    switch (bgType) {
      case 'white':
        return { backgroundColor: '#FFFFFF' };
      case 'black':
        return { backgroundColor: '#0A0F1D' };
      case 'darkgray':
        return { backgroundColor: '#2B3442' };
      case 'lineblue':
        return { backgroundColor: '#849EBF' };
      case 'green':
        return { backgroundColor: '#00B900' };
      case 'custom':
        return { backgroundColor: customBg };
      case 'checker':
      default:
        return {
          backgroundImage: `
            linear-gradient(45deg, #1e293b 25%, transparent 25%),
            linear-gradient(-45deg, #1e293b 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #1e293b 75%),
            linear-gradient(-45deg, transparent 75%, #1e293b 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          backgroundColor: '#0f172a',
        };
    }
  };

  const handleDownloadSingle = () => {
    const a = document.createElement('a');
    a.href = sticker.processedDataUrl;
    const num = (currentIndex + 1).toString().padStart(spec.namePattern === '001' ? 3 : 2, '0');
    a.download = `${num}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Touch swipe handlers (only in view mode)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTool !== 'view') return;
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (activeTool !== 'view' || touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;

    if (diff > 45 && hasPrev) {
      onSelectSticker(stickers[currentIndex - 1]);
    } else if (diff < -45 && hasNext) {
      onSelectSticker(stickers[currentIndex + 1]);
    }
    setTouchStartX(null);
  };

  // Convert screen coordinates to sticker canvas (370x320)
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!imgRef.current) return null;
    const rect = imgRef.current.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;
    const scaleX = sticker.width / rect.width;
    const scaleY = sticker.height / rect.height;

    return {
      x: clickX * scaleX,
      y: clickY * scaleY,
    };
  };

  // Handle Magic Wand Click (Tap to Erase Enclosed Cavity)
  const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTool !== 'magicWand' || !onUpdateSticker || isProcessingAction) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    try {
      setIsProcessingAction(true);
      setUndoStack((prev) => [...prev, sticker.processedDataUrl]);

      const res = await floodFillEraseAtPoint(
        sticker.processedDataUrl,
        coords.x,
        coords.y,
        magicTolerance
      );

      onUpdateSticker({
        ...sticker,
        processedDataUrl: res.processedDataUrl,
        mainDataUrl: res.mainDataUrl,
        tabDataUrl: res.tabDataUrl,
      });
    } catch (err) {
      console.error('Magic wand error:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Brush Erasing
  const handleBrushAt = async (clientX: number, clientY: number) => {
    if (activeTool !== 'eraser' || !onUpdateSticker) return;
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    try {
      const res = await brushEraseAtPoint(
        sticker.processedDataUrl,
        coords.x,
        coords.y,
        eraserRadius
      );

      onUpdateSticker({
        ...sticker,
        processedDataUrl: res.processedDataUrl,
        mainDataUrl: res.mainDataUrl,
        tabDataUrl: res.tabDataUrl,
      });
    } catch (err) {
      console.error('Brush erase error:', err);
    }
  };

  // Auto-clear all enclosed background gaps in 1 click
  const handleAutoClearAllGaps = async () => {
    if (!onUpdateSticker || !sticker.detectedBg || isProcessingAction) return;

    try {
      setIsProcessingAction(true);
      setUndoStack((prev) => [...prev, sticker.processedDataUrl]);

      const res = await autoClearEnclosedGaps(
        sticker.processedDataUrl,
        sticker.detectedBg,
        magicTolerance
      );

      onUpdateSticker({
        ...sticker,
        processedDataUrl: res.processedDataUrl,
        mainDataUrl: res.mainDataUrl,
        tabDataUrl: res.tabDataUrl,
      });
    } catch (err) {
      console.error('Auto clear gaps error:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Undo last touch-up
  const handleUndo = async () => {
    if (undoStack.length === 0 || !onUpdateSticker) return;
    const lastUrl = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));

    // Re-generate main and tab
    const { loadImage, generateMainImage, generateTabImage } = await import(
      '../../services/stickerProcessor'
    );
    const img = await loadImage(lastUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    onUpdateSticker({
      ...sticker,
      processedDataUrl: lastUrl,
      mainDataUrl: generateMainImage(canvas),
      tabDataUrl: generateTabImage(canvas),
    });
  };

  const displayNum = (currentIndex + 1).toString().padStart(spec.namePattern === '001' ? 3 : 2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              #{displayNum}.png
            </span>
            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white font-['Prompt'] truncate">
                  พรีวิวสติกเกอร์และตกแต่งซอกแขน
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 shrink-0">
                  {currentIndex + 1} / {stickers.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                สเปค: {spec.width}×{spec.height}px • มีเครื่องมือจิ้มลบช่องว่างระหว่างแขนโดยเฉพาะ
              </p>
            </div>
          </div>

          {/* Quick Prev / Next Buttons in Header & Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 bg-slate-800/90 rounded-xl p-1 border border-slate-700/80">
              <button
                onClick={() => hasPrev && onSelectSticker(stickers[currentIndex - 1])}
                disabled={!hasPrev}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="รูปก่อนหน้า (ปุ่มลูกศรซ้าย ←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-1 select-none">
                {currentIndex + 1}/{stickers.length}
              </span>
              <button
                onClick={() => hasNext && onSelectSticker(stickers[currentIndex + 1])}
                disabled={!hasNext}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="รูปถัดไป (ปุ่มลูกศรขวา →)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="ปิด (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
          {/* Touch-up Toolbar (แก้ปัญหาช่องว่างระหว่างแขน) */}
          <div className="p-2.5 sm:p-3 bg-slate-950/90 rounded-2xl border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-inner">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-emerald-400 font-['Prompt'] flex items-center gap-1 mr-1">
                <Scissors className="w-3.5 h-3.5" />
                <span>เครื่องมือเก็บรายละเอียด:</span>
              </span>

              {/* Tool 1: View / Pan */}
              <button
                onClick={() => setActiveTool('view')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  activeTool === 'view'
                    ? 'bg-slate-800 text-white border border-slate-600'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>เลื่อนดูปกติ</span>
              </button>

              {/* Tool 2: Magic Wand (Tap-to-Erase Gap) */}
              <button
                onClick={() => setActiveTool('magicWand')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm ${
                  activeTool === 'magicWand'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                }`}
                title="แตะจุดที่ต้องการลบ (เช่น ช่องว่างระหว่างแขน) เพื่อเจาะรูโปร่งใสทันที"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>จิ้มลบซอกแขน (Magic Wand)</span>
              </button>

              {/* Tool 3: Eraser Brush */}
              <button
                onClick={() => setActiveTool('eraser')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  activeTool === 'eraser'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="ใช้ยางลบระบายลบจุดที่ติดค้าง"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>ยางลบระบาย</span>
              </button>
            </div>

            {/* Quick 1-Click Clear All Gaps & Undo */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoClearAllGaps}
                disabled={isProcessingAction}
                className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 flex items-center gap-1 text-[11px] font-medium transition-colors"
                title="ระบบจะตรวจหาและลบทุกช่องว่างที่สีตรงกับพื้นหลังให้อัตโนมัติ"
              >
                <Sparkles className="w-3 h-3 text-teal-400" />
                <span>ลบทุกซอกอัตโนมัติ</span>
              </button>

              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 text-[11px] disabled:opacity-40 transition-colors"
                title="เลิกทำ (Ctrl+Z)"
              >
                <Undo2 className="w-3 h-3" />
                <span>เลิกทำ ({undoStack.length})</span>
              </button>
            </div>
          </div>

          {/* Tool Options Strip (Tolerance or Brush Radius) */}
          {activeTool === 'magicWand' && (
            <div className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl flex items-center justify-between text-[11px] text-emerald-300 animate-in fade-in">
              <div className="flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>แตะที่ช่องว่างระหว่างแขนหรือใต้ขาบนรูปภาพด้านล่างเพื่อลบให้โปร่งใสทันที</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span>ความกว้างสี:</span>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={magicTolerance}
                  onChange={(e) => setMagicTolerance(Number(e.target.value))}
                  className="w-20 accent-emerald-500 h-1 bg-slate-700 rounded"
                />
                <span className="font-mono">{magicTolerance}</span>
              </div>
            </div>
          )}

          {activeTool === 'eraser' && (
            <div className="px-3 py-1.5 bg-amber-950/40 border border-amber-500/20 rounded-xl flex items-center justify-between text-[11px] text-amber-300 animate-in fade-in">
              <div className="flex items-center gap-1.5">
                <Eraser className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>ลากเมาส์หรือปาดนิ้วเพื่อลบจุดตกค้าง</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span>ขนาดยางลบ:</span>
                {[8, 14, 24].map((r) => (
                  <button
                    key={r}
                    onClick={() => setEraserRadius(r)}
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      eraserRadius === r ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800'
                    }`}
                  >
                    {r}px
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview Controls Bar: BG color & Guides */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs">
            {/* Background Color Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">สีพื้นหลังทดสอบ:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'checker', label: 'ตาหมากรุก', bg: '#1e293b' },
                  { id: 'white', label: 'ขาว', bg: '#FFFFFF' },
                  { id: 'black', label: 'ดำ', bg: '#000000' },
                  { id: 'darkgray', label: 'เทาเข้ม', bg: '#334155' },
                  { id: 'lineblue', label: 'LINE Blue', bg: '#849EBF' },
                  { id: 'green', label: 'เขียว', bg: '#00B900' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setBgType(item.id as PreviewBgColor)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      bgType === item.id
                        ? 'border-emerald-400 scale-110 shadow-sm'
                        : 'border-slate-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: item.bg }}
                    title={item.label}
                  />
                ))}

                {/* Custom Color Picker */}
                <label
                  className={`w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center overflow-hidden transition-transform ${
                    bgType === 'custom' ? 'border-emerald-400 scale-110' : 'border-slate-700'
                  }`}
                  title="กำหนดสีพื้นหลังเอง"
                >
                  <input
                    type="color"
                    value={customBg}
                    onChange={(e) => {
                      setCustomBg(e.target.value);
                      setBgType('custom');
                    }}
                    className="opacity-0 w-full h-full cursor-pointer"
                  />
                  <div
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: customBg }}
                  />
                </label>
              </div>
            </div>

            {/* View Toggles & Zoom */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showMarginGuide}
                  onChange={(e) => setShowMarginGuide(e.target.checked)}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
                <span className="text-[11px]">เส้นขอบเซฟตี้ {spec.margin}px</span>
              </label>

              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => setZoomLevel(Math.max(0.75, zoomLevel - 0.25))}
                  className="p-1 text-slate-300 hover:text-white"
                  title="ย่อ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] text-emerald-400 px-1">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(Math.min(2.5, zoomLevel + 0.25))}
                  className="p-1 text-slate-300 hover:text-white"
                  title="ขยาย"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Large Canvas Viewport with Left/Right Navigation Chevrons & Swipe */}
          <div className="relative flex items-center justify-center">
            {/* Left Chevron Button */}
            <button
              onClick={() => hasPrev && onSelectSticker(stickers[currentIndex - 1])}
              disabled={!hasPrev}
              className={`absolute left-1 sm:-left-3 z-30 w-11 h-11 rounded-full bg-slate-900/85 hover:bg-slate-900 border border-slate-700/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-90 ${
                !hasPrev ? 'opacity-20 cursor-not-allowed' : 'hover:scale-105 hover:border-emerald-500'
              }`}
              title="รูปก่อนหน้า (←)"
            >
              <ChevronLeft className="w-6 h-6 text-emerald-400" />
            </button>

            {/* Sticker Canvas Area with Touch Gestures & Interactive Erase */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={(e) => {
                if (activeTool === 'eraser') {
                  setUndoStack((prev) => [...prev, sticker.processedDataUrl]);
                  setIsBrushing(true);
                  handleBrushAt(e.clientX, e.clientY);
                }
              }}
              onMouseMove={(e) => {
                if (activeTool === 'eraser' && isBrushing) {
                  handleBrushAt(e.clientX, e.clientY);
                }
              }}
              onMouseUp={() => setIsBrushing(false)}
              onMouseLeave={() => setIsBrushing(false)}
              className={`relative w-full max-w-[460px] mx-auto aspect-[370/320] rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center p-6 shadow-2xl transition-all select-none ${
                activeTool === 'magicWand'
                  ? 'cursor-crosshair'
                  : activeTool === 'eraser'
                  ? 'cursor-cell'
                  : 'cursor-grab active:cursor-grabbing'
              }`}
              style={getBgStyle()}
            >
              {/* Margin Safe Zone Boundary (Official LINE margin 10px / 2px) */}
              {showMarginGuide && (
                <div
                  className="absolute border border-dashed border-rose-400/80 pointer-events-none rounded-sm z-20 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                  style={{
                    top: `${(spec.margin / spec.height) * 100}%`,
                    bottom: `${(spec.margin / spec.height) * 100}%`,
                    left: `${(spec.margin / spec.width) * 100}%`,
                    right: `${(spec.margin / spec.width) * 100}%`,
                  }}
                >
                  <span className="absolute -top-4 left-1 text-[9px] font-mono text-rose-300 bg-rose-950/80 px-1 rounded">
                    LINE Safe Margin: {spec.margin}px
                  </span>
                </div>
              )}

              {/* Sticker Image */}
              <img
                ref={imgRef}
                src={sticker.processedDataUrl}
                alt={`Sticker #${displayNum}`}
                onClick={handleImageClick}
                className="max-w-full max-h-full object-contain drop-shadow-xl select-none transition-transform pointer-events-auto"
                style={{ transform: `scale(${zoomLevel})` }}
              />

              {/* Status Badges Overlay */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20 pointer-events-none">
                {isMain && spec.hasMain && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] shadow-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-slate-950" />
                    <span>MAIN</span>
                  </span>
                )}
                {isTab && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-500 text-slate-950 font-bold text-[10px] shadow-md flex items-center gap-1">
                    <Bookmark className="w-3 h-3 fill-slate-950" />
                    <span>TAB</span>
                  </span>
                )}
                {sticker.quadrant && (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-900/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                    {sticker.quadrant}
                  </span>
                )}
              </div>
            </div>

            {/* Right Chevron Button */}
            <button
              onClick={() => hasNext && onSelectSticker(stickers[currentIndex + 1])}
              disabled={!hasNext}
              className={`absolute right-1 sm:-right-3 z-30 w-11 h-11 rounded-full bg-slate-900/85 hover:bg-slate-900 border border-slate-700/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-90 ${
                !hasNext ? 'opacity-20 cursor-not-allowed' : 'hover:scale-105 hover:border-emerald-500'
              }`}
              title="รูปถัดไป (→)"
            >
              <ChevronRight className="w-6 h-6 text-emerald-400" />
            </button>
          </div>

          {/* Swipe / Tool Hint */}
          <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
            {activeTool === 'magicWand' ? (
              <span className="text-emerald-400 font-medium">
                🪄 คลิก/แตะที่ซอกแขนหรือรูบนภาพ เพื่อเจาะให้โปร่งใสทันที
              </span>
            ) : activeTool === 'eraser' ? (
              <span className="text-amber-400 font-medium">
                🧹 ลากเมาส์หรือปาดนิ้วเพื่อลบรอยพื้นหลังที่ตกค้าง
              </span>
            ) : (
              <span>แตะปุ่มลูกศร หรือปัดนิ้วซ้าย-ขวาบนภาพ หรือกดปุ่ม ← / → บนคีย์บอร์ด</span>
            )}
          </div>

          {/* Horizontal Thumbnail Strip for rapid jumping */}
          {stickers.length > 1 && (
            <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {stickers.map((s, idx) => {
                  const isSelected = s.id === sticker.id;
                  const thumbNum = (idx + 1).toString().padStart(spec.namePattern === '001' ? 3 : 2, '0');
                  const sIsMain = s.id === mainStickerId;
                  const sIsTab = s.id === tabStickerId;

                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelectSticker(s)}
                      className={`relative shrink-0 w-13 h-13 rounded-xl border p-1 transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-400/40 scale-105'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                      title={`รูปที่ ${idx + 1}: ${thumbNum}.png`}
                    >
                      <img
                        src={s.processedDataUrl}
                        alt={`Thumb ${thumbNum}`}
                        className="w-full h-7 object-contain"
                      />
                      <span className={`text-[9px] font-mono leading-none mt-1 ${isSelected ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                        {thumbNum}
                      </span>
                      {sIsMain && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-slate-950" />
                      )}
                      {sIsTab && (
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-sky-400 rounded-full border border-slate-950" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {spec.hasMain && (
              <button
                onClick={() => onSetMain(sticker.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isMain
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isMain ? 'fill-slate-950' : ''}`} />
                <span>{isMain ? 'เป็น Main แล้ว' : 'ตั้งเป็น Main (240x240)'}</span>
              </button>
            )}

            <button
              onClick={() => onSetTab(sticker.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isTab
                  ? 'bg-sky-500 text-slate-950 font-semibold shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isTab ? 'fill-slate-950' : ''}`} />
              <span>{isTab ? 'เป็น Tab Icon แล้ว' : 'ตั้งเป็น Tab Icon (96x74)'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSingle}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>บันทึกรูปนี้ ({displayNum}.png)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
