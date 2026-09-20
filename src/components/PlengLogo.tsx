import React from 'react';

interface PlengLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export const PlengLogo: React.FC<PlengLogoProps> = ({
  size = 'sm',
  showText = true,
  animated = false,
  className = '',
}) => {
  if (size === 'hero') {
    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        <div className="relative group cursor-pointer">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden shadow-[0_10px_35px_rgba(245,166,35,0.3)] border-2 border-amber-300/80 bg-amber-400 transition-transform duration-300 group-hover:scale-105">
            <img
              src="/logo-wordmark.jpg"
              alt="Pleng Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#000000] text-amber-400 text-xs font-bold font-mono shadow-md border border-amber-400/40 whitespace-nowrap">
            pleng.online
          </div>
        </div>
      </div>
    );
  }

  // Dimensions based on size
  const iconSize = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    hero: 'w-20 h-20 rounded-3xl',
  }[size];

  const textSize = {
    sm: 'text-base sm:text-lg',
    md: 'text-xl',
    lg: 'text-3xl sm:text-4xl',
    hero: 'text-5xl sm:text-6xl',
  }[size];

  const badgeSize = {
    sm: 'text-[10px] px-1.5 py-0.5 ml-1',
    md: 'text-xs px-2 py-0.5 ml-1.5',
    lg: 'text-sm px-2.5 py-1 ml-2',
    hero: 'text-base px-3 py-1 ml-2.5',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 select-none ${className}`}>
      {/* Brand Icon Mark - 3D Clay P with Headphones Mascot */}
      <div
        className={`relative ${iconSize} overflow-hidden border border-amber-300/80 shadow-[0_2px_6px_rgba(245,166,35,0.25)] shrink-0 flex items-center justify-center bg-amber-400 group-hover:shadow-[0_4px_12px_rgba(245,166,35,0.4)] group-hover:scale-105 transition-all duration-200`}
      >
        <img
          src="/logo-icon.jpg"
          alt="Pleng Icon"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Brand Text Typography with Capital 'P' */}
      {showText && (
        <div className="flex items-center tracking-tight leading-none">
          <span className={`${textSize} font-black text-[#000000] tracking-[-0.03em]`}>
            Pleng
          </span>
          <span
            className={`${badgeSize} font-bold rounded-md bg-[#000000] text-amber-400 font-mono shadow-xs border border-amber-400/30`}
          >
            .online
          </span>
        </div>
      )}
    </div>
  );
};
