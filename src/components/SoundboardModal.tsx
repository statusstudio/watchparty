import React from 'react';
import { X, Volume2, Sparkles } from 'lucide-react';
import { SOUNDBOARD_ITEMS, soundSynthesizer } from '../services/soundEffects.js';

interface SoundboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSound: (soundId: string, soundName: string) => void;
}

export const SoundboardModal: React.FC<SoundboardModalProps> = ({
  isOpen,
  onClose,
  onTriggerSound,
}) => {
  if (!isOpen) return null;

  const handleClickSound = (id: string, name: string) => {
    soundSynthesizer.play(id);
    onTriggerSound(id, name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#151722] border border-gray-800/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-1.5">
                Soundboard ซาวด์เอฟเฟกต์ 📢
              </h2>
              <p className="text-xs text-gray-400">กดเพื่อเล่นเสียงประกอบให้ทุกคนในห้องได้ยินพร้อมกัน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sounds Grid */}
        <div className="p-5 grid grid-cols-2 gap-3 overflow-y-auto">
          {SOUNDBOARD_ITEMS.map((sound) => (
            <button
              key={sound.id}
              onClick={() => handleClickSound(sound.id, sound.name)}
              className="p-3.5 rounded-xl border border-gray-800/80 bg-[#1a1d2d]/80 hover:bg-[#23273c] hover:border-gray-700 active:scale-95 transition-all text-left flex items-center gap-3 cursor-pointer group shadow-md"
            >
              <span className="text-2xl group-hover:scale-125 transition-transform shrink-0">
                {sound.icon}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-gray-200 group-hover:text-white block truncate">
                  {sound.name}
                </span>
                <span className="text-[10px] text-gray-400">กดเล่นสด</span>
              </div>
            </button>
          ))}
        </div>

        <div className="px-5 py-3 bg-[#10121a] border-t border-gray-800/60 text-center">
          <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            เสียงสังเคราะห์ด้วย Web Audio API ไหลลื่นระดับเสี้ยววินาที ไม่ดีเลย์
          </p>
        </div>
      </div>
    </div>
  );
};
