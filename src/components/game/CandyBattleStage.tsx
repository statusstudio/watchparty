import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CandyBattleGameState,
  CandyBattlePlayer,
  CandyItemType,
  UserProfile,
  UserRole,
} from '../../types/index.js';
import {
  playCandyPop,
  playItemRevealSound,
  playAttackHitSound,
  playHealSound,
  playShieldSound,
  playFirestormSound,
  playHammerSmashSound,
  playCountdownBeep,
  playVictoryFanfare,
} from '../../services/candySoundEffects.js';

interface CandyBattleStageProps {
  gameState: CandyBattleGameState | null;
  currentUser: UserProfile;
  myRole?: UserRole;
  onJoinLobby: () => void;
  onLeaveLobby: () => void;
  onStartGame: () => void;
  onStopGame: () => void;
  onAttack: (damage: number, combo: number, targetUserId?: string) => void;
  onUseItem: (itemType: CandyItemType) => void;
  onSelectTarget: (targetUserId: string) => void;
  onSwap?: (r1: number, c1: number, r2: number, c2: number) => void;
  onHammer?: (r: number, c: number) => void;
  theme?: 'dark' | 'light';
}
// ---------------------------------------------------------------------------
// 6 WE SING CANDY VECTOR SPRITES (3D Authentic Assets)
// ---------------------------------------------------------------------------

// 1. Red Dome / Lollipop Button with Curved Rim
const RedCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
    <defs>
      <radialGradient id="redDomeGrad" cx="36%" cy="32%" r="68%">
        <stop offset="0%" stopColor="#ff7b89" />
        <stop offset="30%" stopColor="#f43f5e" />
        <stop offset="70%" stopColor="#be123c" />
        <stop offset="100%" stopColor="#700619" />
      </radialGradient>
      <linearGradient id="redRimGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>
    </defs>
    {/* Base Collar / Rim */}
    <ellipse cx="50" cy="56" rx="43" ry="34" fill="url(#redRimGrad)" />
    {/* Main Dome */}
    <ellipse cx="50" cy="48" rx="40" ry="34" fill="url(#redDomeGrad)" />
    {/* Curved Specular Glare */}
    <path d="M 25 35 A 26 20 0 0 1 65 25 A 26 20 0 0 0 28 42 Z" fill="#ffffff" opacity="0.7" />
    {/* Bottom Bounce Light */}
    <ellipse cx="50" cy="72" rx="20" ry="5" fill="#fda4af" opacity="0.35" />
  </svg>
);

// 2. Purple Disc with Concentric Swirl (🌀)
const PurpleCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
    <defs>
      <radialGradient id="purpleBaseGrad" cx="38%" cy="32%" r="68%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="45%" stopColor="#9333ea" />
        <stop offset="85%" stopColor="#6b21a8" />
        <stop offset="100%" stopColor="#3b0764" />
      </radialGradient>
      <radialGradient id="swirlLightGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#f3e8ff" />
        <stop offset="100%" stopColor="#d8b4fe" />
      </radialGradient>
    </defs>
    {/* Base rim */}
    <circle cx="50" cy="53" r="41" fill="#2e1065" opacity="0.6" />
    {/* Disc Body */}
    <circle cx="50" cy="49" r="41" fill="url(#purpleBaseGrad)" stroke="#c084fc" strokeWidth="1.5" />
    {/* Spiral Swirl Path */}
    <path
      d="M 50 49 
         A 5 5 0 0 1 55 49 
         A 10 10 0 0 1 45 49 
         A 16 16 0 0 1 61 49 
         A 23 23 0 0 1 37 49 
         A 31 31 0 0 1 70 49"
      fill="none"
      stroke="url(#swirlLightGrad)"
      strokeWidth="5"
      strokeLinecap="round"
      opacity="0.95"
    />
    {/* Specular Glare */}
    <ellipse cx="32" cy="27" rx="8" ry="4" transform="rotate(-28 32 27)" fill="#ffffff" opacity="0.6" />
  </svg>
);

// 3. Yellow Teardrop with 3 Horizontal Curved Wave Ridges
const YellowCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
    <defs>
      <radialGradient id="yellowBodyGrad" cx="38%" cy="36%" r="66%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="35%" stopColor="#eab308" />
        <stop offset="85%" stopColor="#ca8a04" />
        <stop offset="100%" stopColor="#713f12" />
      </radialGradient>
    </defs>
    {/* Drop base shadow */}
    <path
      d="M 50 14 C 50 14, 15 54, 15 68 C 15 84, 30 92, 50 92 C 70 92, 85 84, 85 68 C 85 54, 50 14, 50 14 Z"
      fill="#422006"
      opacity="0.4"
      transform="translate(0, 3)"
    />
    {/* Teardrop Body */}
    <path
      d="M 50 12 C 50 12, 15 52, 15 67 C 15 83, 30 91, 50 91 C 70 91, 85 83, 85 67 C 85 52, 50 12, 50 12 Z"
      fill="url(#yellowBodyGrad)"
      stroke="#fef08a"
      strokeWidth="1.5"
    />
    {/* 3 Horizontal Wave Ridges */}
    <path d="M 28 54 Q 50 61 72 54" fill="none" stroke="#fef9c3" strokeWidth="4.2" strokeLinecap="round" opacity="0.85" />
    <path d="M 24 65 Q 50 73 76 65" fill="none" stroke="#fef9c3" strokeWidth="4.2" strokeLinecap="round" opacity="0.85" />
    <path d="M 30 76 Q 50 83 70 76" fill="none" stroke="#fef9c3" strokeWidth="3.8" strokeLinecap="round" opacity="0.8" />
    {/* Ridge Shadows for depth */}
    <path d="M 28 56 Q 50 63 72 56" fill="none" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M 24 67 Q 50 75 76 67" fill="none" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    {/* Top left tip shine */}
    <path d="M 45 22 Q 32 40 30 50" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" opacity="0.75" />
  </svg>
);

