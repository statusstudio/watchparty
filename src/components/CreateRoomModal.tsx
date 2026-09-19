import React, { useState, useRef } from 'react';
import {
  X,
  Lock,
  Globe,
  Plus,
  Sparkles,
  Tv,
  Image as ImageIcon,
  Upload,
  Check,
  Music,
  VideoOff,
  Link as LinkIcon,
} from 'lucide-react';
import { SAMPLE_VIDEOS, ROOM_CATEGORIES, PRESET_ROOM_COVERS } from '../data/presets.js';
import { RoomCategory, StageAccessMode } from '../types/index.js';

export interface CreateRoomForm {
  name: string;
  description: string;
  isPrivate: boolean;
  password?: string;
  category: RoomCategory;
  coverImage?: string;
  initialVideoId?: string;
  onlyAdminManagePlaylist: boolean;
  stageAccessMode?: StageAccessMode;
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (formData: CreateRoomForm) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RoomCategory>('music');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [stageAccessMode, setStageAccessMode] = useState<StageAccessMode>('everyone');
  
  // Cover image state
  const [coverType, setCoverType] = useState<'preset' | 'upload' | 'url'>('preset');
  const [selectedCover, setSelectedCover] = useState<string>(PRESET_ROOM_COVERS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initial video state (Optional)
  const [hasInitialVideo, setHasInitialVideo] = useState(false);
  const [initialVideoId, setInitialVideoId] = useState('');
  const [customVideoInput, setCustomVideoInput] = useState('');

  const [onlyAdminManagePlaylist, setOnlyAdminManagePlaylist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local image upload with HTML5 Canvas compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 450;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedCover(compressedDataUrl);
          setCoverType('upload');
          setError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const parseYouTubeId = (urlOrId: string): string => {
    const trimmed = urlOrId.trim();
    if (!trimmed) return '';
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : trimmed;
  };

  const getEffectiveCover = () => {
    if (coverType === 'url') return customCoverUrl.trim() || undefined;
    return selectedCover || undefined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อห้อง');
      return;
    }

    if (isPrivate && !password.trim()) {
      setError('กรุณากำหนดรหัสผ่านสำหรับห้องส่วนตัว');
      return;
    }

    let finalVideoId: string | undefined = undefined;
    if (hasInitialVideo) {
      if (customVideoInput.trim()) {
        finalVideoId = parseYouTubeId(customVideoInput);
      } else if (initialVideoId) {
        finalVideoId = initialVideoId;
      }
    }

    onCreateRoom({
      name: name.trim(),
      description: description.trim(),
      category,
      coverImage: getEffectiveCover(),
      isPrivate,
      password: isPrivate ? password.trim() : undefined,
      initialVideoId: finalVideoId,
      onlyAdminManagePlaylist,
      stageAccessMode,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#151722] border border-gray-800/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-800/80 flex items-center justify-between bg-[#12141c] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">สร้างห้องปาร์ตี้ใหม่</h2>
              <p className="text-[11px] text-gray-400">กำหนดชื่อ ปกห้อง หมวดหมู่ และการตั้งค่าตามใจชอบ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-2.5 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              {error}
            </div>
          )}

          {/* 1. Room Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                ชื่อห้องปาร์ตี้ (Room Name) *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น Squad Chill & Lofi Beats 🎧"
                className="w-full px-3.5 py-2 bg-[#0f0f13] border border-gray-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                required
                autoFocus
              />
            </div>

            {/* Category Dropdown (Dropbox) */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                หมวดหมู่ห้อง (Category) *
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RoomCategory)}
                  className="w-full px-3 py-2 bg-[#0f0f13] border border-gray-700/80 rounded-xl text-xs sm:text-sm text-purple-300 font-medium focus:outline-none focus:border-purple-500 transition-colors cursor-pointer appearance-none"
                >
                  {ROOM_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#151722] text-white">
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Room Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              คำอธิบายห้อง (Description)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น เปิดเพลงฟังชิลล์ๆ คุยงานและเล่นเกมด้วยกัน"
              className="w-full px-3.5 py-2 bg-[#0f0f13] border border-gray-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* 3. Room Cover Image Section */}
          <div className="space-y-2 p-3 bg-[#0f0f13] border border-gray-800 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>รูปภาพปกห้อง (Room Cover Image)</span>
              </label>

              {/* Cover source tabs */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCoverType('preset')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                    coverType === 'preset' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  เลือกรูปสวยๆ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCoverType('upload');
                    fileInputRef.current?.click();
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    coverType === 'upload' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-2.5 h-2.5" />
                  อัพโหลด
                </button>
                <button
                  type="button"
                  onClick={() => setCoverType('url')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                    coverType === 'url' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ลิงก์ URL
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Presets Grid */}
            {coverType === 'preset' && (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
                {PRESET_ROOM_COVERS.map((cov) => {
                  const isSelected = selectedCover === cov.url;
                  return (
                    <div
                      key={cov.id}
                      onClick={() => setSelectedCover(cov.url)}
                      className={`relative aspect-video rounded-lg overflow-hidden border cursor-pointer group transition-all ${
                        isSelected ? 'border-purple-500 ring-2 ring-purple-500 scale-105' : 'border-gray-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={cov.url} alt={cov.name} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upload preview */}
            {coverType === 'upload' && selectedCover && (
              <div className="flex items-center gap-3 pt-1">
                <div className="w-24 aspect-video rounded-lg overflow-hidden border border-purple-500 relative">
                  <img src={selectedCover} alt="Uploaded preview" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs">
                  <p className="text-emerald-400 font-semibold">อัพโหลดรูปสำเร็จแล้ว</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-purple-400 hover:underline mt-0.5 cursor-pointer"
                  >
                    เปลี่ยนรูปใหม่
                  </button>
                </div>
              </div>
            )}

            {/* Custom URL Input */}
            {coverType === 'url' && (
              <div className="pt-1">
                <div className="relative flex items-center">
                  <LinkIcon className="w-3.5 h-3.5 text-gray-500 absolute left-3" />
                  <input
                    type="url"
                    value={customCoverUrl}
                    onChange={(e) => setCustomCoverUrl(e.target.value)}
                    placeholder="วางลิงก์รูปภาพ เช่น https://images.unsplash.com/..."
                    className="w-full pl-9 pr-3 py-1.5 bg-[#151722] border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Live Preview Thumbnail Card */}
            <div className="relative h-20 rounded-xl overflow-hidden border border-gray-800 mt-2">
              <img
                src={getEffectiveCover() || 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80'}
                alt="Room Cover Preview"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2.5">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-300 border border-purple-500/40 mr-1.5">
                      {ROOM_CATEGORIES.find((c) => c.id === category)?.icon} {ROOM_CATEGORIES.find((c) => c.id === category)?.label}
                    </span>
                    <span className="text-xs font-bold text-white drop-shadow">
                      {name || 'ชื่อห้องของคุณ'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-300 bg-black/60 px-1.5 py-0.5 rounded">
                    ตัวอย่างรูปปก
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Privacy Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              ความปลอดภัยและการเข้าถึง (Privacy Mode)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  !isPrivate
                    ? 'border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500'
                    : 'border-gray-800 bg-[#0f0f13] text-gray-400 hover:border-gray-700'
                }`}
              >
                <Globe className={`w-4 h-4 mt-0.5 shrink-0 ${!isPrivate ? 'text-emerald-400' : ''}`} />
                <div>
                  <p className="text-xs font-semibold text-white">ห้องสาธารณะ (Public)</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">ทุกคนสามารถเข้าร่วมได้ทันที</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  isPrivate
                    ? 'border-purple-500 bg-purple-500/10 text-white ring-1 ring-purple-500'
                    : 'border-gray-800 bg-[#0f0f13] text-gray-400 hover:border-gray-700'
                }`}
              >
                <Lock className={`w-4 h-4 mt-0.5 shrink-0 ${isPrivate ? 'text-purple-400' : ''}`} />
                <div>
                  <p className="text-xs font-semibold text-white">ล็อครหัส (Private)</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">ต้องใส่รหัสผ่านก่อนเข้าห้อง</p>
                </div>
              </button>
            </div>
          </div>

          {/* Password Input (If Private) */}
          {isPrivate && (
            <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-1.5 animate-fade-in">
              <label className="block text-xs font-semibold text-purple-200">
                ตั้งรหัสผ่านสำหรับเข้าห้อง (Room Password) *
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="เช่น 1234 หรือ vip2026"
                className="w-full px-3 py-1.5 bg-[#0f0f13] border border-purple-500/50 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400"
                required={isPrivate}
              />
            </div>
          )}

          {/* 5. Starting Video (COMPLETELY OPTIONAL) */}
          <div className="p-3 bg-[#0f0f13] border border-gray-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
                <Tv className="w-3.5 h-3.5 text-cyan-400" />
                <span>คลิปวิดีโอเริ่มต้น (ไม่บังคับ - Optional)</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasInitialVideo}
                  onChange={(e) => setHasInitialVideo(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-gray-700"
                />
                <span className="text-[11px] text-purple-300">ต้องการระบุเพลงแรก</span>
              </label>
            </div>

            {!hasInitialVideo ? (
              <div className="p-2.5 rounded-lg bg-[#151722] border border-gray-800/80 flex items-center gap-2 text-gray-400 text-xs">
                <VideoOff className="w-4 h-4 text-gray-500 shrink-0" />
                <span>
                  ห้องจะเปิดแบบพร้อมใช้งาน (Standby) คุณหรือเพื่อนๆ สามารถกดขอเพลงหรือเปิดคลิป YouTube เมื่อเข้าห้องได้ตลอดเวลา
                </span>
              </div>
            ) : (
              <div className="space-y-2 pt-1 animate-fade-in">
                <input
                  type="text"
                  value={customVideoInput}
                  onChange={(e) => {
                    setCustomVideoInput(e.target.value);
                    setInitialVideoId('');
                  }}
                  placeholder="วาง YouTube URL หรือ Video ID (เช่น https://youtu.be/...)"
                  className="w-full px-3 py-1.5 bg-[#151722] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />

                <div className="grid grid-cols-2 gap-1.5">
                  {SAMPLE_VIDEOS.slice(0, 4).map((v) => {
                    const isSelected = initialVideoId === v.videoId && !customVideoInput.trim();
                    return (
                      <button
                        key={v.videoId}
                        type="button"
                        onClick={() => {
                          setInitialVideoId(v.videoId);
                          setCustomVideoInput('');
                        }}
                        className={`p-1.5 rounded-lg border flex items-center gap-2 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500/20 ring-1 ring-purple-500'
                            : 'border-gray-800 bg-[#151722] hover:border-gray-700'
                        }`}
                      >
                        <img src={v.thumbnail} alt={v.title} className="w-8 h-6 rounded object-cover shrink-0" />
                        <span className="text-[10px] font-medium text-gray-200 truncate">{v.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 6. Voice Stage Access Mode */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span>การจำกัดการขึ้นไมค์บนเวที (Voice Stage Access)</span>
              <span className="text-[10px] text-amber-400 font-normal">กำหนดโดยเจ้าของห้อง</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStageAccessMode('everyone')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  stageAccessMode === 'everyone'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500/50'
                    : 'border-gray-800 bg-[#0f0f13] text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                  <span>👥</span> ทุกคนขึ้นได้
                </div>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  ใครก็สามารถกดขึ้นที่นั่งพูดไมค์ได้ทันที
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStageAccessMode('admin_only')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  stageAccessMode === 'admin_only'
                    ? 'border-purple-500 bg-purple-500/10 text-white ring-1 ring-purple-500/50'
                    : 'border-gray-800 bg-[#0f0f13] text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                  <span>🛡️</span> เฉพาะแอดมิน
                </div>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  ขึ้นได้เฉพาะ Owner และ Admin
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStageAccessMode('approval')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  stageAccessMode === 'approval'
                    ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500/50'
                    : 'border-gray-800 bg-[#0f0f13] text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                  <span>✋</span> ต้องขออนุญาต
                </div>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  ต้องขอยกมือก่อน ให้ Owner/Admin อนุญาต
                </p>
              </button>
            </div>
          </div>

          {/* 7. Permission Settings */}
          <div>
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0f0f13] border border-gray-800 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAdminManagePlaylist}
                onChange={(e) => setOnlyAdminManagePlaylist(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-700"
              />
              <div className="text-xs">
                <span className="text-gray-200 font-semibold">จำกัดสิทธิ์จัดการ Playlist</span>
                <p className="text-[10px] text-gray-400">
                  เฉพาะ Owner & Admin เท่านั้นที่สามารถเพิ่ม ลบ หรือสลับคิวเพลงได้
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              สร้างห้องปาร์ตี้ทันที
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
