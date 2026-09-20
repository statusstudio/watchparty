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
  Search,
  Loader2,
  Trash2,
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
  initialVideoTitle?: string;
  initialVideoChannel?: string;
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
  const [selectedVideo, setSelectedVideo] = useState<{
    videoId: string;
    title: string;
    channel: string;
    thumbnail: string;
  } | null>(null);
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [ytResults, setYtResults] = useState<Array<{
    videoId: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration?: string;
  }>>([]);
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

  const handleYtSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = ytSearchQuery.trim();
    if (!query) return;

    const directId = parseYouTubeId(query);
    if (directId && directId !== query && directId.length === 11) {
      setSelectedVideo({
        videoId: directId,
        title: 'YouTube Video',
        channel: 'YouTube',
        thumbnail: `https://img.youtube.com/vi/${directId}/hqdefault.jpg`,
      });
      setYtSearchQuery('');
      setYtResults([]);
      return;
    }

    setIsSearchingYt(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setYtResults(data.results || []);
    } catch (err) {
      console.error('YouTube search error:', err);
    } finally {
      setIsSearchingYt(false);
    }
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
    let finalVideoTitle: string | undefined = undefined;
    let finalVideoChannel: string | undefined = undefined;

    if (hasInitialVideo) {
      if (selectedVideo) {
        finalVideoId = selectedVideo.videoId;
        finalVideoTitle = selectedVideo.title;
        finalVideoChannel = selectedVideo.channel;
      } else if (customVideoInput.trim()) {
        finalVideoId = parseYouTubeId(customVideoInput);
        finalVideoTitle = 'YouTube Video';
        finalVideoChannel = 'YouTube';
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
      initialVideoTitle: finalVideoTitle,
      initialVideoChannel: finalVideoChannel,
      onlyAdminManagePlaylist,
      stageAccessMode,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#e6e6e6] rounded-2xl w-full max-w-xl overflow-hidden shadow-notion-modal flex flex-col max-h-[92vh] text-[#31302e]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e6e6e6] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0075de]/10 border border-[#0075de]/20 flex items-center justify-center text-[#0075de]">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#000000]">สร้างห้องปาร์ตี้ใหม่</h2>
              <p className="text-[11px] text-[#615d59]">กำหนดชื่อ ปกห้อง หมวดหมู่ และการตั้งค่าตามใจชอบ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-2.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {error}
            </div>
          )}

          {/* 1. Room Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block text-xs font-semibold text-[#31302e] mb-1">
                ชื่อห้องปาร์ตี้ (Room Name) *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น Squad Chill & Lofi Beats 🎧"
                className="w-full px-3.5 py-2 bg-white border border-[#e6e6e6] rounded-xl text-xs sm:text-sm text-[#000000] placeholder-[#a39e98] focus:outline-none focus:border-[#0075de] shadow-xs transition-colors"
                required
                autoFocus
              />
            </div>

            {/* Category Dropdown (Dropbox) */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-[#31302e] mb-1">
                หมวดหมู่ห้อง (Category) *
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RoomCategory)}
                  className="w-full px-3 py-2 bg-white border border-[#e6e6e6] rounded-xl text-xs sm:text-sm text-[#000000] font-medium focus:outline-none focus:border-[#0075de] shadow-xs transition-colors cursor-pointer appearance-none"
                >
                  {ROOM_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-white text-[#31302e]">
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#615d59]">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Room Description */}
          <div>
            <label className="block text-xs font-semibold text-[#31302e] mb-1">
              คำอธิบายห้อง (Description)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น เปิดเพลงฟังชิลล์ๆ คุยงานและเล่นเกมด้วยกัน"
              className="w-full px-3.5 py-2 bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] placeholder-[#a39e98] focus:outline-none focus:border-[#0075de] shadow-xs transition-colors"
            />
          </div>

          {/* 3. Room Cover Image Section */}
          <div className="space-y-2 p-3 bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#000000] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#0075de]" />
                <span>รูปภาพปกห้อง (Room Cover Image)</span>
              </label>

              {/* Cover source tabs */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCoverType('preset')}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                    coverType === 'preset' ? 'bg-[#0075de] text-white shadow-xs' : 'text-[#615d59] hover:text-[#000000]'
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
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    coverType === 'upload' ? 'bg-[#0075de] text-white shadow-xs' : 'text-[#615d59] hover:text-[#000000]'
                  }`}
                >
                  <Upload className="w-2.5 h-2.5" />
                  อัพโหลด
                </button>
                <button
                  type="button"
                  onClick={() => setCoverType('url')}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                    coverType === 'url' ? 'bg-[#0075de] text-white shadow-xs' : 'text-[#615d59] hover:text-[#000000]'
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
                        isSelected ? 'border-[#0075de] ring-2 ring-[#0075de] scale-105 shadow-xs' : 'border-[#e6e6e6] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={cov.url} alt={cov.name} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#0075de]/30 flex items-center justify-center">
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
                <div className="w-24 aspect-video rounded-lg overflow-hidden border border-[#0075de] relative shadow-xs">
                  <img src={selectedCover} alt="Uploaded preview" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs">
                  <p className="text-[#1aae39] font-semibold">อัพโหลดรูปสำเร็จแล้ว</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-[#0075de] hover:underline mt-0.5 cursor-pointer"
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
                  <LinkIcon className="w-3.5 h-3.5 text-[#a39e98] absolute left-3" />
                  <input
                    type="url"
                    value={customCoverUrl}
                    onChange={(e) => setCustomCoverUrl(e.target.value)}
                    placeholder="วางลิงก์รูปภาพ เช่น https://images.unsplash.com/..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#e6e6e6] rounded-lg text-xs text-[#000000] placeholder-[#a39e98] focus:outline-none focus:border-[#0075de] shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Live Preview Thumbnail Card */}
            <div className="relative h-20 rounded-xl overflow-hidden border border-[#e6e6e6] mt-2 shadow-xs">
              <img
                src={getEffectiveCover() || 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80'}
                alt="Room Cover Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-2.5">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-[#31302e] mr-1.5 shadow-xs">
                      {ROOM_CATEGORIES.find((c) => c.id === category)?.icon} {ROOM_CATEGORIES.find((c) => c.id === category)?.label}
                    </span>
                    <span className="text-xs font-bold text-white drop-shadow">
                      {name || 'ชื่อห้องของคุณ'}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/90 bg-black/50 px-1.5 py-0.5 rounded">
                    ตัวอย่างรูปปก
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Privacy Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#31302e] mb-1.5">
              ความปลอดภัยและการเข้าถึง (Privacy Mode)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer shadow-xs ${
                  !isPrivate
                    ? 'border-[#0075de] bg-[#0075de]/5 text-[#000000] ring-1 ring-[#0075de]'
                    : 'border-[#e6e6e6] bg-white text-[#615d59] hover:border-[#0075de]/30'
                }`}
              >
                <Globe className={`w-4 h-4 mt-0.5 shrink-0 ${!isPrivate ? 'text-[#0075de]' : 'text-[#615d59]'}`} />
                <div>
                  <p className="text-xs font-semibold text-[#000000]">ห้องสาธารณะ (Public)</p>
                  <p className="text-[10px] text-[#615d59] mt-0.5">ทุกคนสามารถเข้าร่วมได้ทันที</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer shadow-xs ${
                  isPrivate
                    ? 'border-[#0075de] bg-[#0075de]/5 text-[#000000] ring-1 ring-[#0075de]'
                    : 'border-[#e6e6e6] bg-white text-[#615d59] hover:border-[#0075de]/30'
                }`}
              >
                <Lock className={`w-4 h-4 mt-0.5 shrink-0 ${isPrivate ? 'text-[#0075de]' : 'text-[#615d59]'}`} />
                <div>
                  <p className="text-xs font-semibold text-[#000000]">ล็อครหัส (Private)</p>
                  <p className="text-[10px] text-[#615d59] mt-0.5">ต้องใส่รหัสผ่านก่อนเข้าห้อง</p>
                </div>
              </button>
            </div>
          </div>

          {/* Password Input (If Private) */}
          {isPrivate && (
            <div className="p-3 bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl space-y-1.5 animate-fade-in">
              <label className="block text-xs font-semibold text-[#000000]">
                ตั้งรหัสผ่านสำหรับเข้าห้อง (Room Password) *
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="เช่น 1234 หรือ vip2026"
                className="w-full px-3 py-1.5 bg-white border border-[#e6e6e6] rounded-xl text-xs sm:text-sm text-[#000000] focus:outline-none focus:border-[#0075de] shadow-xs"
                required={isPrivate}
              />
            </div>
          )}

          {/* 5. Starting Video (COMPLETELY OPTIONAL) */}
          <div className="p-3 bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#000000]">
                <Tv className="w-3.5 h-3.5 text-[#0075de]" />
                <span>คลิปวิดีโอเริ่มต้น (ไม่บังคับ - Optional)</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasInitialVideo}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasInitialVideo(checked);
                    if (!checked) {
                      setSelectedVideo(null);
                      setCustomVideoInput('');
                      setYtResults([]);
                    }
                  }}
                  className="w-3.5 h-3.5 rounded text-[#0075de] focus:ring-[#0075de] border-[#e6e6e6]"
                />
                <span className="text-[11px] text-[#0075de] font-medium">ต้องการระบุเพลงแรก</span>
              </label>
            </div>

            {!hasInitialVideo ? (
              <div className="p-2.5 rounded-lg bg-white border border-[#e6e6e6] flex items-center gap-2 text-[#615d59] text-xs">
                <VideoOff className="w-4 h-4 text-[#a39e98] shrink-0" />
                <span>
                  ห้องจะเปิดแบบไม่มีคิวเพลง (เริ่มด้วยคิวว่างเปล่า) คุณหรือเพื่อนๆ สามารถค้นหาและเปิดเพลงจาก YouTube ได้ตลอดเวลา
                </span>
              </div>
            ) : selectedVideo ? (
              <div className="p-2.5 bg-white border border-[#0075de]/30 rounded-xl flex items-center justify-between gap-3 animate-fade-in shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={selectedVideo.thumbnail}
                    alt={selectedVideo.title}
                    className="w-14 h-9 rounded-lg object-cover border border-[#e6e6e6] shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="inline-block px-1.5 py-0.2 text-[9px] font-semibold bg-[#1aae39]/10 text-[#1aae39] rounded mb-0.5">
                      เพลงแรกของห้อง ✅
                    </span>
                    <h4 className="text-xs font-medium text-[#000000] truncate">{selectedVideo.title}</h4>
                    <p className="text-[10px] text-[#615d59] truncate">{selectedVideo.channel}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="p-1.5 rounded-lg text-[#615d59] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                  title="เปลี่ยน / ลบคลิปนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1 animate-fade-in">
                {/* Search / URL input */}
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a39e98]" />
                    <input
                      type="text"
                      value={ytSearchQuery}
                      onChange={(e) => setYtSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleYtSearch();
                        }
                      }}
                      placeholder="ค้นหาชื่อเพลง ศิลปิน หรือวาง YouTube URL..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#e6e6e6] rounded-lg text-xs text-[#000000] placeholder-[#a39e98] focus:outline-none focus:border-[#0075de] shadow-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleYtSearch()}
                    disabled={isSearchingYt || !ytSearchQuery.trim()}
                    className="px-3 py-1.5 bg-[#0075de] hover:bg-[#005bab] disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    {isSearchingYt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>ค้นหา</span>
                  </button>
                </div>

                {/* Search Results */}
                {ytResults.length > 0 && (
                  <div className="max-h-44 overflow-y-auto space-y-1 p-1 bg-white border border-[#e6e6e6] rounded-lg">
                    {ytResults.map((item) => (
                      <div
                        key={item.videoId}
                        className="p-1.5 rounded-md hover:bg-[#f6f5f4] border border-transparent hover:border-[#e6e6e6] flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-12 h-8 rounded object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-[#000000] truncate">{item.title}</p>
                            <p className="text-[9px] text-[#615d59] truncate">
                              {item.channel} {item.duration ? `• ${item.duration}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVideo({
                              videoId: item.videoId,
                              title: item.title,
                              channel: item.channel,
                              thumbnail: item.thumbnail,
                            });
                            setYtResults([]);
                            setYtSearchQuery('');
                          }}
                          className="px-2 py-1 bg-[#0075de] hover:bg-[#005bab] text-white text-[10px] font-medium rounded transition-colors cursor-pointer shrink-0"
                        >
                          เลือกคลิปนี้
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Or Quick Presets */}
                <div className="pt-1">
                  <span className="text-[10px] text-[#615d59] block mb-1">หรือเลือกคลิปตัวอย่างยอดนิยม:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SAMPLE_VIDEOS.slice(0, 4).map((v) => (
                      <button
                        key={v.videoId}
                        type="button"
                        onClick={() => {
                          setSelectedVideo({
                            videoId: v.videoId,
                            title: v.title,
                            channel: 'Lofi / Preset',
                            thumbnail: v.thumbnail,
                          });
                        }}
                        className="p-1.5 rounded-lg border border-[#e6e6e6] bg-white hover:border-[#0075de]/50 flex items-center gap-2 text-left transition-all cursor-pointer shadow-xs"
                      >
                        <img src={v.thumbnail} alt={v.title} className="w-8 h-6 rounded object-cover shrink-0" />
                        <span className="text-[10px] font-medium text-[#31302e] truncate">{v.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. Voice Stage Access Mode */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#31302e] flex items-center justify-between">
              <span>การจำกัดการขึ้นไมค์บนเวที (Voice Stage Access)</span>
              <span className="text-[10px] text-[#dd5b00] font-normal">กำหนดโดยเจ้าของห้อง</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStageAccessMode('everyone')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
                  stageAccessMode === 'everyone'
                    ? 'border-[#0075de] bg-[#0075de]/5 text-[#000000] ring-1 ring-[#0075de]'
                    : 'border-[#e6e6e6] bg-white text-[#615d59] hover:border-[#0075de]/30'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-[#000000]">
                  <span>👥</span> ทุกคนขึ้นได้
                </div>
                <p className="text-[10px] text-[#615d59] mt-1 leading-relaxed">
                  ใครก็สามารถกดขึ้นที่นั่งพูดไมค์ได้ทันที
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStageAccessMode('admin_only')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
                  stageAccessMode === 'admin_only'
                    ? 'border-[#0075de] bg-[#0075de]/5 text-[#000000] ring-1 ring-[#0075de]'
                    : 'border-[#e6e6e6] bg-white text-[#615d59] hover:border-[#0075de]/30'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-[#000000]">
                  <span>🛡️</span> เฉพาะแอดมิน
                </div>
                <p className="text-[10px] text-[#615d59] mt-1 leading-relaxed">
                  ขึ้นได้เฉพาะ Owner และ Admin
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStageAccessMode('approval')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
                  stageAccessMode === 'approval'
                    ? 'border-[#0075de] bg-[#0075de]/5 text-[#000000] ring-1 ring-[#0075de]'
                    : 'border-[#e6e6e6] bg-white text-[#615d59] hover:border-[#0075de]/30'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-[#000000]">
                  <span>✋</span> ต้องขออนุญาต
                </div>
                <p className="text-[10px] text-[#615d59] mt-1 leading-relaxed">
                  ต้องขอยกมือก่อน ให้ Owner/Admin อนุญาต
                </p>
              </button>
            </div>
          </div>

          {/* 7. Permission Settings */}
          <div>
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#e6e6e6] cursor-pointer shadow-xs">
              <input
                type="checkbox"
                checked={onlyAdminManagePlaylist}
                onChange={(e) => setOnlyAdminManagePlaylist(e.target.checked)}
                className="w-4 h-4 rounded text-[#0075de] focus:ring-[#0075de] border-[#e6e6e6]"
              />
              <div className="text-xs">
                <span className="text-[#000000] font-semibold">จำกัดสิทธิ์จัดการ Playlist</span>
                <p className="text-[10px] text-[#615d59]">
                  เฉพาะ Owner & Admin เท่านั้นที่สามารถเพิ่ม ลบ หรือสลับคิวเพลงได้
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-full font-semibold text-xs sm:text-sm bg-[#0075de] hover:bg-[#005bab] text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
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