// 4. Green Diamond with Vertical White Candy Stripes
const GreenCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
    <defs>
      <radialGradient id="greenBodyGrad" cx="40%" cy="35%" r="66%">
        <stop offset="0%" stopColor="#86efac" />
        <stop offset="40%" stopColor="#22c55e" />
        <stop offset="85%" stopColor="#15803d" />
        <stop offset="100%" stopColor="#052e16" />
      </radialGradient>
      <clipPath id="greenDiamondClip">
        <path d="M 50 8 C 53 8, 55 10, 58 13 L 87 42 C 92 47, 92 53, 87 58 L 58 87 C 55 90, 45 90, 42 87 L 13 58 C 8 53, 8 47, 13 42 L 42 13 C 45 10, 47 8, 50 8 Z" />
      </clipPath>
    </defs>
    {/* Shadow base */}
    <path d="M 50 12 L 89 51 L 50 90 L 11 51 Z" fill="#022c22" opacity="0.5" transform="translate(0, 3)" />
    {/* Diamond Body with Stripes */}
    <g clipPath="url(#greenDiamondClip)">
      <rect x="0" y="0" width="100" height="100" fill="url(#greenBodyGrad)" />
      {/* Vertical white candy stripes */}
      <rect x="36" y="0" width="8" height="100" fill="#f0fdf4" opacity="0.88" />
      <rect x="56" y="0" width="8" height="100" fill="#f0fdf4" opacity="0.88" />
      <rect x="23" y="0" width="5" height="100" fill="#f0fdf4" opacity="0.75" />
      <rect x="72" y="0" width="5" height="100" fill="#f0fdf4" opacity="0.75" />
    </g>
    {/* Shiny rim outline */}
    <path
      d="M 50 8 C 53 8, 55 10, 58 13 L 87 42 C 92 47, 92 53, 87 58 L 58 87 C 55 90, 45 90, 42 87 L 13 58 C 8 53, 8 47, 13 42 L 42 13 C 45 10, 47 8, 50 8 Z"
      fill="none"
      stroke="#bbf7d0"
      strokeWidth="1.5"
    />
    {/* Glare on upper left facet */}
    <path d="M 43 16 L 22 38" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
  </svg>
);

// 5. Orange Rounded-Square with Embossed Pinwheel
const OrangeCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
    <defs>
      <radialGradient id="orangeBodyGrad" cx="38%" cy="32%" r="66%">
        <stop offset="0%" stopColor="#fdba74" />
        <stop offset="40%" stopColor="#f97316" />
        <stop offset="85%" stopColor="#c2410c" />
        <stop offset="100%" stopColor="#431407" />
      </radialGradient>
      <linearGradient id="pinwheelGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffedd5" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
    </defs>
    {/* Drop base shadow */}
    <rect x="13" y="15" width="74" height="74" rx="20" fill="#431407" opacity="0.5" />
    {/* Body */}
    <rect x="13" y="11" width="74" height="74" rx="20" fill="url(#orangeBodyGrad)" stroke="#fdba74" strokeWidth="1.8" />
    {/* Embossed Pinwheel Center */}
    <g transform="translate(50, 48)">
      <path d="M 0 0 Q 12 -12 24 -6 Q 16 4 0 0" fill="url(#pinwheelGrad)" opacity="0.9" />
      <path d="M 0 0 Q 12 12 6 24 Q -4 16 0 0" fill="url(#pinwheelGrad)" opacity="0.9" />
      <path d="M 0 0 Q -12 12 -24 6 Q -16 -4 0 0" fill="url(#pinwheelGrad)" opacity="0.9" />
      <path d="M 0 0 Q -12 -12 -6 -24 Q 4 -16 0 0" fill="url(#pinwheelGrad)" opacity="0.9" />
      <circle cx="0" cy="0" r="4" fill="#ffffff" />
    </g>
    {/* Glare */}
    <ellipse cx="28" cy="24" rx="8" ry="4" transform="rotate(-30 28 24)" fill="#ffffff" opacity="0.65" />
  </svg>
);

// 6. Blue Horizontal Oval Pebble with 3 Wave Stripes
const BlueCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
    <defs>
      <radialGradient id="blueBodyGrad" cx="38%" cy="34%" r="66%">
        <stop offset="0%" stopColor="#7dd3fc" />
        <stop offset="35%" stopColor="#0284c7" />
        <stop offset="80%" stopColor="#0369a1" />
        <stop offset="100%" stopColor="#082f49" />
      </radialGradient>
    </defs>
    {/* Shadow base */}
    <ellipse cx="50" cy="54" rx="42" ry="34" fill="#082f49" opacity="0.5" />
    {/* Body */}
    <ellipse cx="50" cy="50" rx="42" ry="34" fill="url(#blueBodyGrad)" stroke="#38bdf8" strokeWidth="1.8" />
    {/* 3 Horizontal Wave Stripes */}
    <path d="M 18 42 Q 35 37 50 42 T 82 42" fill="none" stroke="#e0f2fe" strokeWidth="4.2" strokeLinecap="round" opacity="0.88" />
    <path d="M 16 53 Q 35 48 50 53 T 84 53" fill="none" stroke="#e0f2fe" strokeWidth="4.2" strokeLinecap="round" opacity="0.88" />
    <path d="M 22 64 Q 35 59 50 64 T 78 64" fill="none" stroke="#e0f2fe" strokeWidth="3.8" strokeLinecap="round" opacity="0.82" />
    {/* Top left glare */}
    <ellipse cx="32" cy="29" rx="9" ry="4" transform="rotate(-20 32 29)" fill="#ffffff" opacity="0.65" />
  </svg>
);

// Array of Candy Components mapped by id 0..5
const CANDY_COMPONENTS = [
  RedCandySVG,
  PurpleCandySVG,
  YellowCandySVG,
  GreenCandySVG,
  OrangeCandySVG,
  BlueCandySVG,
];

