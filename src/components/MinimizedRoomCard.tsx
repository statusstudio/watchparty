import React from 'react';
import { Play, Pause, Maximize2, X, Music, Radio } from 'lucide-react';
import { VideoState } from '../types/index.js';

interface MinimizedRoomCardProps {
  roomId: string;
  roomName: string;
  video: VideoState;
  onlineCount: number;
  onMaximize: () => void;
  onTogglePlayPause: () => void;
  onLeaveRoom: () => void;
  theme?: 'dark' | 'light';
}

export const MinimizedRoomCard: React.FC<MinimizedRoomCardProps> = ({
  roomId,
  roomName,
  video,
  onlineCount,
  onMaximize,
  onTogglePlayPause,
  onLeaveRoom,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const hasVideo = Boolean(video.videoId);
  const videoThumb = hasVideo
    ? `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`
    : null;

  return (
    <div
      role="region"
      aria-label="ห้องปาร์ตี้ที่ย่ออยู่"
      onClick={onMaximize}
      className={`fixed bottom-20 lg:bottom-4 left-3 right-3 sm:right-auto sm:w-96 z-50 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.4)] p-2.5 sm:p-3 flex items-center gap-3 cursor-pointer group transition-all duration-200 select-none animate-scale-up border backdrop-blur-xl ${
        isLight
          ? 'bg-white/95 border-[#dae2fd] text-[#131b2e] hover:border-[#0075de]/50 hover:shadow-2xl'
          : 'bg-[#191b22]/95 border-white/[0.12] text-[#e2e2ea] hover:border-[#00daf3]/50 hover:shadow-[0_12px_36px_rgba(0,0,0,0.7)]'
      }`}
    >
      {/* Visual Thumbnail / Animated Music Icon */}
      <div className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border shadow-xs flex items-center justify-center ${
        isLight ? 'bg-zinc-100 border-black/5' : 'bg-black border-white/10'
      }`}>
        {videoThumb ? (
          <img
            src={videoThumb}
            alt={video.title || 'คลิปกำลังเล่น'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
            <Music className="w-5 h-5 animate-bounce" />
          </div>
        )}

        {/* Live Audio Indicator Overlay */}
        <div className="absolute top-1 left-1 flex items-center gap-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-full">
          <span className={`w-1.5 h-1.5 rounded-full ${video.isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          <span className="text-[9px] text-white font-mono font-bold leading-none">
            {video.isPlaying ? 'สด' : 'พัก'}
          </span>
        </div>
      </div>

      {/* Room & Song Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-[#10B981] shrink-0 animate-pulse" />
          <h4
            className={`text-xs font-bold truncate ${isLight ? 'text-[#131b2e]' : 'text-white'}`}
            title={roomName || roomId}
          >
            {roomName || roomId}
          </h4>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full border shrink-0 ${
              isLight
                ? 'bg-[#f6f5f4] text-[#615d59] border-[#dae2fd]'
                : 'bg-white/10 text-[#c1c6d5] border-white/10'
            }`}
          >
            {onlineCount} คน
          </span>
        </div>

        <p
          className={`text-[11px] font-medium truncate mt-0.5 ${
            isLight ? 'text-[#475569]' : 'text-[#c1c6d5]'
          }`}
          title={video.title || 'ห้องสแตนด์บาย (แตะเพื่อเข้าห้อง)'}
        >
          {video.title || 'ห้องสแตนด์บาย (รอเปิดเพลง)'}
        </p>

        <p className={`text-[10px] truncate ${
          isLight ? 'text-[#707881]' : 'text-[#8b919e]'
        }`}>
          แตะเพื่อขยายกลับมาเต็มจอ 👆
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Play/Pause Button */}
        {hasVideo && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlayPause();
            }}
            title={video.isPlaying ? 'พักเพลง' : 'เล่นต่อ'}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-black/5 text-[#31302e] hover:text-[#000000]'
                : 'hover:bg-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            {video.isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            )}
          </button>
        )}

        {/* Maximize Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMaximize();
          }}
          title="ขยายห้องปาร์ตี้กลับมา"
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            isLight
              ? 'hover:bg-[#0075de]/10 text-[#0075de]'
              : 'hover:bg-[#00daf3]/10 text-[#00daf3]'
          }`}
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Close / Leave Room Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLeaveRoom();
          }}
          title="ปิดออกจากห้อง (ตัดการเชื่อมต่อ)"
          className={`p-1.5 rounded-full transition-colors cursor-pointer ml-0.5 border border-transparent ${
            isLight
              ? 'hover:bg-rose-50 text-rose-500 hover:text-rose-600 hover:border-rose-200'
              : 'hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 hover:border-rose-500/20'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
