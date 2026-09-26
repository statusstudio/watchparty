import React, { useRef, useState } from 'react';
import {
  Upload,
  Camera,
  Grid2X2,
  Image as ImageIcon,
  FileArchive,
  Sparkles,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { getSamplePresets, SampleSheetPreset } from '../../services/sampleData';

interface UploadDropzoneProps {
  onUploadFiles: (files: File[], isGrid2x2: boolean) => void;
  onUploadZip: (file: File, isGrid2x2: boolean) => void;
  onSelectSamplePreset: (preset: SampleSheetPreset) => void;
  currentStickersCount: number;
  maxStickers: number;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onUploadFiles,
  onUploadZip,
  onSelectSamplePreset,
  currentStickersCount,
  maxStickers,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isGridMode, setIsGridMode] = useState(false); // Default to single/batch image mode for large imports
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const samplePresets = getSamplePresets();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(Array.from(e.dataTransfer.files));
    }
  };

  const processFileList = (files: File[]) => {
    // Check if any file is a ZIP archive
    const zipFiles = files.filter(
      (f) =>
        f.name.toLowerCase().endsWith('.zip') ||
        f.type === 'application/zip' ||
        f.type === 'application/x-zip-compressed'
    );

    const imageFiles = files.filter(
      (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(f.name)
    );

    if (zipFiles.length > 0) {
      // Process first ZIP file with current isGridMode setting
      onUploadZip(zipFiles[0], isGridMode);
    } else if (imageFiles.length > 0) {
      onUploadFiles(imageFiles, isGridMode);
    }
  };

  const isFull = currentStickersCount >= maxStickers;

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center transition-all ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.008] shadow-2xl'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/60'
        }`}
      >
        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFileList(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
        <input
          ref={zipInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUploadZip(e.target.files[0], isGridMode);
            }
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFileList(Array.from(e.target.files));
            e.target.value = '';
          }}
        />

        <div className="max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600/20 to-teal-500/20 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white font-['Prompt']">
              ลากรูปภาพ หรือไฟล์ ZIP มาวางที่นี่
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              รองรับทั้งไฟล์ภาพเดี่ยวและไฟล์ <strong>.ZIP</strong> {isGridMode ? '(โหมดปัจจุบัน: จะตัดแบ่งภาพใน ZIP เป็น 2x2 Grid ให้อัตโนมัติ)' : '(โหมดปัจจุบัน: นำเข้าเป็นภาพเดี่ยว)'}
            </p>
          </div>

          {/* Slicing Mode Selector */}
          <div className="inline-flex items-center p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setIsGridMode(false)}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors font-medium ${
                !isGridMode
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>ภาพเดี่ยว (นำเข้าได้หลายรูปพร้อมกัน)</span>
            </button>
            <button
              onClick={() => setIsGridMode(true)}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors font-medium ${
                isGridMode
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid2X2 className="w-3.5 h-3.5" />
              <span>ภาพแบบ 2x2 Grid (4 ตัว/ภาพ)</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isFull}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4" />
              <span>เลือกรูปภาพ (หลายรูป)</span>
            </button>

            <button
              onClick={() => zipInputRef.current?.click()}
              disabled={isFull}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <FileArchive className="w-4 h-4" />
              <span>นำเข้าจากไฟล์ ZIP (.zip)</span>
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={isFull}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-2 border border-slate-700 active:scale-95 transition-all disabled:opacity-50"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>ถ่ายภาพ</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            รองรับ PNG, JPG, WEBP, ZIP • นำเข้าได้สูงสุด 40 สติกเกอร์ต่อชุด
          </p>
        </div>
      </div>

      {/* Preset 2x2 Test Sheets (Optional quick testing) */}
      <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>หรือคลิกทดสอบด้วยภาพชุดตัวอย่าง 2x2 Grid (Optional Presets)</span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            ทดสอบ 5-Step Pipeline ทันที
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {samplePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectSamplePreset(preset)}
              disabled={isFull}
              className="group p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-all flex items-center gap-3 disabled:opacity-50"
            >
              <div
                className="w-10 h-10 rounded-lg shrink-0 border border-slate-700 overflow-hidden shadow-xs relative"
                style={{ backgroundColor: preset.bgColor }}
              >
                <img
                  src={preset.dataUrl}
                  alt={preset.titleTh}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                  {preset.titleTh}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {preset.descriptionTh}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