// Mystery Aura Ring (Swirling glowing white/cyan energy portal around mystery candies)
const MysteryAuraRing: React.FC = () => (
  <div className="absolute -inset-1.5 pointer-events-none z-10 flex items-center justify-center">
    {/* Animated glowing portal halo */}
    <div className="w-full h-full rounded-full border-2 border-cyan-200/90 shadow-[0_0_12px_rgba(165,243,252,0.9),inset_0_0_8px_rgba(255,255,255,0.7)] animate-spin-slow bg-gradient-to-tr from-cyan-400/20 via-white/30 to-purple-400/20" />
    {/* 4 Sparkling stars */}
    <span className="absolute -top-1 left-1 text-[9px] text-white animate-pulse">✦</span>
    <span className="absolute -bottom-1 right-1 text-[9px] text-cyan-200 animate-pulse">✦</span>
  </div>
);

// ---------------------------------------------------------------------------
// 4 BOTTOM ITEM ICONS (Exact WeSing Designs)
// ---------------------------------------------------------------------------

// 1. Heal Item: Red blood drop with white (+) cross inside
const ItemHealSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <radialGradient id="healDropGrad" cx="38%" cy="36%" r="66%">
        <stop offset="0%" stopColor="#fca5a5" />
        <stop offset="35%" stopColor="#ef4444" />
        <stop offset="85%" stopColor="#b91c1c" />
        <stop offset="100%" stopColor="#450a0a" />
      </radialGradient>
    </defs>
    {/* Droplet Shape */}
    <path
      d="M 50 14 C 50 14, 18 52, 18 68 C 18 84, 32 92, 50 92 C 68 92, 82 84, 82 68 C 82 52, 50 14, 50 14 Z"
      fill="url(#healDropGrad)"
      stroke="#fca5a5"
      strokeWidth="2"
      style={{ filter: 'drop-shadow(0 2px 5px rgba(239,68,68,0.6))' }}
    />
    {/* White (+) Cross Inside */}
    <rect x="44" y="52" width="12" height="26" rx="3" fill="#ffffff" />
    <rect x="37" y="59" width="26" height="12" rx="3" fill="#ffffff" />
    {/* Glare */}
    <path d="M 46 24 Q 32 42 30 52" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
  </svg>
);

// 2. Hammer Item: 3D Yellow Swirl Lollipop Hammer with Tilted Wooden Handle
const ItemHammerSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <radialGradient id="hammerHeadGrad" cx="36%" cy="34%" r="66%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#eab308" />
        <stop offset="85%" stopColor="#a16207" />
        <stop offset="100%" stopColor="#422006" />
      </radialGradient>
      <linearGradient id="handleGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>
    <g transform="rotate(15 50 50)" style={{ filter: 'drop-shadow(0 2px 5px rgba(234,179,8,0.6))' }}>
      {/* Wooden handle tilted */}
      <rect x="45" y="42" width="10" height="46" rx="4" fill="url(#handleGrad)" stroke="#78350f" strokeWidth="1" />
      {/* Hammer Mallet Head (Lollipop Bar) */}
      <rect x="20" y="22" width="60" height="26" rx="10" fill="url(#hammerHeadGrad)" stroke="#fef08a" strokeWidth="2" />
      {/* Swirl ridges on head */}
      <ellipse cx="24" cy="35" rx="5" ry="11" fill="#fef9c3" opacity="0.75" />
      <ellipse cx="76" cy="35" rx="5" ry="11" fill="#713f12" opacity="0.6" />
      <line x1="38" y1="23" x2="38" y2="47" stroke="#fef9c3" strokeWidth="2.5" opacity="0.7" />
      <line x1="50" y1="23" x2="50" y2="47" stroke="#fef9c3" strokeWidth="2.5" opacity="0.7" />
      <line x1="62" y1="23" x2="62" y2="47" stroke="#fef9c3" strokeWidth="2.5" opacity="0.7" />
    </g>
  </svg>
);

// 3. Shield Item: Green/Cyan Turtle Hex Honeycomb Shield
const ItemShieldSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <radialGradient id="shieldBgGrad" cx="38%" cy="32%" r="66%">
        <stop offset="0%" stopColor="#a7f3d0" />
        <stop offset="40%" stopColor="#10b981" />
        <stop offset="85%" stopColor="#047857" />
        <stop offset="100%" stopColor="#064e3b" />
      </radialGradient>
    </defs>
    {/* Shield Base Shape */}
    <path
      d="M 50 14 Q 78 14 82 32 Q 82 66 50 88 Q 18 66 18 32 Q 22 14 50 14 Z"
      fill="url(#shieldBgGrad)"
      stroke="#6ee7b7"
      strokeWidth="2.5"
      style={{ filter: 'drop-shadow(0 2px 5px rgba(16,185,129,0.6))' }}
    />
    {/* Turtle Hex Honeycomb Pattern */}
    <g stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.8">
      {/* Center Hexagon */}
      <polygon points="50,40 60,46 60,58 50,64 40,58 40,46" />
      {/* Surrounding Hex Lines */}
      <line x1="50" y1="40" x2="50" y2="24" />
      <line x1="60" y1="46" x2="74" y2="38" />
      <line x1="60" y1="58" x2="74" y2="66" />
      <line x1="50" y1="64" x2="50" y2="80" />
      <line x1="40" y1="58" x2="26" y2="66" />
      <line x1="40" y1="46" x2="26" y2="38" />
    </g>
    {/* Glare */}
    <path d="M 30 24 Q 45 20 50 20" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
  </svg>
);

// 4. Firestorm Item: Dark core with 8-pointed fiery orange/red starburst explosion
const ItemFireSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <radialGradient id="fireBurstGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="25%" stopColor="#fef08a" />
        <stop offset="55%" stopColor="#f97316" />
        <stop offset="85%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </radialGradient>
    </defs>
    {/* 8-pointed starburst */}
    <path
      d="M 50 10 L 59 34 L 85 24 L 69 45 L 90 56 L 66 64 L 74 88 L 50 72 L 26 88 L 34 64 L 10 56 L 31 45 L 15 24 L 41 34 Z"
      fill="url(#fireBurstGrad)"
      stroke="#fef08a"
      strokeWidth="1.5"
      style={{ filter: 'drop-shadow(0 2px 6px rgba(239,68,68,0.7))' }}
    />
    {/* Incandescent white core */}
    <circle cx="50" cy="50" r="12" fill="#ffffff" opacity="0.9" />
  </svg>
);

