import React, { useRef, useState } from 'react';
import { X, Share2, Copy, Download, Check, Sparkles, Music, Users, ExternalLink } from 'lucide-react';
import { RoomMetadata, VideoState } from '../types/index.js';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomMetadata;
  currentVideo: VideoState;
  onlineCount: number;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  room,
  currentVideo,
  onlineCount,
  onShowToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const roomUrl = `${window.location.origin}/?room=${encodeURIComponent(room.id)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(roomUrl)}&bgcolor=18181b&color=ffffff&margin=10`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopiedLink(true);
      onShowToast('คัดลอกลิงก์ห้องแล้ว ส่งให้เพื่อนได้เลย 📋', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onShowToast('ไม่สามารถคัดลอกลิงก์ได้', 'warning');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `มาฟังเพลงด้วยกันที่ห้อง "${room.name}" บน pleng.online`,
          text: `กำลังเล่น: ${currentVideo.title || 'ห้องฟังเพลงออนไลน์'} | เข้ามาฟังด้วยกันเลย!`,
          url: roomUrl,
        });
        onShowToast('เปิดการแชร์เรียบร้อย 🚀', 'success');
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadCard = async () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Aurora Circles
      ctx.save();
      ctx.filter = 'blur(100px)';
      ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.beginPath();
      ctx.arc(300, 400, 350, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
      ctx.beginPath();
      ctx.arc(800, 1300, 400, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Brand Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('pleng.online 🎧', 540, 180);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '32px system-ui, -apple-system, sans-serif';
      ctx.fillText('ฟังเพลงออนไลน์ไม่มีโฆษณา • ซิงค์พร้อมเพื่อน', 540, 240);

      // Room Card Box
      ctx.fillStyle = 'rgba(24, 24, 27, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.roundRect(100, 320, 880, 1260, 48);
      ctx.fill();
      ctx.stroke();

      // Room Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
      const cleanRoomName = room.name.length > 22 ? room.name.substring(0, 22) + '...' : room.name;
      ctx.fillText(cleanRoomName, 540, 430);

      // Listener Badge
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
      ctx.fillText(`● กำลังฟังอยู่ ${onlineCount} คน`, 540, 500);

      // Video Thumbnail
      if (currentVideo.videoId) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = `https://i.ytimg.com/vi/${currentVideo.videoId}/hqdefault.jpg`;
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
          ctx.save();
          ctx.roundRect(180, 560, 720, 405, 28);
          ctx.clip();
          ctx.drawImage(img, 180, 560, 720, 405);
          ctx.restore();
        } catch (e) {}

        // Song Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
        const cleanTitle = (currentVideo.title || 'กำลังเล่นเพลง').substring(0, 34);
        ctx.fillText(cleanTitle, 540, 1030);

        ctx.fillStyle = '#a855f7';
        ctx.font = '32px system-ui, -apple-system, sans-serif';
        ctx.fillText(currentVideo.channel || 'YouTube Music', 540, 1085);
      }

      // QR Code
      try {
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        qrImg.src = qrUrl;
        await new Promise((resolve) => {
          qrImg.onload = resolve;
          qrImg.onerror = resolve;
        });
        ctx.save();
        ctx.roundRect(400, 1160, 280, 280, 24);
        ctx.clip();
        ctx.drawImage(qrImg, 400, 1160, 280, 280);
        ctx.restore();
      } catch (e) {}

      ctx.fillStyle = '#f4f4f5';
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.fillText('สแกน QR เพื่อเข้าห้องปาร์ตี้ทันที', 540, 1495);

      // Card Bottom Link
      ctx.fillStyle = '#71717a';
      ctx.font = '28px monospace';
      ctx.fillText(`pleng.online/?room=${room.id}`, 540, 1680);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `pleng-online-room-${room.id}.png`;
      a.click();
      onShowToast('ดาวน์โหลดการ์ดแชร์สำเร็จ! 📸', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('เกิดข้อผิดพลาดในการสร้างรูปภาพ', 'warning');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm sm:max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-white">การ์ดแชร์ห้องปาร์ตี้ (Share Card)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Story Card Preview */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col items-center">
          <div
            ref={cardRef}
            className="w-full max-w-[280px] sm:max-w-[300px] rounded-2xl p-4 bg-gradient-to-b from-zinc-900 via-indigo-950/60 to-zinc-900 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.25)] flex flex-col items-center text-center relative overflow-hidden select-none"
          >
            {/* Ambient Background glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-pink-500/20 blur-2xl pointer-events-none" />

            {/* Brand Logo */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold mb-3 shadow-xs">
              <span>pleng.online 🎧</span>
            </div>

            {/* Room Title */}
            <h4 className="font-extrabold text-base text-white tracking-tight line-clamp-1 mb-1">
              {room.name}
            </h4>

            {/* Live Count */}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>กำลังฟังอยู่ {onlineCount} คน</span>
            </div>

            {/* Video Preview */}
            {currentVideo.videoId ? (
              <div className="w-full rounded-xl overflow-hidden border border-white/10 shadow-md mb-3 bg-black">
                <div className="aspect-video w-full relative">
                  <img
                    src={`https://i.ytimg.com/vi/${currentVideo.videoId}/hqdefault.jpg`}
                    alt={currentVideo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] text-white font-medium flex items-center gap-1">
                    <Music className="w-3 h-3 text-pink-400" /> กำลังเล่น
                  </div>
                </div>
                <div className="p-2 text-left bg-zinc-900/90">
                  <div className="text-xs font-bold text-white line-clamp-1">
                    {currentVideo.title}
                  </div>
                  <div className="text-[10px] text-purple-300 line-clamp-1">
                    {currentVideo.channel}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full py-6 rounded-xl border border-dashed border-zinc-700 mb-3 flex flex-col items-center justify-center text-zinc-400">
                <Music className="w-6 h-6 mb-1 text-purple-400" />
                <span className="text-xs">ห้องฟังเพลงร่วมกัน</span>
              </div>
            )}

            {/* Dynamic QR Code */}
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 shadow-inner mb-2">
              <img
                src={qrUrl}
                alt="Room QR Code"
                className="w-28 h-28 object-contain rounded-lg"
              />
            </div>
            <span className="text-[11px] font-semibold text-zinc-300">
              สแกน QR เพื่อเข้าห้องปาร์ตี้
            </span>
            <span className="text-[9px] font-mono text-zinc-500 mt-0.5 truncate max-w-[200px]">
              {roomUrl}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>แชร์ลงโซเชียล</span>
            </button>

            <button
              onClick={handleDownloadCard}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-purple-300" />
              <span>{isExporting ? 'กำลังสร้างภาพ...' : 'บันทึกรูปการ์ด'}</span>
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition-all"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">คัดลอกลิงก์สำเร็จ!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอกลิงก์เชิญเพื่อน (Direct Link)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
