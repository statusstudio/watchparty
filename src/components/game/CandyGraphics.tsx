import React from 'react';

// ---------------------------------------------------------------------------
// 100% AUTHENTIC KING CANDY CRUSH SAGA 3D VECTOR CANDIES
// ---------------------------------------------------------------------------

// 1. Red Jelly Bean (Iconic kidney bean shape with curved spine highlight)
export const RedCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 7px rgba(0,0,0,0.55))' }}>
    <defs>
      <radialGradient id="redBeanGrad" cx="32%" cy="28%" r="72%">
        <stop offset="0%" stopColor="#ff9ebb" />
        <stop offset="25%" stopColor="#ef233c" />
        <stop offset="70%" stopColor="#b70928" />
        <stop offset="100%" stopColor="#4a040d" />
      </radialGradient>
      <linearGradient id="redSpineShine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <path
      d="M 28 14 C 58 6, 86 28, 82 58 C 76 84, 46 94, 26 82 C 10 72, 8 46, 14 32 C 18 22, 22 16, 28 14 Z"
      fill="#220104"
      opacity="0.38"
      transform="translate(0, 4)"
    />
    <path
      d="M 28 14 C 58 6, 86 28, 82 58 C 76 84, 46 94, 26 82 C 10 72, 8 46, 14 32 C 18 22, 22 16, 28 14 Z"
      fill="url(#redBeanGrad)"
      stroke="#ff6b81"
      strokeWidth="1.8"
    />
    <path
      d="M 30 22 C 54 16, 74 30, 72 50"
      fill="none"
      stroke="url(#redSpineShine)"
      strokeWidth="5.5"
      strokeLinecap="round"
    />
    <circle cx="34" cy="24" r="3.2" fill="#ffffff" opacity="0.9" />
    <path
      d="M 34 76 C 48 84, 66 74, 72 62"
      fill="none"
      stroke="#ffb3c1"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.35"
    />
  </svg>
);

// 2. Purple Grape Cluster (6-Lobed Confectionery)
export const PurpleCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 7px rgba(0,0,0,0.55))' }}>
    <defs>
      <radialGradient id="purpGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#f3e8ff" />
        <stop offset="30%" stopColor="#a855f7" />
        <stop offset="75%" stopColor="#7e22ce" />
        <stop offset="100%" stopColor="#3b0764" />
      </radialGradient>
    </defs>
    <g transform="translate(0, 4)" opacity="0.38">
      <circle cx="50" cy="30" r="18" fill="#1b0330" />
      <circle cx="68" cy="42" r="18" fill="#1b0330" />
      <circle cx="64" cy="66" r="18" fill="#1b0330" />
      <circle cx="50" cy="74" r="18" fill="#1b0330" />
      <circle cx="36" cy="66" r="18" fill="#1b0330" />
      <circle cx="32" cy="42" r="18" fill="#1b0330" />
      <circle cx="50" cy="50" r="22" fill="#1b0330" />
    </g>
    <g stroke="#c084fc" strokeWidth="1.5">
      <circle cx="50" cy="30" r="18" fill="url(#purpGrad)" />
      <circle cx="68" cy="42" r="18" fill="url(#purpGrad)" />
      <circle cx="64" cy="66" r="18" fill="url(#purpGrad)" />
      <circle cx="50" cy="74" r="18" fill="url(#purpGrad)" />
      <circle cx="36" cy="66" r="18" fill="url(#purpGrad)" />
      <circle cx="32" cy="42" r="18" fill="url(#purpGrad)" />
      <circle cx="50" cy="50" r="22" fill="url(#purpGrad)" stroke="none" />
    </g>
    <circle cx="34" cy="34" r="4" fill="#ffffff" opacity="0.85" />
    <circle cx="48" cy="24" r="3" fill="#ffffff" opacity="0.75" />
    <circle cx="64" cy="38" r="3" fill="#ffffff" opacity="0.65" />
    <circle cx="50" cy="48" r="4.5" fill="#ffffff" opacity="0.7" />
    <ellipse cx="50" cy="76" rx="16" ry="5" fill="#d8b4fe" opacity="0.25" />
  </svg>
);

