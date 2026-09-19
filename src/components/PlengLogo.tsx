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
    sm: 'w-8 h-8 rounded-xl',
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
      {/* Brand Icon Mark */}
      <div
        className={`relative ${iconSize} bg-gradient-to-tr from-[#7c3aed] via-[#a855f7] to-[#ec4899] p-[1.5px] shadow-lg shadow-purple-600/25 shrink-0 flex items-center justify-center group-hover:scale-105 transition-all duration-300`}
      >
        {/* Inner Dark Glass Disc */}
        <div className="w-full h-full bg-[#0e1017] rounded-[inherit] flex items-center justify-center relative overflow-hidden backdrop-blur-md">
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/20 via-transparent to-pink-500/20 opacity-80" />

          {/* Equalizer Wave Bars SVG */}
          <svg
            className={`${svgDimension} relative z-10`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="plengGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="50%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            {/* 5 Equalizer Bars */}
            <rect
              x="2"
              y="9"
              width="2.6"
              height="6"
              rx="1.3"
              fill="url(#plengGrad)"
              className={animated ? 'animate-[pulse_1.2s_ease-in-out_infinite]' : ''}
            />
            <rect
              x="6.6"
              y="5"
              width="2.6"
              height="14"
              rx="1.3"
              fill="url(#plengGrad)"
              className={animated ? 'animate-[pulse_0.9s_ease-in-out_infinite]' : ''}
            />
            <rect
              x="11.2"
              y="2"
              width="2.6"
              height="20"
              rx="1.3"
              fill="url(#plengGrad)"
              className={animated ? 'animate-[pulse_1.4s_ease-in-out_infinite]' : ''}
            />
            <rect
              x="15.8"
              y="6"
              width="2.6"
              height="12"
              rx="1.3"
              fill="url(#plengGrad)"
              className={animated ? 'animate-[pulse_0.8s_ease-in-out_infinite]' : ''}
            />
            <rect
              x="20.4"
              y="10"
              width="2.6"
              height="5"
              rx="1.3"
              fill="url(#plengGrad)"
              className={animated ? 'animate-[pulse_1.1s_ease-in-out_infinite]' : ''}
            />
          </svg>
        </div>
      </div>

      {/* Brand Text Typography */}
      {showText && (
        <div className="flex items-center tracking-tight leading-none">
          <span className={`${textSize} font-black text-white tracking-tight`}>
            pleng
          </span>
          <span
            className={`${badgeSize} font-bold rounded-lg bg-gradient-to-r from-violet-950/80 to-pink-950/60 border border-violet-500/40 text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 shadow-sm shadow-purple-500/10 font-mono`}
          >
            .online
          </span>
        </div>
      )}
    </div>
  );
};
