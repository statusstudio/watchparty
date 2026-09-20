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
  // Dimensions based on size
  const iconSize = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    hero: 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl',
  }[size];

  const svgDimension = {
    sm: 'w-4.5 h-4.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    hero: 'w-8 h-8 sm:w-10 sm:h-10',
  }[size];

  const textSize = {
    sm: 'text-base sm:text-lg',
    md: 'text-xl',
    lg: 'text-3xl sm:text-4xl',
    hero: 'text-4xl sm:text-6xl md:text-7xl',
  }[size];

  const badgeSize = {
    sm: 'text-[10px] px-1.5 py-0.5 ml-1',
    md: 'text-xs px-2 py-0.5 ml-1.5',
    lg: 'text-sm px-2.5 py-1 ml-2',
    hero: 'text-sm sm:text-base px-3 py-1 sm:px-3.5 sm:py-1 ml-2 sm:ml-2.5',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 select-none ${className}`}>
      {/* Brand Icon Mark - Notion Clean Paper Tile */}
      <div
        className={`relative ${iconSize} bg-white border border-[#e6e6e6] shadow-[0_1px_3px_rgba(0,0,0,0.06)] shrink-0 flex items-center justify-center group-hover:border-[#0075de]/40 group-hover:shadow-[0_2px_8px_rgba(0,117,222,0.15)] transition-all duration-200`}
      >
        {/* Equalizer Wave Bars SVG in Notion Blue + Sticker Palette */}
        <svg
          className={`${svgDimension} relative z-10`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 5 Equalizer Bars */}
          <rect
            x="2"
            y="9"
            width="2.6"
            height="6"
            rx="1.3"
            fill="#62aef0"
            className={animated ? 'animate-[pulse_1.2s_ease-in-out_infinite]' : ''}
          />
          <rect
            x="6.6"
            y="5"
            width="2.6"
            height="14"
            rx="1.3"
            fill="#0075de"
            className={animated ? 'animate-[pulse_0.9s_ease-in-out_infinite]' : ''}
          />
          <rect
            x="11.2"
            y="2"
            width="2.6"
            height="20"
            rx="1.3"
            fill="#005bab"
            className={animated ? 'animate-[pulse_1.4s_ease-in-out_infinite]' : ''}
          />
          <rect
            x="15.8"
            y="6"
            width="2.6"
            height="12"
            rx="1.3"
            fill="#ff64c8"
            className={animated ? 'animate-[pulse_0.8s_ease-in-out_infinite]' : ''}
          />
          <rect
            x="20.4"
            y="10"
            width="2.6"
            height="5"
            rx="1.3"
            fill="#2a9d99"
            className={animated ? 'animate-[pulse_1.1s_ease-in-out_infinite]' : ''}
          />
        </svg>
      </div>

      {/* Brand Text Typography - Notion Ink */}
      {showText && (
        <div className="flex items-center tracking-tight leading-none">
          <span className={`${textSize} font-bold text-[#000000] tracking-[-0.04em]`}>
            pleng
          </span>
          <span
            className={`${badgeSize} font-semibold rounded-md bg-[#0075de]/10 border border-[#0075de]/20 text-[#0075de] font-mono shadow-xs`}
          >
            .online
          </span>
        </div>
      )}
    </div>
  );
};
