import React, { useEffect, useState } from 'react';

export interface FloatingItem {
  id: string;
  emoji: string;
  senderName: string;
  senderColor: string;
  leftPercent: number;
}

interface FloatingReactionsProps {
  reactions: FloatingItem[];
  onRemove: (id: string) => void;
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({
  reactions,
  onRemove,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {reactions.map((item) => (
        <FloatingBubble key={item.id} item={item} onFinish={() => onRemove(item.id)} />
      ))}
    </div>
  );
};

const FloatingBubble: React.FC<{ item: FloatingItem; onFinish: () => void }> = ({
  item,
  onFinish,
}) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Start animation on next tick
    const animTimer = setTimeout(() => setActive(true), 20);
    const removeTimer = setTimeout(() => onFinish(), 2800);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(removeTimer);
    };
  }, [onFinish]);

  return (
    <div
      className="absolute bottom-6 flex flex-col items-center pointer-events-none transition-all duration-[2600ms] ease-out select-none"
      style={{
        left: `${item.leftPercent}%`,
        transform: active ? 'translateY(-280px) scale(1.3)' : 'translateY(0) scale(0.6)',
        opacity: active ? 0 : 1,
      }}
    >
      <span className="text-3xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-bounce">
        {item.emoji}
      </span>
      {item.senderName && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/70 text-white shadow-md mt-0.5 border"
          style={{ borderColor: item.senderColor || '#8b5cf6' }}
        >
          {item.senderName}
        </span>
      )}
    </div>
  );
};
