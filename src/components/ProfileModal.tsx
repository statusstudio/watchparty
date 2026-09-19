import React, { useState, useRef } from 'react';
import { X, Upload, Check, Palette, User, Sparkles } from 'lucide-react';
import { UserProfile } from '../types/index.js';
import { PRESET_AVATARS, COLOR_PALETTE } from '../data/presets.js';
import { compressProfileImage } from '../services/imageCompressor.js';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSave: (updated: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, currentUser, onSave }) => {
  const [name, setName] = useState(currentUser.name);
  const [color, setColor] = useState(currentUser.color);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsCompressing(true);
    try {
      // Compress and resize via HTML5 Canvas (160x160)
      const compressedDataUri = await compressProfileImage(file, 160);
      setAvatar(compressedDataUri);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อของคุณ');
      return;
    }

    onSave({
      ...currentUser,
      name: name.trim(),
      color,
      avatar,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#151722] border border-gray-800/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">แก้ไขโปรไฟล์ของคุณ</h2>
              <p className="text-xs text-gray-400">รูปภาพและชื่อจะแสดงบนเวทีไมค์และกล่องแชท</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
              {error}
            </div>
          )}

          {/* Current Avatar Preview & Upload */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div
              className="relative w-24 h-24 rounded-full p-1 border-4 shadow-xl overflow-hidden group"
              style={{ borderColor: color }}
            >
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover rounded-full bg-gray-900"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">เปลี่ยนรูป</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 flex items-center gap-1.5 transition-colors border border-gray-700/60"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                {isCompressing ? 'กำลังย่อรูป...' : 'อัพโหลดจากเครื่อง (Auto-Resize)'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 text-center">
              * ระบบย่อรูปภาพให้อัตโนมัติเป็น 160x160 เพื่อความลื่นไหล
            </p>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              ชื่อแสดงในห้อง (Display Name)
            </label>
            <input
              type="text"
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0f0f13] border border-gray-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="เช่น บอย Squad Chill"
              required
            />
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              สีประจำตัว (Tag & Aura Color)
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                    color === c ? 'scale-110 ring-2 ring-white' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Vector Avatars */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              รูปโปรไฟล์สำเร็จรูป (Preset Avatars)
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = avatar === preset.svg;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAvatar(preset.svg)}
                    className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500'
                        : 'border-gray-800 bg-[#0f0f13] hover:border-gray-700'
                    }`}
                  >
                    <img src={preset.svg} alt={preset.name} className="w-12 h-12 rounded-full" />
                    <span className="text-[10px] text-gray-300 truncate w-full text-center">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl font-medium text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              บันทึกโปรไฟล์
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