// ---------------------------------------------------------------------------
// GRID & GAME CONSTANTS
// ---------------------------------------------------------------------------

const GRID_SIZE = 8; // Authentic WeSing 8x8 Grid
const CANDY_COUNT = 6;
const ITEM_TYPES: CandyItemType[] = ['heal', 'shield', 'fire', 'hammer'];

interface BoardTile {
  id: string;
  type: number;
  hasItem: boolean;
  itemType?: CandyItemType;
  isMatched?: boolean;
}

function createRandom8x8Board(): BoardTile[][] {
  const board: BoardTile[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: BoardTile[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let type: number;
      // Prevent 3-in-a-row on initial board
      do {
        type = Math.floor(Math.random() * CANDY_COUNT);
      } while (
        (c >= 2 && row[c - 1].type === type && row[c - 2].type === type) ||
        (r >= 2 && board[r - 1][c].type === type && board[r - 2][c].type === type)
      );

      // 18% chance to hold a hidden mystery item (surrounded by cyan glowing aura ring)
      const hasItem = Math.random() < 0.18;
      const itemType = hasItem ? ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)] : undefined;

      row.push({
        id: `tile-${r}-${c}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        hasItem,
        itemType,
      });
    }
    board.push(row);
  }
  return board;
}

// ---------------------------------------------------------------------------
// MAIN CANDY BATTLE STAGE COMPONENT
// ---------------------------------------------------------------------------

export const CandyBattleStage: React.FC<CandyBattleStageProps> = ({
  gameState,
  currentUser,
  myRole,
  onJoinLobby,
  onLeaveLobby,
  onStartGame,
  onStopGame,
  onAttack,
  onUseItem,
  onSelectTarget,
  onSwap,
  onHammer,
  theme = 'dark',
}) => {
  // Shared 8x8 Board from server
  const board = gameState?.board || [];
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeHammerMode, setActiveHammerMode] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [turnWaitToast, setTurnWaitToast] = useState(false);

  // Player Inventory
  const [inventory, setInventory] = useState<Record<CandyItemType, number>>({
    heal: 1,
    shield: 0,
    fire: 0,
    hammer: 1,
  });

  // Visual Effects
  const [recentItemRevealed, setRecentItemRevealed] = useState<{ name: string; item: CandyItemType } | null>(null);
  const [screenVFX, setScreenVFX] = useState<'fire' | 'heal' | 'shield' | null>(null);

  // Audio countdown ref
  const lastCountdownRef = useRef<number>(-1);
  const prevPhaseRef = useRef<string | undefined>(gameState?.phase);

  const myPlayer = gameState?.players.find((p) => p.userId === currentUser.id);
  const isHost = myPlayer?.isHost;
  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';
  const isMyTurn = gameState?.currentTurnUserId === currentUser.id;
  const currentTurnPlayer = gameState?.players.find((p) => p.userId === gameState?.currentTurnUserId);

  // Audio cues for countdown & victory
  useEffect(() => {
    if (gameState?.phase === 'countdown' && gameState.lobbyTimeLeft !== lastCountdownRef.current) {
      lastCountdownRef.current = gameState.lobbyTimeLeft;
      if (gameState.lobbyTimeLeft > 0) {
        playCountdownBeep(false);
      } else {
        playCountdownBeep(true);
      }
    }

    if (prevPhaseRef.current !== 'game_over' && gameState?.phase === 'game_over') {
      playVictoryFanfare();
    }
    prevPhaseRef.current = gameState?.phase;
  }, [gameState?.phase, gameState?.lobbyTimeLeft]);

  // Reset local helpers on playing start
  useEffect(() => {
    if (gameState?.phase === 'playing') {
      setInventory({ heal: 1, shield: 0, fire: 0, hammer: 1 });
      setActiveHammerMode(false);
      setShowTargetModal(false);
      setSelectedCell(null);
    }
  }, [gameState?.phase]);

  // Toast auto-dismiss
  useEffect(() => {
    if (recentItemRevealed) {
      const timer = setTimeout(() => setRecentItemRevealed(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [recentItemRevealed]);

  useEffect(() => {
    if (screenVFX) {
      const timer = setTimeout(() => setScreenVFX(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [screenVFX]);

  // Handle cell click (Shared Turn-Based Swap or Hammer)
  const handleCellClick = (r: number, c: number) => {
    if (gameState?.phase !== 'playing' || myPlayer?.isDead || isProcessing) return;

    // Check Turn
    if (!isMyTurn) {
      playCountdownBeep(false);
      setTurnWaitToast(true);
      setTimeout(() => setTurnWaitToast(false), 1800);
      return;
    }

    // Hammer smash mode
    if (activeHammerMode) {
      playHammerSmashSound();
      setActiveHammerMode(false);
      if (onHammer) onHammer(r, c);
      return;
    }

    // Regular Match-3 Click Selection
    if (!selectedCell) {
      setSelectedCell({ r, c });
      return;
    }

    const { r: r1, c: c1 } = selectedCell;
    const isAdjacent = Math.abs(r - r1) + Math.abs(c - c1) === 1;

    if (!isAdjacent) {
      setSelectedCell({ r, c });
      return;
    }

    // Trigger Swap on shared server board
    setIsProcessing(true);
    setSelectedCell(null);
    if (onSwap) {
      onSwap(r1, c1, r, c);
    }
    setTimeout(() => setIsProcessing(false), 300);
  };

  // Handle Item Use
  const handleTriggerItem = (item: CandyItemType) => {
    if (inventory[item] <= 0 || myPlayer?.isDead) return;

    if (item === 'hammer') {
      setActiveHammerMode(!activeHammerMode);
      return;
    }

    setInventory((prev) => ({ ...prev, [item]: Math.max(0, prev[item] - 1) }));

    if (item === 'heal') {
      playHealSound();
      setScreenVFX('heal');
    } else if (item === 'shield') {
      playShieldSound();
      setScreenVFX('shield');
    } else if (item === 'fire') {
      playFirestormSound();
      setScreenVFX('fire');
    }

    onUseItem(item);
  };

  // -------------------------------------------------------------------------
  // 1. LOBBY VIEW (Authentic WeSing Waiting Room)
  // -------------------------------------------------------------------------
  if (!gameState || gameState.phase === 'waiting' || gameState.phase === 'countdown') {
    const players = gameState?.players || [];
    const isFull = players.length >= 4;
    const isCountdown = gameState?.phase === 'countdown';

    return (
      <div className="w-full h-full flex-1 flex flex-col justify-between items-center p-3 sm:p-5 relative overflow-hidden select-none bg-gradient-to-b from-[#2e2b7a] via-[#3b3598] to-[#1e1b58] text-white font-sans rounded-2xl">
        {/* Soft Swirl Texture Background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 40%),
                              radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 40%)`,
          }}
        />

        {/* Top Header */}
        <div className="w-full max-w-xl flex items-center justify-between z-10 pt-1 px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              <RedCandySVG />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#ffdd55] drop-shadow-[0_2px_4px_rgba(180,83,9,0.8)]">
                Candy Master
              </span>
              <span className="text-[10px] font-bold text-amber-200 tracking-wider">
                BATTLE ROYALE (4 PLAYERS)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelpModal(true)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center font-black text-white text-base shadow-md cursor-pointer transition-transform active:scale-90"
              title="กติกาการเล่น"
            >
              ?
            </button>
            {isAdminOrOwner && (
              <button
                onClick={onStopGame}
                className="w-8 h-8 rounded-full bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/30 flex items-center justify-center text-rose-300 text-xs shadow-md cursor-pointer transition-transform active:scale-90"
                title="ปิดเกม"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Center: Ribbon Banner + 4 Circular Slots */}
        <div className="w-full max-w-lg flex flex-col items-center my-auto z-10 py-4">
          <div className="relative mb-6">
            <div className="px-8 sm:px-12 py-2 rounded-full bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#16a34a] text-white font-black text-base sm:text-lg tracking-wide shadow-[0_6px_20px_rgba(34,197,94,0.5),inset_0_2px_4px_rgba(255,255,255,0.6)] border-2 border-[#86efac] flex items-center justify-center gap-2">
              <span className="drop-shadow-md">
                {isCountdown
                  ? `กำลังเริ่มเกมใน ${gameState.lobbyTimeLeft}s...`
                  : `รอผู้เล่น (${players.length}/4)`}
              </span>
            </div>
            <div className="absolute -left-3 top-2 w-4 h-6 bg-[#15803d] -z-10 rounded-l-md transform -skew-y-12" />
            <div className="absolute -right-3 top-2 w-4 h-6 bg-[#15803d] -z-10 rounded-r-md transform skew-y-12" />
          </div>

          <div className="w-full grid grid-cols-4 gap-2 sm:gap-4 px-2">
            {[0, 1, 2, 3].map((slotIdx) => {
              const player = players[slotIdx];

              return (
                <div key={slotIdx} className="flex flex-col items-center">
                  <div className="relative">
                    {player ? (
                      <>
                        <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full p-1 bg-gradient-to-b from-[#4ade80] to-[#15803d] shadow-[0_4px_16px_rgba(34,197,94,0.6)]">
                          <img
                            src={player.avatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                            alt={player.userName}
                            className="w-full h-full rounded-full object-cover border-2 border-white"
                          />
                        </div>

                        {player.isHost && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-[#ef4444] border-2 border-white text-[10px] shadow-md flex items-center justify-center">
                            🏠
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={onJoinLobby}
                        disabled={!!myPlayer}
                        className="w-14 h-14 sm:w-18 sm:h-18 rounded-full border-2 border-dashed border-white/40 bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group shadow-inner"
                      >
                        <span className="material-symbols-outlined text-white/60 group-hover:text-white text-2xl">
                          add
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="mt-2 text-center max-w-[80px]">
                    <p className="text-xs font-bold text-white truncate drop-shadow-sm">
                      {player ? player.userName : `ที่นั่ง ${slotIdx + 1}`}
                    </p>
                    {player && player.userId === currentUser.id && (
                      <button
                        onClick={onLeaveLobby}
                        className="text-[10px] text-rose-300 hover:text-rose-100 underline mt-0.5 cursor-pointer"
                      >
                        สละสิทธิ์
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="mt-6 flex flex-col items-center gap-3">
            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={players.length < 1 || isCountdown}
                className="px-10 py-2.5 sm:px-14 sm:py-3 rounded-full bg-gradient-to-b from-[#4ade80] via-[#22c55e] to-[#15803d] hover:brightness-110 active:scale-95 text-white font-black text-base sm:text-lg tracking-wide shadow-[0_8px_24px_rgba(34,197,94,0.6),inset_0_2px_4px_rgba(255,255,255,0.7)] border-2 border-[#86efac] cursor-pointer transition-all disabled:opacity-50"
              >
                เริ่มเกม (Start)
              </button>
            ) : !myPlayer && !isFull ? (
              <button
                onClick={onJoinLobby}
                className="px-10 py-2.5 sm:px-14 sm:py-3 rounded-full bg-gradient-to-b from-[#4ade80] via-[#22c55e] to-[#15803d] hover:brightness-110 active:scale-95 text-white font-black text-base sm:text-lg tracking-wide shadow-[0_8px_24px_rgba(34,197,94,0.6),inset_0_2px_4px_rgba(255,255,255,0.7)] border-2 border-[#86efac] cursor-pointer transition-all"
              >
                เข้าร่วม (Join)
              </button>
            ) : (
              <div className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-200 animate-pulse">
                ⏳ กำลังรอหัวหน้าห้องกดเริ่มเกม...
              </div>
            )}
          </div>
        </div>

        {/* Bottom Tip */}
        <div className="w-full max-w-md text-center text-xs text-white/70 py-1 z-10 px-4">
          💡 การใช้ไอเท็มอย่างเหมาะสมจะช่วยเพิ่มโอกาสชนะ
        </div>

        {/* Help Rules Modal */}
        {showHelpModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl p-5 bg-[#252269] border-2 border-cyan-300 shadow-2xl text-white">
              <div className="flex items-center justify-between border-b border-white/15 pb-2">
                <h3 className="font-black text-base text-yellow-300">📖 กติกา Candy Master</h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="text-xs space-y-2 mt-3 text-zinc-200">
                <p>• ผู้เล่น 4 คน มีเลือด <strong>100 HP</strong> เท่ากัน และเล่นบน<strong>กระดานเดียวกัน!</strong></p>
                <p>• ผลัดกันเล่นคนละ 1 ตา (15 วินาที) สลับลูกอมสีเดียวกัน 3 ลูกเพื่อโจมตีคู่ต่อสู้</p>
                <p>• ลูกอมที่มี <strong>วงแหวนเวทมนตร์เรืองแสง ✨</strong> ซ่อนไอเทมลับไว้ด้านใน!</p>
                <p>• แตะอวตารด้านบนเพื่อเปลี่ยนเป้าหมายที่ต้องการโจมตี</p>
                <p>• ผู้รอดชีวิตคนสุดท้ายคือผู้ชนะ!</p>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full mt-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 font-bold text-sm shadow-md cursor-pointer"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 2. PLAYING & GAME OVER VIEW (Shared 8x8 Board & Synced Sizing)
  // -------------------------------------------------------------------------
  const players = gameState.players;
  const isGameOver = gameState.phase === 'game_over';

  return (
    <div className="w-full h-full flex-1 flex flex-col justify-between items-center relative overflow-hidden select-none bg-gradient-to-b from-[#2e2a7e] via-[#35308c] to-[#1c1a52] text-white font-sans rounded-2xl p-2 sm:p-3">
      {/* Screen VFX Overlay */}
      {screenVFX === 'fire' && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-red-600/30 animate-pulse border-4 border-red-500 flex items-center justify-center">
          <div className="text-5xl sm:text-7xl animate-bounce">🔥🔥🔥</div>
        </div>
      )}
      {screenVFX === 'heal' && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-emerald-500/20 animate-pulse border-4 border-emerald-400 flex items-center justify-center">
          <div className="text-5xl sm:text-7xl animate-bounce">💚💚💚</div>
        </div>
      )}
      {screenVFX === 'shield' && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-cyan-500/20 animate-pulse border-4 border-cyan-400 flex items-center justify-center">
          <div className="text-5xl sm:text-7xl animate-bounce">🛡️✨</div>
        </div>
      )}

      {/* Floating Mystery Item Popover */}
      {recentItemRevealed && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-black text-xs shadow-2xl animate-bounce flex items-center gap-2 border border-white/40">
          <span>✨ ปลดล็อกไอเทม:</span>
          <span>{recentItemRevealed.name}</span>
        </div>
      )}

      {/* Turn Wait Toast */}
      {turnWaitToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-black/85 border border-amber-400/80 text-amber-300 font-bold text-xs shadow-2xl animate-fade-in flex items-center gap-1.5">
          <span>⏳ ยังไม่ถึงตาของคุณ กรุณารอสักครู่ (กำลังเป็นตาของ {currentTurnPlayer?.userName || 'เพื่อน'})</span>
        </div>
      )}

      {/* =====================================================================
          TOP HUD: 4 Players Avatars + HP Bars + Target Badge + Turn Indicator
          ===================================================================== */}
      <div className="w-full max-w-xl px-2 pt-1 z-20 flex items-center justify-between shrink-0">
        <div className="flex-1 grid grid-cols-4 gap-1.5 sm:gap-3">
          {players.map((p) => {
            const isTarget = myPlayer?.targetUserId === p.userId;
            const isSelf = p.userId === currentUser.id;
            const isTurn = gameState?.currentTurnUserId === p.userId;

            return (
              <div
                key={p.userId}
                onClick={() => {
                  if (myPlayer && !myPlayer.isDead) {
                    setShowTargetModal(true);
                  }
                }}
                className="flex flex-col items-center cursor-pointer group transition-transform active:scale-95"
              >
                {/* Avatar with Ring */}
                <div className="relative">
                  <div
                    className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full p-0.5 shadow-md flex items-center justify-center transition-all ${
                      p.isDead
                        ? 'bg-zinc-700 opacity-50 grayscale'
                        : isTurn
                        ? 'bg-gradient-to-b from-yellow-300 to-amber-500 ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#2e2a7e] animate-pulse scale-105'
                        : isTarget
                        ? 'bg-gradient-to-b from-rose-500 to-red-700 ring-2 ring-rose-400'
                        : isSelf
                        ? 'bg-gradient-to-b from-cyan-400 to-blue-600 ring-2 ring-cyan-300'
                        : 'bg-gradient-to-b from-[#4ade80] to-[#15803d]'
                    }`}
                  >
                    {p.isDead ? (
                      <div className="w-full h-full rounded-full bg-[#1b1c24] flex items-center justify-center text-lg">
                        💀
                      </div>
                    ) : (
                      <img
                        src={p.avatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                        alt={p.userName}
                        className="w-full h-full rounded-full object-cover border border-white"
                      />
                    )}
                  </div>

                  {/* Active Turn Badge */}
                  {isTurn && !p.isDead && (
                    <div className="absolute -bottom-1 -right-1 px-1 rounded-full bg-yellow-400 text-black font-black text-[7px] border border-white shadow-sm leading-tight">
                      ตาเล่น
                    </div>
                  )}

                  {/* Target Swords ⚔️ Badge */}
                  {isTarget && !p.isDead && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 border border-white flex items-center justify-center text-[10px] shadow-md animate-bounce">
                      ⚔️
                    </div>
                  )}

                  {/* Shield badge */}
                  {p.shield && !p.isDead && (
                    <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-cyan-500 border border-white flex items-center justify-center text-[9px] shadow-sm">
                      🛡️
                    </div>
                  )}
                </div>

                {/* HP Pill */}
                <div className="w-full max-w-[65px] h-3 rounded-full bg-[#181926] border border-white/20 mt-1 relative overflow-hidden flex items-center justify-center shadow-inner">
                  <div
                    className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-300 ${
                      p.hp > 50
                        ? 'bg-gradient-to-r from-[#22c55e] to-[#4ade80]'
                        : p.hp > 25
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-rose-600 to-red-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, p.hp))}%` }}
                  />
                  <span className="font-mono text-[8px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] z-10 leading-none">
                    {p.hp}/100
                  </span>
                </div>

                {/* Player Name */}
                <span className="text-[10px] font-bold text-white/90 truncate max-w-[65px] mt-0.5 text-center drop-shadow-sm">
                  {p.userName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Corner Buttons */}
        <div className="flex flex-col gap-1.5 ml-2">
          <button
            onClick={() => setShowHelpModal(true)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-white text-xs shadow-md cursor-pointer"
            title="กติกา"
          >
            ?
          </button>
          {isAdminOrOwner && (
            <button
              onClick={onStopGame}
              className="w-7 h-7 rounded-full bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/30 flex items-center justify-center text-rose-300 text-xs shadow-md cursor-pointer"
              title="ยุติเกม"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TURN STATUS BANNER */}
      <div className="w-full flex items-center justify-center my-0.5 shrink-0 z-20">
        {isMyTurn ? (
          <div className="px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black font-black text-xs shadow-md animate-pulse flex items-center gap-1.5 border border-white/60">
            <span>✨ ถึงตาของคุณแล้ว! สลับลูกอมเพื่อโจมตี</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black text-yellow-300 font-mono text-[10px]">
              {gameState?.turnTimeLeft ?? 15}s
            </span>
          </div>
        ) : (
          <div className="px-3 py-0.5 rounded-full bg-black/40 border border-white/10 text-white/90 font-bold text-xs flex items-center gap-1.5">
            <span>⏳ รอตาของ {currentTurnPlayer?.userName || 'ผู้เล่น'}...</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-cyan-300 font-mono text-[10px]">
              {gameState?.turnTimeLeft ?? 15}s
            </span>
          </div>
        )}
      </div>

      {/* =====================================================================
          CENTER: 8x8 SHARED MATCH-3 CANDY BOARD (Identical for All Players)
          ===================================================================== */}
      <div className="flex-1 w-full flex flex-col items-center justify-center p-0.5 sm:p-1 z-10 overflow-hidden shrink-0">
        {activeHammerMode && (
          <div className="mb-1 px-3 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black shadow-lg animate-pulse flex items-center gap-1">
            <span>🔨 โหมดค้อน: แตะทุบลูกแคนดี้บนกระดาน 1 ช่องทันที!</span>
          </div>
        )}

        {/* Board Frame Container (Scaled to fit without vertical cropping!) */}
        <div
          className="relative p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-[#5b54d6] shadow-[0_8px_24px_rgba(0,0,0,0.6),inset_0_2px_6px_rgba(255,255,255,0.2)] mx-auto"
          style={{
            height: 'min(48vh, 390px)',
            width: 'min(48vh, 390px)',
            maxHeight: '390px',
            maxWidth: '390px',
            aspectRatio: '1/1',
            backgroundColor: '#27266b',
          }}
        >
          {/* Subtle spiral background */}
          <div
            className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5) 0%, transparent 60%)`,
            }}
          />

          {/* 8x8 Grid Tiles (SHARED SERVER BOARD) */}
          {board && board.length === 8 ? (
            <div className="w-full h-full grid grid-cols-8 gap-0.5 relative z-10">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const CandyComponent = CANDY_COMPONENTS[cell.type] || CANDY_COMPONENTS[0];
                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;

                  return (
                    <button
                      key={cell.id || `${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      disabled={myPlayer?.isDead || cell.type === -1}
                      className={`relative rounded-lg flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-90 ${
                        isSelected
                          ? 'ring-2 ring-yellow-300 scale-110 z-30 shadow-[0_0_12px_rgba(253,224,71,0.9)]'
                          : isMyTurn
                          ? 'hover:scale-105'
                          : 'cursor-default opacity-95'
                      }`}
                      style={{ aspectRatio: '1/1' }}
                    >
                      {/* Mystery Aura Glow */}
                      {cell.hasItem && <MysteryAuraRing />}

                      {/* Candy Graphic */}
                      {cell.type !== -1 && (
                        <div className="w-full h-full p-0.5 flex items-center justify-center">
                          <CandyComponent />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 relative z-10">
              <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin shadow-lg" />
              <span className="text-xs font-bold text-yellow-300 animate-pulse tracking-wide">
                🍬 กำลังเตรียมกระดานลูกอม...
              </span>
            </div>
          )}
        </div>

        {/* Combat Log */}
        <div className="mt-1 px-3 py-0.5 rounded-full bg-black/40 text-[9px] text-zinc-300 font-mono truncate max-w-sm text-center">
          {gameState.recentLogs[0]?.text || '⚔️ แข่งขันกันทำลายลูกอมเพื่อลดเลือดคู่ต่อสู้!'}
        </div>
      </div>

      {/* =====================================================================
          BOTTOM: 4 CIRCULAR ITEM DOCKS (Heal, Hammer, Shield, Firestorm)
          ===================================================================== */}
      <div className="w-full max-w-md pb-1 px-2 z-20 shrink-0">
        <div className="grid grid-cols-4 gap-2 sm:gap-3 items-center justify-items-center">
          {/* 1. Heal Potion */}
          <button
            onClick={() => handleTriggerItem('heal')}
            disabled={inventory.heal <= 0 || myPlayer?.isDead || !isMyTurn}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full relative p-1.5 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
              inventory.heal > 0 && isMyTurn
                ? 'bg-gradient-to-b from-[#252850] to-[#12132e] border-2 border-red-400/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                : 'bg-[#181930] opacity-35 border border-white/10'
            }`}
          >
            <ItemHealSVG />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white font-black text-[8px] shadow-md border border-white">
              {inventory.heal}
            </span>
          </button>

          {/* 2. Hammer */}
          <button
            onClick={() => handleTriggerItem('hammer')}
            disabled={inventory.hammer <= 0 || myPlayer?.isDead || !isMyTurn}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full relative p-1.5 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
              activeHammerMode
                ? 'bg-amber-500 ring-4 ring-yellow-300 scale-105 animate-bounce'
                : inventory.hammer > 0 && isMyTurn
                ? 'bg-gradient-to-b from-[#252850] to-[#12132e] border-2 border-yellow-400/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                : 'bg-[#181930] opacity-35 border border-white/10'
            }`}
          >
            <ItemHammerSVG />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-black text-[8px] shadow-md border border-white">
              {inventory.hammer}
            </span>
          </button>

          {/* 3. Shield */}
          <button
            onClick={() => handleTriggerItem('shield')}
            disabled={inventory.shield <= 0 || myPlayer?.isDead || !isMyTurn}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full relative p-1.5 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
              inventory.shield > 0 && isMyTurn
                ? 'bg-gradient-to-b from-[#252850] to-[#12132e] border-2 border-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                : 'bg-[#181930] opacity-35 border border-white/10'
            }`}
          >
            <ItemShieldSVG />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-black text-[8px] shadow-md border border-white">
              {inventory.shield}
            </span>
          </button>

          {/* 4. Firestorm */}
          <button
            onClick={() => handleTriggerItem('fire')}
            disabled={inventory.fire <= 0 || myPlayer?.isDead || !isMyTurn}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full relative p-1.5 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
              inventory.fire > 0 && isMyTurn
                ? 'bg-gradient-to-b from-[#252850] to-[#12132e] border-2 border-orange-400/80 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                : 'bg-[#181930] opacity-35 border border-white/10'
            }`}
          >
            <ItemFireSVG />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-orange-500 text-white font-black text-[8px] shadow-md border border-white">
              {inventory.fire}
            </span>
          </button>
        </div>
      </div>

      {/* TARGET SELECTOR MODAL */}
      {showTargetModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl p-5 bg-gradient-to-b from-[#34309c] via-[#2d2888] to-[#1d195e] border-2 border-[#818cf8] shadow-[0_16px_40px_rgba(0,0,0,0.8)] text-white relative">
            <button
              onClick={() => setShowTargetModal(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full p-1 bg-gradient-to-b from-yellow-300 to-amber-500 shadow-[0_0_16px_rgba(253,224,71,0.8)] ring-2 ring-yellow-200">
                <img
                  src={myPlayer?.avatar || currentUser.avatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                  alt="You"
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>
              <p className="text-xs font-bold text-white mt-1.5 truncate max-w-[120px]">
                {currentUser.name || currentUser.username || 'คุณ (Me)'}
              </p>
              <div className="w-20 h-2.5 rounded-full bg-black/50 border border-white/20 mt-0.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, myPlayer?.hp || 100))}%` }}
                />
              </div>
            </div>

            <div className="my-3 flex items-center justify-center relative">
              <div className="w-full h-[1px] bg-white/20" />
              <div className="absolute px-2.5 py-0.5 rounded-full bg-[#4338ca] border border-[#a5b4fc] text-sm shadow-md">
                ⚔️
              </div>
            </div>

            <p className="text-center font-bold text-xs text-indigo-100 mb-3">
              เลือกคนที่ต้องการโจมตี
            </p>

            <div className="flex items-center justify-center gap-3">
              {players
                .filter((p) => p.userId !== currentUser.id)
                .map((opp) => (
                  <button
                    key={opp.userId}
                    disabled={opp.isDead}
                    onClick={() => {
                      onSelectTarget(opp.userId);
                      setShowTargetModal(false);
                    }}
                    className={`flex flex-col items-center p-2 rounded-2xl transition-all cursor-pointer active:scale-95 ${
                      opp.isDead
                        ? 'opacity-30 grayscale cursor-not-allowed'
                        : myPlayer?.targetUserId === opp.userId
                        ? 'bg-rose-500/30 ring-2 ring-rose-400 scale-105'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full p-1 bg-gradient-to-b from-[#4ade80] to-[#15803d] shadow-md">
                      {opp.isDead ? (
                        <div className="w-full h-full rounded-full bg-black/60 flex items-center justify-center text-lg">
                          💀
                        </div>
                      ) : (
                        <img
                          src={opp.avatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                          alt={opp.userName}
                          className="w-full h-full rounded-full object-cover border border-white"
                        />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-white mt-1 max-w-[65px] truncate text-center">
                      {opp.userName}
                    </span>
                    <div className="w-12 h-2 rounded-full bg-black/50 border border-white/20 mt-0.5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${Math.max(0, Math.min(100, opp.hp))}%` }}
                      />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER VICTORY SCREEN */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl p-6 text-center border-2 border-amber-400 bg-gradient-to-b from-[#2e2b7a] to-[#16143c] shadow-2xl flex flex-col items-center">
            <span className="text-5xl animate-bounce">👑</span>
            <h3 className="text-2xl font-black text-amber-300 mt-2">CANDY CHAMPION!</h3>
            <p className="text-xs text-zinc-300 mt-0.5">ผู้ชนะเลิศใน Candy Master Battle Royale</p>

            {gameState.winner ? (
              <div className="mt-4 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-amber-300 to-yellow-600 shadow-[0_0_25px_rgba(245,158,11,0.8)]">
                  <img
                    src={gameState.winner.avatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                    alt={gameState.winner.userName}
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                </div>
                <p className="font-extrabold text-base mt-2">{gameState.winner.userName}</p>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mt-1 border border-emerald-400/40">
                  เลือดคงเหลือ {gameState.winner.hp} HP
                </span>
              </div>
            ) : (
              <p className="text-sm font-bold text-zinc-400 mt-4">ไม่มีผู้รอดชีวิตในการต่อสู้นี้!</p>
            )}

            <p className="text-[11px] text-zinc-400 mt-5">
              กำลังรีเซ็ตกลับสู่ล็อบบี้ในอีกสักครู่...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
