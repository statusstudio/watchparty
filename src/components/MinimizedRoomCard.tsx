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
}

export const MinimizedRoomCard: React.FC<MinimizedRoomCardProps> = ({
  roomId,
  roomName,
  video,
  onlineCount,
  onMaximize,
  onTogglePlayPause,
  onLeaveRoom,
}) => {
  const hasVideo = Boolean(video.videoId);
  const videoThumb = hasVideo
    ? `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`
    : null;

  return (
    <div
      role="region"
      aria-label="ห้องปาร์ตี้ที่ย่ออยู่"
      onClick={onMaximize}
      className="fixed bottom-3 left-3 right-3 sm:right-auto sm:w-96 z-50 bg-white/95 backdrop-blur-md border border-[#e6e6e6] rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.16)] p-2.5 sm:p-3 flex items-center gap-3 cursor-pointer group hover:border-[#0075de]/50 hover:shadow-2xl transition-all duration-200 select-none animate-scale-up"
    >
      {/* Visual Thumbnail / Animated Music Icon */}
      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 border border-black/5 shadow-xs flex items-center justify-center">
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
          <Radio className="w-3 h-3 text-[#1aae39] shrink-0 animate-pulse" />
          <h4 className="text-xs font-bold text-[#111111] truncate" title={roomName || roomId}>
            {roomName || roomId}
          </h4>
          <span className="text-[10px] text-[#615d59] font-medium bg-[#f6f5f4] px-1.5 py-0.2 rounded-full border border-[#e6e6e6] shrink-0">
            {onlineCount} คน
          </span>
        </div>

        <p
          className="text-[11px] text-[#444444] font-medium truncate mt-0.5"
          title={video.title || 'ห้องสแตนด์บาย (แตะเพื่อเข้าห้อง)'}
        >
          {video.title || 'ห้องสแตนด์บาย (รอเปิดเพลง)'}
        </p>

        <p className="text-[10px] text-[#888888] truncate">
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
            className="p-1.5 rounded-full hover:bg-black/5 text-[#31302e] hover:text-[#000000] transition-colors cursor-pointer"
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
          className="p-1.5 rounded-full hover:bg-[#0075de]/10 text-[#0075de] transition-colors cursor-pointer"
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
          className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer ml-0.5 border border-transparent hover:border-rose-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
