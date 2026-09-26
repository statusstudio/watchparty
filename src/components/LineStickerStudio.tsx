import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Grid2X2,
  Sparkles,
  Download,
  BookOpen,
  Trash2,
  RefreshCw,
  AlertCircle,
  Eye,
  Sliders,
  CheckCircle2,
  Layers,
  Smartphone,
  Share2,
} from 'lucide-react';
import {
  DEFAULT_PARAMS,
  GridQuadrant,
  ProcessingParams,
  STICKER_SPECS,
  StickerItem,
  StickerType,
} from '../types/sticker';
import { processStickerImage } from '../services/stickerProcessor';
import { getSamplePresets, SampleSheetPreset } from '../services/sampleData';
import { extractImagesFromZip } from '../services/zipImport';
import { Header } from './line/Header';
import { UploadDropzone } from './line/UploadDropzone';
import { ParameterControls } from './line/ParameterControls';
import { StickerGrid } from './line/StickerGrid';
import { GridSlicerModal } from './line/GridSlicerModal';
import { PreviewModal } from './line/PreviewModal';
import { LineChatSimulator } from './line/LineChatSimulator';
import { ExportModal } from './line/ExportModal';
import { LineSpecsGuideModal } from './line/LineSpecsGuideModal';
import { BottomNav, NavTab } from './line/BottomNav';
import { Toast, ToastMessage } from './line/Toast';
import { ProgressBar } from './line/ProgressBar';
import { ExportTab } from './line/ExportTab';
import { CompositeSheetModal } from './line/CompositeSheetModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [stickerType, setStickerType] = useState<StickerType>('standard');
  const [stickers, setStickers] = useState<StickerItem[]>([]); // Clean initial state with 0 default stickers!
  const [params, setParams] = useState<ProcessingParams>(DEFAULT_PARAMS);
  const [mainStickerId, setMainStickerId] = useState<string>('');
  const [tabStickerId, setTabStickerId] = useState<string>('');
  const [previewBg, setPreviewBg] = useState<string>('checker');

  // Processing & Progress states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ percent: number; title: string; step?: string } | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Modals
  const [slicerData, setSlicerData] = useState<{
    isOpen: boolean;
    imageUrl: string;
    imageName: string;
  }>({
    isOpen: false,
    imageUrl: '',
    imageName: '',
  });

  const [previewSticker, setPreviewSticker] = useState<StickerItem | null>(null);
  const [isCompositeModalOpen, setIsCompositeModalOpen] = useState(false);
  const [isChatSimOpen, setIsChatSimOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSpecsGuideOpen, setIsSpecsGuideOpen] = useState(false);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({
      id: `${Date.now()}_${Math.random()}`,
      type,
      message,
    });
  };

  // Keep Main/Tab IDs in sync with stickers list
  useEffect(() => {
    if (stickers.length > 0) {
      if (!mainStickerId || !stickers.some((s) => s.id === mainStickerId)) {
        setMainStickerId(stickers[0].id);
      }
      if (!tabStickerId || !stickers.some((s) => s.id === tabStickerId)) {
        setTabStickerId(stickers[0].id);
      }
    } else {
      setMainStickerId('');
      setTabStickerId('');
    }
  }, [stickers, mainStickerId, tabStickerId]);

  /**
   * Process a single raw image through the 5-step background removal algorithm
   */
  const processImageToSticker = async (
    rawUrl: string,
    currentParams: ProcessingParams,
    currentType: StickerType,
    quadrant?: GridQuadrant,
    sourceName?: string
  ): Promise<StickerItem> => {
    const result = await processStickerImage(rawUrl, currentParams, currentType);
    const spec = STICKER_SPECS[currentType];

    return {
      id: `stk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      index: 1, // will be re-indexed
      originalDataUrl: rawUrl,
      processedDataUrl: result.processedDataUrl,
      mainDataUrl: result.mainDataUrl,
      tabDataUrl: result.tabDataUrl,
      quadrant,
      sourceImageName: sourceName,
      width: spec.width,
      height: spec.height,
      detectedBg: result.detectedBg,
      params: { ...currentParams },
      isMain: false,
      isTab: false,
      trimmedBounds: result.trimmedBounds,
      createdAt: Date.now(),
    };
  };

  /**
   * Handle Uploading ZIP File (Extract and batch import images)
   */
  const handleUploadZip = async (zipFile: File, isGrid2x2: boolean = false) => {
    if (stickers.length >= 40) {
      showToast('จำนวนสติกเกอร์ครบ 40 รูปแล้ว (ขีดจำกัดสูงสุดของ LINE)', 'info');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress({
        percent: 10,
        title: 'กำลังอ่านและคลายไฟล์ ZIP...',
        step: zipFile.name,
      });

      const extracted = await extractImagesFromZip(zipFile, (loaded, total, currentName) => {
        const pct = Math.round((loaded / total) * 35);
        setProgress({
          percent: pct,
          title: `กำลังแตกไฟล์รูปภาพ (${loaded}/${total})...`,
          step: currentName,
        });
      });

      if (extracted.length === 0) {
        showToast('ไม่พบไฟล์รูปภาพ (PNG/JPG/WEBP) ในไฟล์ ZIP นี้', 'error');
        setIsProcessing(false);
        setProgress(null);
        return;
      }

      const availableSlots = 40 - stickers.length;
      const newItems: StickerItem[] = [];

      for (let i = 0; i < extracted.length; i++) {
        if (stickers.length + newItems.length >= 40) break;

        const item = extracted[i];
        const pct = 35 + Math.round(((i + 1) / extracted.length) * 65);
        setProgress({
          percent: pct,
          title: `กำลังประมวลผลรูปที่ ${i + 1}/${extracted.length}...`,
          step: isGrid2x2 ? `ตัดแบ่ง 2x2 Grid: ${item.name}` : `5-Step Background Removal: ${item.name}`,
        });

        if (isGrid2x2) {
          // Slice each image extracted from the ZIP into 4 quadrants
          const { slice2x2Grid } = await import('../services/stickerProcessor');
          const res = await slice2x2Grid(item.dataUrl, 0.5, 0.5);
          const quads: GridQuadrant[] = ['TL', 'TR', 'BL', 'BR'];

          for (const quad of quads) {
            if (stickers.length + newItems.length >= 40) break;
            const sliceSticker = await processImageToSticker(
              res[quad],
              params,
              stickerType,
              quad,
              `${item.name}_${quad}`
            );
            newItems.push(sliceSticker);
          }
        } else {
          // Single image mode
          const sticker = await processImageToSticker(item.dataUrl, params, stickerType, undefined, item.name);
          newItems.push(sticker);
        }
      }

      setStickers((prev) => {
        const combined = [...prev, ...newItems].slice(0, 40);
        return combined.map((s, idx) => ({ ...s, index: idx + 1 }));
      });

      showToast(`นำเข้าสำเร็จ ${newItems.length} รูปจากไฟล์ ZIP (${isGrid2x2 ? 'ตัด 2x2 Grid' : 'ภาพเดี่ยว'})!`, 'success');
      setActiveTab('preview');
    } catch (err) {
      console.error('Error importing ZIP file:', err);
      showToast('เกิดข้อผิดพลาดในการนำเข้าไฟล์ ZIP', 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(null), 500);
    }
  };

  /**
   * Handle user upload of multiple images or single 2x2 grid
   */
  const handleUploadFiles = async (files: File[], isGrid2x2: boolean) => {
    if (stickers.length >= 40) {
      showToast('จำนวนสติกเกอร์ครบ 40 รูปแล้ว (ขีดจำกัดสูงสุดของ LINE)', 'info');
      return;
    }

    if (files.length === 0) return;

    // Single file in 2x2 grid mode -> open interactive 2x2 cutter
    if (files.length === 1 && isGrid2x2) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setSlicerData({
          isOpen: true,
          imageUrl: e.target?.result as string,
          imageName: file.name,
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    // Batch upload of multiple images
    try {
      setIsProcessing(true);
      const availableSlots = 40 - stickers.length;
      const filesToProcess = files.slice(0, availableSlots);
      const newItems: StickerItem[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const pct = Math.round(((i + 1) / filesToProcess.length) * 100);
        setProgress({
          percent: pct,
          title: `กำลังประมวลผลภาพ ${i + 1}/${filesToProcess.length}...`,
          step: file.name,
        });

        // Read file as dataUrl
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        if (isGrid2x2) {
          // Auto-slice 2x2 grid into 4 pieces
          const { slice2x2Grid } = await import('../services/stickerProcessor');
          const res = await slice2x2Grid(dataUrl, 0.5, 0.5);
          const quads: GridQuadrant[] = ['TL', 'TR', 'BL', 'BR'];

          for (const quad of quads) {
            if (stickers.length + newItems.length >= 40) break;
            const sliceSticker = await processImageToSticker(res[quad], params, stickerType, quad, file.name);
            newItems.push(sliceSticker);
          }
        } else {
          // Single image
          const singleSticker = await processImageToSticker(dataUrl, params, stickerType, undefined, file.name);
          newItems.push(singleSticker);
        }
      }

      setStickers((prev) => {
        const combined = [...prev, ...newItems].slice(0, 40);
        return combined.map((s, idx) => ({ ...s, index: idx + 1 }));
      });

      showToast(`นำเข้ารูปภาพสำเร็จ ${newItems.length} รูป!`, 'success');
      setActiveTab('preview');
    } catch (err) {
      console.error('Error importing batch images:', err);
      showToast('เกิดข้อผิดพลาดในการนำเข้ารูปภาพ', 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(null), 500);
    }
  };

  /**
   * Handle Slices Confirmation from 2x2 Grid Slicer Modal
   */
  const handleConfirmSlices = async (slices: { TL: string; TR: string; BL: string; BR: string }) => {
    setSlicerData((prev) => ({ ...prev, isOpen: false }));
    setIsProcessing(true);

    try {
      const quads: GridQuadrant[] = ['TL', 'TR', 'BL', 'BR'];
      const newItems: StickerItem[] = [];

      for (let i = 0; i < quads.length; i++) {
        const quad = quads[i];
        const percent = Math.round(((i + 1) / quads.length) * 100);
        setProgress({
          percent,
          title: `กำลังลบพื้นหลังชิ้นที่ ${i + 1}/4 (${quad})...`,
          step: `ขั้นที่ 1-5: Auto-detect, Floodfill, Choke, Defringe, Trim`,
        });

        const sliceUrl = slices[quad];
        const item = await processImageToSticker(sliceUrl, params, stickerType, quad, slicerData.imageName);
        newItems.push(item);
      }

      setStickers((prev) => {
        const combined = [...prev, ...newItems].slice(0, 40);
        return combined.map((s, idx) => ({ ...s, index: idx + 1 }));
      });

      showToast('ตัดภาพ 2x2 และลบพื้นหลังสำเร็จ 4 สติกเกอร์!', 'success');
      setActiveTab('preview');
    } catch (err) {
      console.error('Error cutting 2x2 slices:', err);
      showToast('เกิดข้อผิดพลาดในการตัดภาพ 2x2', 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(null), 500);
    }
  };

  /**
   * Handle sample 2x2 preset selection
   */
  const loadSamplePreset = async (preset: SampleSheetPreset, notify: boolean = true) => {
    setIsProcessing(true);

    try {
      const { slice2x2Grid } = await import('../services/stickerProcessor');

      setProgress({
        percent: 25,
        title: `กำลังโหลด ${preset.titleTh}...`,
        step: 'แบ่งภาพ 2x2 กึ่งกลาง (TL, TR, BL, BR)',
      });

      const res = await slice2x2Grid(preset.dataUrl, 0.5, 0.5);

      const quads: GridQuadrant[] = ['TL', 'TR', 'BL', 'BR'];
      const newItems: StickerItem[] = [];

      for (let i = 0; i < quads.length; i++) {
        const quad = quads[i];
        const percent = 25 + Math.round(((i + 1) / quads.length) * 75);
        setProgress({
          percent,
          title: `กำลังประมวลผล 5 ขั้นตอน (${quad})...`,
          step: `Choke ${params.choke}px • Defringe ${params.defringe ? 'เปิด' : 'ปิด'}`,
        });

        const sliceUrl = res[quad];
        const item = await processImageToSticker(sliceUrl, params, stickerType, quad, preset.id);
        newItems.push(item);
      }

      setStickers((prev) => {
        const combined = [...prev, ...newItems].slice(0, 40);
        return combined.map((s, idx) => ({ ...s, index: idx + 1 }));
      });

      if (notify) {
        showToast(`โหลด ${preset.titleTh} สำเร็จ 4 รูป`, 'success');
        setActiveTab('preview');
      }
    } catch (err) {
      console.error('Error loading sample preset:', err);
      if (notify) showToast('เกิดข้อผิดพลาดในการโหลดตัวอย่าง', 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(null), 500);
    }
  };

  /**
   * Reprocess all stickers with current params and sticker type
   */
  const handleReprocessAll = async () => {
    if (stickers.length === 0) return;

    setIsProcessing(true);
    try {
      const updatedList: StickerItem[] = [];
      for (let i = 0; i < stickers.length; i++) {
        const s = stickers[i];
        const percent = Math.round(((i + 1) / stickers.length) * 100);
        setProgress({
          percent,
          title: `กำลังประมวลผล #${i + 1}/${stickers.length}...`,
          step: `Tolerance: ${params.tolerance} • Choke: ${params.choke}px`,
        });

        const reprocessed = await processImageToSticker(
          s.originalDataUrl,
          params,
          stickerType,
          s.quadrant,
          s.sourceImageName
        );
        updatedList.push({
          ...reprocessed,
          id: s.id,
          isMain: s.id === mainStickerId,
          isTab: s.id === tabStickerId,
        });
      }

      setStickers(updatedList.map((s, idx) => ({ ...s, index: idx + 1 })));
      showToast(`ประมวลผลสติกเกอร์ใหม่ทั้งหมด ${stickers.length} รูปเรียบร้อย`, 'success');
    } catch (err) {
      console.error('Error reprocessing all stickers:', err);
      showToast('เกิดข้อผิดพลาดในการประมวลผล', 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(null), 500);
    }
  };

  /**
   * Reprocess a single sticker
   */
  const handleReprocessSingle = async (sticker: StickerItem) => {
    setIsProcessing(true);
    setProgress({
      percent: 50,
      title: `กำลังประมวลผลสติกเกอร์ #${sticker.index}...`,
      step: '5-Step Pipeline',
    });

    try {
      const reprocessed = await processImageToSticker(
        sticker.originalDataUrl,
        params,
        stickerType,
        sticker.quadrant,
        sticker.sourceImageName
      );

      setStickers((prev) =>
        prev.map((s) => (s.id === sticker.id ? { ...reprocessed, id: s.id, index: s.index } : s))
      );
      showToast(`ประมวลผลสติกเกอร์ #${sticker.index} เรียบร้อย`, 'success');
    } catch (err) {
      console.error('Error reprocessing single sticker:', err);
      showToast('เกิดข้อผิดพลาดในการประมวลผล', 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(null), 500);
    }
  };

  /**
   * Delete a sticker
   */
  const handleDeleteSticker = (id: string) => {
    setStickers((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, index: idx + 1 }));
    });
    showToast('ลบสติกเกอร์เรียบร้อยแล้ว', 'info');
  };

  /**
   * Clear all stickers
   */
  const handleClearAll = () => {
    if (confirm('คุณต้องการลบสติกเกอร์ทั้งหมดในชุดหรือไม่?')) {
      setStickers([]);
      setMainStickerId('');
      setTabStickerId('');
      showToast('ลบสติกเกอร์ทั้งหมดแล้ว', 'info');
    }
  };

  // Ensure body and root don't trap scrolling when viewing LineStickerStudio
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-['Prompt',sans-serif] selection:bg-emerald-500 selection:text-white overflow-y-auto overflow-x-hidden">
      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Top Header */}
      <Header
        stickerType={stickerType}
        onSelectStickerType={(t) => {
          setStickerType(t);
          showToast(`เปลี่ยนขนาดเป็น ${STICKER_SPECS[t].nameTh}`, 'info');
        }}
        stickerCount={stickers.length}
        maxStickers={40}
        onOpenSpecsGuide={() => setIsSpecsGuideOpen(true)}
        onOpenExportModal={() => setActiveTab('export')}
        onOpenCodeExport={() => setIsCodeExportOpen(true)}
        onToggleChatSim={() => setIsChatSimOpen(!isChatSimOpen)}
        isChatSimOpen={isChatSimOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 pb-24 space-y-6">
        {/* Animated Progress Bar during processing */}
        {isProcessing && progress && (
          <ProgressBar
            percent={progress.percent}
            title={progress.title}
            stepDescription={progress.step}
          />
        )}

        {/* TAB 1: 🏠 หน้าหลัก (อัปโหลด + ตั้งค่า) */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Upload & Presets Dropzone */}
            <UploadDropzone
              onUploadFiles={handleUploadFiles}
              onUploadZip={handleUploadZip}
              onSelectSamplePreset={(preset) => loadSamplePreset(preset, true)}
              currentStickersCount={stickers.length}
              maxStickers={40}
            />

            {/* Parameter Tuning Controls */}
            <ParameterControls
              params={params}
              onChangeParams={(newP) => setParams(newP)}
              onReprocessAll={handleReprocessAll}
              isReprocessing={isProcessing}
              totalStickers={stickers.length}
            />

            {/* Quick summary link to preview */}
            {stickers.length > 0 && (
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      มีสติกเกอร์ในชุดแล้ว {stickers.length} รูป
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      ไปที่แท็บ Preview เพื่อตรวจสอบหรือเลือก main.png และ tab.png
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  ไปหน้า Preview &gt;
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 🎨 Preview (ดูสติกเกอร์ + เลือก main/tab) */}
        {activeTab === 'preview' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Top Toolbar in Preview Tab */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-white font-['Prompt']">
                  พรีวิวสติกเกอร์และจัดชุด ({stickers.length} / 40 รูป)
                </h3>
                <p className="text-xs text-slate-400">
                  คลิกที่สติกเกอร์เพื่อขยายดูรายละเอียด หรือตั้งเป็น Main / Tab
                </p>
              </div>

              {/* Background Color switcher & Chat Sim trigger */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsChatSimOpen(true)}
                  disabled={stickers.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ลองในห้องแชท LINE</span>
                </button>

                <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 text-[11px]">สีพื้นหลัง:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'checker', label: 'ตาหมากรุก', color: '#1e293b' },
                      { id: 'white', label: 'ขาว', color: '#ffffff' },
                      { id: 'lineblue', label: 'LINE Blue', color: '#849ebf' },
                      { id: 'black', label: 'ดำ', color: '#000000' },
                    ].map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setPreviewBg(bg.id)}
                        className={`w-5 h-5 rounded-full border transition-all ${
                          previewBg === bg.id
                            ? 'border-emerald-400 scale-110'
                            : 'border-slate-700 hover:scale-105'
                        }`}
                        style={{ backgroundColor: bg.color }}
                        title={bg.label}
                      />
                    ))}
                  </div>
                </div>

                {stickers.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl border border-slate-800 transition-colors"
                    title="ลบสติกเกอร์ทั้งหมด"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 4-Column Sticker Grid */}
            <StickerGrid
              stickers={stickers}
              stickerType={stickerType}
              mainStickerId={mainStickerId}
              tabStickerId={tabStickerId}
              onSetMain={(id) => {
                setMainStickerId(id);
                showToast('ตั้งเป็นรูปหลัก main.png (240x240) สำเร็จ', 'success');
              }}
              onSetTab={(id) => {
                setTabStickerId(id);
                showToast('ตั้งเป็นรูปแท็บ tab.png (96x74) สำเร็จ', 'success');
              }}
              onSelectPreview={(s) => setPreviewSticker(s)}
              onDeleteSticker={handleDeleteSticker}
              onReprocessSticker={handleReprocessSingle}
              previewBg={previewBg}
              onGoToHome={() => setActiveTab('home')}
            />

            {/* Bottom Proceed to Export CTA */}
            {stickers.length > 0 && (
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setActiveTab('export')}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>ไปที่หน้าส่งออกไฟล์ ZIP &gt;</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 📦 Export (ดาวน์โหลด ZIP & ภาพรวม) */}
        {activeTab === 'export' && (
          <div className="animate-in fade-in duration-150">
            <ExportTab
              stickers={stickers}
              stickerType={stickerType}
              mainStickerId={mainStickerId}
              tabStickerId={tabStickerId}
              onOpenCompositeModal={() => setIsCompositeModalOpen(true)}
              onShowToast={showToast}
            />
          </div>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar (3 Tabs) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
        stickerCount={stickers.length}
      />

      {/* Modals & Overlays */}
      <GridSlicerModal
        isOpen={slicerData.isOpen}
        onClose={() => setSlicerData((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={slicerData.imageUrl}
        imageName={slicerData.imageName}
        onConfirmSlices={handleConfirmSlices}
      />

      <PreviewModal
        sticker={previewSticker}
        stickers={stickers}
        stickerType={stickerType}
        onClose={() => setPreviewSticker(null)}
        onSelectSticker={(s) => setPreviewSticker(s)}
        onSetMain={(id) => {
          setMainStickerId(id);
          showToast('ตั้งเป็นรูปหลัก main.png สำเร็จ', 'success');
        }}
        onSetTab={(id) => {
          setTabStickerId(id);
          showToast('ตั้งเป็นรูปแท็บ tab.png สำเร็จ', 'success');
        }}
        mainStickerId={mainStickerId}
        tabStickerId={tabStickerId}
        onUpdateSticker={(updated) => {
          setStickers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          setPreviewSticker(updated);
          showToast('แก้ไขลบช่องว่างสำเร็จ', 'success');
        }}
      />

      <CompositeSheetModal
        isOpen={isCompositeModalOpen}
        onClose={() => setIsCompositeModalOpen(false)}
        stickers={stickers}
        stickerType={stickerType}
        onShowToast={showToast}
      />

      <LineChatSimulator
        isOpen={isChatSimOpen}
        onClose={() => setIsChatSimOpen(false)}
        stickers={stickers}
      />

      <LineSpecsGuideModal
        isOpen={isSpecsGuideOpen}
        onClose={() => setIsSpecsGuideOpen(false)}
      />

      {/* ReactNativeExportModal removed (not imported) */}
    </div>
  );
}
