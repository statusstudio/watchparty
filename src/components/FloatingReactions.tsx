import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Gift, Heart, Sparkles, ChevronUp, ChevronDown, X } from 'lucide-react';

export interface FloatingItem {
  id: string;
  emoji: string;
  senderName: string;
  senderColor: string;
  leftPercent: number;
}

export interface GiftEvent {
  id: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  senderName: string;
  senderAvatar?: string;
  senderColor?: string;
}

export const VIRTUAL_GIFTS = [
  { id: 'coffee', name: 'กาแฟแก้ง่วง', icon: '☕', description: 'เติมพลังให้ดีเจ & ทุกคน' },
  { id: 'mic', name: 'ไมค์ทองคำ', icon: '🎙️', description: 'มอบให้นักร้องเสียงทอง' },
  { id: 'crown', name: 'มงกุฎเกียรติยศ', icon: '👑', description: 'MVP ประจำห้อง' },
  { id: 'rocket', name: 'จรวดทะยานฟ้า', icon: '🚀', description: 'ห้องปาร์ตี้ไฟลุกทะลุเพดาน' },
  { id: 'diamond', name: 'เพชรประกายแสง', icon: '💎', description: 'เปล่งประกายความสนุก' },
  { id: 'cake', name: 'เค้กฉลองปาร์ตี้', icon: '🎂', description: 'แฮปปี้ปาร์ตี้ไทม์' },
];

export const triggerGiftConfetti = () => {
  try {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#a855f7', '#ec4899', '#f59e0b', '#3b82f6', '#10b981'],
    });
  } catch (e) {
    // Ignore in unsupported environments
  }
};