// 3. Yellow Lemon Drop (Pointed teardrop with sunshine lemon gradient)
export const YellowCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 7px rgba(0,0,0,0.55))' }}>
    <defs>
      <radialGradient id="yelGrad" cx="40%" cy="32%" r="70%">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="35%" stopColor="#eab308" />
        <stop offset="80%" stopColor="#a16207" />
        <stop offset="100%" stopColor="#422006" />
      </radialGradient>
    </defs>
    <path
      d="M 50 12 C 50 12, 18 50, 18 68 C 18 86, 32 94, 50 94 C 68 94, 82 86, 82 68 C 82 50, 50 12, 50 12 Z"
      fill="#251202"
      opacity="0.38"
      transform="translate(0, 4)"
    />
    <path
      d="M 50 12 C 50 12, 18 50, 18 68 C 18 86, 32 94, 50 94 C 68 94, 82 86, 82 68 C 82 50, 50 12, 50 12 Z"
      fill="url(#yelGrad)"
      stroke="#fde047"
      strokeWidth="1.8"
    />
    <path
      d="M 46 22 C 32 40, 26 58, 28 72"
      fill="none"
      stroke="#ffffff"
      strokeWidth="5"
      strokeLinecap="round"
      opacity="0.82"
    />
    <circle cx="50" cy="18" r="3.5" fill="#ffffff" opacity="0.9" />
    <ellipse cx="50" cy="80" rx="18" ry="6" fill="#fef08a" opacity="0.3" />
  </svg>
);

// 4. Green Cushion / Chiclet (Rounded Square Lozenge)
export const GreenCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 7px rgba(0,0,0,0.55))' }}>
    <defs>
      <radialGradient id="grnGrad" cx="36%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#dcfce7" />
        <stop offset="30%" stopColor="#22c55e" />
        <stop offset="75%" stopColor="#15803d" />
        <stop offset="100%" stopColor="#052e16" />
      </radialGradient>
    </defs>
    <rect x="14" y="18" width="72" height="72" rx="22" fill="#021c0b" opacity="0.38" />
    <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#grnGrad)" stroke="#4ade80" strokeWidth="2" />
    <path d="M 26 24 L 74 24 C 74 24, 70 34, 50 34 C 30 34, 26 24, 26 24 Z" fill="#ffffff" opacity="0.45" />
    <circle cx="32" cy="30" r="5.5" fill="#ffffff" opacity="0.85" />
    <circle cx="46" cy="28" r="3" fill="#ffffff" opacity="0.65" />
    <ellipse cx="50" cy="74" rx="24" ry="5" fill="#86efac" opacity="0.25" />
  </svg>
);

// 5. Orange Lozenge (Pill/Oval shape with beveled candy shell)
export const OrangeCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 7px rgba(0,0,0,0.55))' }}>
    <defs>
      <radialGradient id="orngGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="30%" stopColor="#f97316" />
        <stop offset="75%" stopColor="#c2410c" />
        <stop offset="100%" stopColor="#431407" />
      </radialGradient>
      <linearGradient id="orngGlare" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="54" rx="44" ry="26" fill="#2d0d04" opacity="0.38" />
    <ellipse cx="50" cy="50" rx="44" ry="26" fill="url(#orngGrad)" stroke="#fb923c" strokeWidth="1.8" />
    <ellipse cx="38" cy="38" rx="16" ry="6" transform="rotate(-12 38 38)" fill="url(#orngGlare)" />
    <circle cx="64" cy="38" r="3.5" fill="#ffffff" opacity="0.75" />
    <ellipse cx="50" cy="66" rx="22" ry="4" fill="#fef08a" opacity="0.3" />
  </svg>
);

// 6. Blue Lollipop Sphere (Concentric sapphire reflections)
export const BlueCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 7px rgba(0,0,0,0.55))' }}>
    <defs>
      <radialGradient id="bluGrad" cx="34%" cy="28%" r="72%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="30%" stopColor="#0284c7" />
        <stop offset="75%" stopColor="#0369a1" />
        <stop offset="100%" stopColor="#082f49" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="54" r="41" fill="#041522" opacity="0.38" />
    <circle cx="50" cy="50" r="41" fill="url(#bluGrad)" stroke="#38bdf8" strokeWidth="2" />
    <path
      d="M 28 26 C 42 16, 68 22, 74 36 C 68 28, 46 24, 34 32 Z"
      fill="#ffffff"
      opacity="0.9"
    />
    <circle cx="34" cy="34" r="4.2" fill="#ffffff" opacity="0.9" />
    <ellipse cx="50" cy="78" rx="20" ry="6" fill="#7dd3fc" opacity="0.3" />
  </svg>
);

export const CANDY_COMPONENTS = [
  RedCandySVG,
  PurpleCandySVG,
  YellowCandySVG,
  GreenCandySVG,
  OrangeCandySVG,
  BlueCandySVG,
];