interface FloatingReactionsProps {
  reactions: FloatingItem[];
  onRemove: (id: string) => void;
  activeGifts?: GiftEvent[];
  onRemoveGift?: (id: string) => void;
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({
  reactions,
  onRemove,
  activeGifts = [],
  onRemoveGift,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      <style>{`
        @keyframes floatReactionAnim {
          0% { transform: translateY(0) scale(0.65); opacity: 0; }
          12% { transform: translateY(-25px) scale(1.15); opacity: 1; }
          80% { opacity: 0.95; }
          100% { transform: translateY(-340px) scale(1.35); opacity: 0; }
        }
      `}</style>
      {/* Floating Bubbles */}
      {reactions.map((item) => (
        <FloatingBubble key={item.id} item={item} onFinish={() => onRemove(item.id)} />
      ))}

      {/* Gift Celebration Banners (If any passed) */}
      {activeGifts.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-40 max-w-[90%]">
          {activeGifts.map((gift) => (
            <GiftBannerItem
              key={gift.id}
              gift={gift}
              onFinish={() => onRemoveGift && onRemoveGift(gift.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const GiftBannerItem: React.FC<{ gift: GiftEvent; onFinish: () => void }> = ({ gift, onFinish }) => {
  const hasTriggeredRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      triggerGiftConfetti();
    }
    const timer = setTimeout(() => {
      onFinishRef.current();
    }, 4000);
    return () => clearTimeout(timer);
  }, [gift.id]);

  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-500 flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-zinc-950/90 backdrop-blur-md border border-amber-400/50 shadow-[0_0_24px_rgba(245,158,11,0.35)] text-white pointer-events-auto">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-xl shadow-lg shrink-0 animate-bounce">
          {gift.giftIcon}
        </div>
        <div className="flex flex-col text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-amber-300 truncate max-w-[120px]">
              {gift.senderName}
            </span>
            <span className="text-[10px] text-zinc-300">ส่งของขวัญ</span>
          </div>
          <span className="text-xs font-extrabold text-white tracking-wide flex items-center gap-1 truncate">
            {gift.giftName} <Sparkles className="w-3 h-3 text-yellow-300 animate-spin shrink-0" />
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onFinishRef.current()}
        className="p-1 text-zinc-400 hover:text-white rounded-md transition-colors cursor-pointer shrink-0"
        title="ปิดการแจ้งเตือน"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const FloatingBubble: React.FC<{ item: FloatingItem; onFinish: () => void }> = ({
  item,
  onFinish,
}) => {
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const removeTimer = setTimeout(() => onFinishRef.current(), 2800);
    return () => clearTimeout(removeTimer);
  }, [item.id]);

  return (
    <div
      className="absolute bottom-6 flex flex-col items-center pointer-events-none select-none"
      style={{
        left: `${item.leftPercent}%`,
        animation: 'floatReactionAnim 2.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
      }}
    >
      <span className="text-3xl filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] animate-bounce">
        {item.emoji}
      </span>
      {item.senderName && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/85 text-white shadow-md mt-0.5 border"
          style={{ borderColor: item.senderColor || '#8b5cf6' }}
        >
          {item.senderName}
        </span>
      )}
    </div>
  );
};

interface LiveReactionsDockProps {
  onSendReaction: (emoji: string) => void;
  onSendGift?: (gift: { id: string; name: string; icon: string }) => void;
  className?: string;
}

export const LiveReactionsDock: React.FC<LiveReactionsDockProps> = ({
  onSendReaction,
  onSendGift,
  className = '',
}) => {
  const [isGiftMenuOpen, setIsGiftMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const heartHoldIntervalRef = useRef<any>(null);

  const quickEmojis = ['❤️', '🔥', '👏', '🥳', '🎵', '💎'];

  const triggerHeartBurst = () => {
    onSendReaction('❤️');
  };

  const handleStartHeartHold = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    triggerHeartBurst();
    if (heartHoldIntervalRef.current) clearInterval(heartHoldIntervalRef.current);
    heartHoldIntervalRef.current = setInterval(() => {
      triggerHeartBurst();
    }, 160);
  };

  const handleStopHeartHold = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    if (heartHoldIntervalRef.current) {
      clearInterval(heartHoldIntervalRef.current);
      heartHoldIntervalRef.current = null;
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className={`relative flex items-center select-none pointer-events-auto ${className}`}
    >
      {/* Gift Selection Popover */}
      {isGiftMenuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full mb-3 right-0 w-72 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-400" /> มอบของขวัญให้ห้องปาร์ตี้
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsGiftMenuOpen(false);
              }}
              className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {VIRTUAL_GIFTS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSendGift) onSendGift(g);
                  setIsGiftMenuOpen(false);
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-zinc-900/80 hover:bg-amber-500/20 hover:border-amber-400/50 border border-zinc-800/80 transition-all hover:scale-105 active:scale-95 group text-center cursor-pointer"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                  {g.icon}
                </span>
                <span className="text-[11px] font-semibold text-zinc-200 group-hover:text-amber-300 truncate w-full">
                  {g.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Reactions Toolbar */}
      <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/20 shadow-2xl">
        {/* Toggle Collapse */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          title={isExpanded ? 'ย่อแถบรีแอคชัน' : 'ขยายแถบรีแอคชัน'}
          className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {isExpanded && (
          <>
            {/* Quick Emojis */}
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendReaction(emoji);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 transition-transform hover:scale-125 active:scale-90 text-lg cursor-pointer"
              >
                {emoji}
              </button>
            ))}

            {onSendGift && (
              <>
                <div className="w-px h-4 bg-white/20 mx-0.5" />
                {/* Gift Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsGiftMenuOpen(!isGiftMenuOpen);
                  }}
                  title="ส่งของขวัญจำลอง"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/30 hover:from-amber-500/50 hover:to-yellow-500/50 border border-amber-400/40 text-amber-200 text-xs font-semibold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5 text-amber-300" />
                  <span>ของขวัญ</span>
                </button>
              </>
            )}
          </>
        )}

        {/* Big Heart Spam Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerHeartBurst();
          }}
          onMouseDown={handleStartHeartHold}
          onMouseUp={handleStopHeartHold}
          onMouseLeave={handleStopHeartHold}
          onTouchStart={handleStartHeartHold}
          onTouchEnd={handleStopHeartHold}
          title="แตะรัวๆ หรือกดค้างเพื่อส่งหัวใจ ❤️"
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-white shadow-[0_0_12px_rgba(244,63,94,0.7)] hover:scale-110 active:scale-90 transition-transform cursor-pointer"
        >
          <Heart className="w-4 h-4 fill-white animate-pulse" />
        </button>
      </div>
    </div>
  );
};