// 7. Striped Candy (Diagonal Confectioner Sugar Laser Stripes)
export const StripedCandySVG: React.FC<{ type: number; direction: 'h' | 'v'; className?: string }> = ({
  type,
  direction,
  className = 'w-full h-full',
}) => {
  const BaseCandy = CANDY_COMPONENTS[type] || CANDY_COMPONENTS[0];
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <BaseCandy />
      <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
        <defs>
          <linearGradient id={`strShine-${direction}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        {direction === 'h' ? (
          <g stroke={`url(#strShine-${direction})`} strokeWidth="8" strokeLinecap="round" opacity="0.95">
            <line x1="16" y1="34" x2="84" y2="34" />
            <line x1="12" y1="50" x2="88" y2="50" />
            <line x1="16" y1="66" x2="84" y2="66" />
          </g>
        ) : (
          <g stroke={`url(#strShine-${direction})`} strokeWidth="8" strokeLinecap="round" opacity="0.95">
            <line x1="34" y1="16" x2="34" y2="84" />
            <line x1="50" y1="12" x2="50" y2="88" />
            <line x1="66" y1="16" x2="66" y2="84" />
          </g>
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[14px] text-white font-black drop-shadow-[0_0_10px_rgba(255,255,255,1)] animate-pulse">
          {direction === 'h' ? '⬌' : '⬍'}
        </span>
      </div>
    </div>
  );
};

// 8. Wrapped Candy (3D Cellophane Wrapper with Twisted Bow Wings)
export const WrappedCandySVG: React.FC<{ type: number; className?: string }> = ({
  type,
  className = 'w-full h-full',
}) => {
  const BaseCandy = CANDY_COMPONENTS[type] || CANDY_COMPONENTS[0];
  return (
    <div className={`relative ${className} flex items-center justify-center p-0.5`}>
      <BaseCandy />
      <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
        <defs>
          <radialGradient id="wrapWing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#fef08a" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
          </radialGradient>
        </defs>
        <polygon points="12,50 2,28 3,72" fill="url(#wrapWing)" stroke="#ffffff" strokeWidth="1.2" />
        <polygon points="88,50 98,28 97,72" fill="url(#wrapWing)" stroke="#ffffff" strokeWidth="1.2" />
        <rect x="18" y="18" width="64" height="64" rx="18" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.92" />
      </svg>
      <div className="absolute -top-1 -right-1 text-[13px] animate-bounce">✨</div>
    </div>
  );
};

// 9. Color Bomb (Dark Chocolate Sphere Encrusted with Rainbow Sprinkles)
export const ColorBombSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.8))' }}>
    <defs>
      <radialGradient id="chocTruffle" cx="34%" cy="28%" r="72%">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="35%" stopColor="#451a03" />
        <stop offset="80%" stopColor="#240c02" />
        <stop offset="100%" stopColor="#0f0501" />
      </radialGradient>
      <radialGradient id="rainbowAura" cx="50%" cy="50%" r="50%">
        <stop offset="60%" stopColor="transparent" />
        <stop offset="85%" stopColor="#ec4899" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#rainbowAura)" />
    <circle cx="50" cy="54" r="41" fill="#080200" opacity="0.45" />
    <circle cx="50" cy="50" r="41" fill="url(#chocTruffle)" stroke="#d97706" strokeWidth="2" />
    
    {/* 16 Rainbow Sprinkles */}
    <circle cx="34" cy="28" r="4.2" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="33" cy="27" r="1.2" fill="#ffffff" />
    <circle cx="68" cy="46" r="4.2" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="67" cy="45" r="1.2" fill="#ffffff" />

    <circle cx="48" cy="22" r="4.2" fill="#0284c7" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="47" cy="21" r="1.2" fill="#ffffff" />
    <circle cx="28" cy="58" r="4.2" fill="#0284c7" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="27" cy="57" r="1.2" fill="#ffffff" />

    <circle cx="64" cy="28" r="4.2" fill="#22c55e" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="63" cy="27" r="1.2" fill="#ffffff" />
    <circle cx="44" cy="68" r="4.2" fill="#22c55e" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="43" cy="67" r="1.2" fill="#ffffff" />

    <circle cx="50" cy="44" r="4.8" fill="#eab308" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="49" cy="43" r="1.4" fill="#ffffff" />
    <circle cx="24" cy="42" r="4.2" fill="#eab308" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="23" cy="41" r="1.2" fill="#ffffff" />

    <circle cx="60" cy="64" r="4.2" fill="#f97316" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="59" cy="63" r="1.2" fill="#ffffff" />
    <circle cx="36" cy="48" r="3.8" fill="#f97316" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="35" cy="47" r="1.2" fill="#ffffff" />

    <circle cx="58" cy="36" r="3.8" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="57" cy="35" r="1.2" fill="#ffffff" />
    <circle cx="48" cy="60" r="4.2" fill="#ec4899" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="47" cy="59" r="1.2" fill="#ffffff" />

    <ellipse cx="38" cy="26" rx="9" ry="4" transform="rotate(-30 38 26)" fill="#ffffff" opacity="0.65" />
  </svg>
);
