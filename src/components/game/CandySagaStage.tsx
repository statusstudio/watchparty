import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CandyTileData, CandySpecialType } from '../../types/index.js';
import { CandyCrushEngine } from '../../services/candyEngine.js';
import { CANDY_LEVELS, CandyLevelConfig } from '../../services/candyLevels.js';
import {
  playCandyPop,
  playCandySwapSound,
  playLaserBeamSound,
  playExplosionSound,
  playColorBombSound,
  playStarChime,
  playHammerSmashSound,
  playVictoryFanfare,
  playAnnouncerVoice,
} from '../../services/candySoundEffects.js';

// ---------------------------------------------------------------------------
// TRUE 3D CANDY CRUSH SAGA VECTOR ART
// ---------------------------------------------------------------------------

// 1. Red Jelly Bean (Iconic kidney bean shape with curved specular reflection)
const RedCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
    <defs>
      <radialGradient id="redBeanGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ff8a8a" />
        <stop offset="30%" stopColor="#ef233c" />
        <stop offset="75%" stopColor="#b70928" />
        <stop offset="100%" stopColor="#4a040d" />
      </radialGradient>
      <linearGradient id="redBeanGlint" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="60%" stopColor="#ffffff" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* Deep Drop Shadow */}
    <path
      d="M 32 20 C 62 10, 86 32, 78 64 C 70 88, 38 92, 22 72 C 10 52, 14 26, 32 20 Z"
      fill="#2b0207"
      opacity="0.4"
      transform="translate(0, 4)"
    />
    {/* Main Jelly Bean Body */}
    <path
      d="M 32 20 C 62 10, 86 32, 78 64 C 70 88, 38 92, 22 72 C 10 52, 14 26, 32 20 Z"
      fill="url(#redBeanGrad)"
      stroke="#ff6b6b"
      strokeWidth="1.5"
    />
    {/* Curved Specular Glare */}
    <path
      d="M 32 26 C 50 20, 68 32, 66 48"
      fill="none"
      stroke="url(#redBeanGlint)"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    {/* Bottom Translucent Amber Reflection */}
    <ellipse cx="38" cy="74" rx="14" ry="5" fill="#fca5a5" opacity="0.3" />
  </svg>
);

// 2. Orange Lozenge (Pill/Oval shape with beveled glossy candy shell)
const OrangeCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
    <defs>
      <radialGradient id="orngGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="35%" stopColor="#f97316" />
        <stop offset="80%" stopColor="#c2410c" />
        <stop offset="100%" stopColor="#431407" />
      </radialGradient>
    </defs>
    {/* Shadow base */}
    <ellipse cx="50" cy="54" rx="42" ry="32" fill="#2d0d04" opacity="0.4" />
    {/* Main Oval Body */}
    <ellipse cx="50" cy="50" rx="42" ry="32" fill="url(#orngGrad)" stroke="#fb923c" strokeWidth="1.6" />
    {/* Top-left specular shine */}
    <ellipse cx="34" cy="36" rx="14" ry="6" transform="rotate(-15 34 36)" fill="#ffffff" opacity="0.75" />
    <circle cx="60" cy="36" r="3" fill="#ffffff" opacity="0.6" />
    {/* Bottom glow */}
    <ellipse cx="52" cy="68" rx="20" ry="4" fill="#fed7aa" opacity="0.3" />
  </svg>
);

// 3. Yellow Lemon Drop (Pointed teardrop with dual apex gloss)
const YellowCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
    <defs>
      <radialGradient id="yelGrad" cx="40%" cy="35%" r="68%">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="35%" stopColor="#eab308" />
        <stop offset="80%" stopColor="#a16207" />
        <stop offset="100%" stopColor="#422006" />
      </radialGradient>
    </defs>
    <path
      d="M 50 12 C 50 12, 18 52, 18 68 C 18 84, 32 92, 50 92 C 68 92, 82 84, 82 68 C 82 52, 50 12, 50 12 Z"
      fill="#291404"
      opacity="0.4"
      transform="translate(0, 4)"
    />
    <path
      d="M 50 12 C 50 12, 18 52, 18 68 C 18 84, 32 92, 50 92 C 68 92, 82 84, 82 68 C 82 52, 50 12, 50 12 Z"
      fill="url(#yelGrad)"
      stroke="#fde047"
      strokeWidth="1.8"
    />
    {/* Glare along curve */}
    <path d="M 44 26 C 30 46, 26 62, 28 72" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.75" />
    <circle cx="50" cy="22" r="3" fill="#ffffff" opacity="0.85" />
    {/* Bottom Amber Glow */}
    <ellipse cx="50" cy="78" rx="16" ry="6" fill="#fef08a" opacity="0.3" />
  </svg>
);

// 4. Green Chiclet (Square with rounded corners and jewel green luster)
const GreenCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
    <defs>
      <radialGradient id="grnGrad" cx="36%" cy="32%" r="70%">
        <stop offset="0%" stopColor="#bbf7d0" />
        <stop offset="35%" stopColor="#22c55e" />
        <stop offset="80%" stopColor="#15803d" />
        <stop offset="100%" stopColor="#052e16" />
      </radialGradient>
    </defs>
    <rect x="14" y="18" width="72" height="72" rx="20" fill="#031f0e" opacity="0.4" />
    <rect x="14" y="14" width="72" height="72" rx="20" fill="url(#grnGrad)" stroke="#4ade80" strokeWidth="1.8" />
    {/* Top left glossy highlight bevel */}
    <path d="M 24 24 L 76 24 C 76 24, 72 34, 50 34 C 28 34, 24 24, 24 24 Z" fill="#ffffff" opacity="0.4" />
    <circle cx="30" cy="30" r="5" fill="#ffffff" opacity="0.8" />
    <circle cx="42" cy="28" r="2.5" fill="#ffffff" opacity="0.6" />
    {/* Bottom rim light */}
    <ellipse cx="50" cy="74" rx="22" ry="5" fill="#86efac" opacity="0.25" />
  </svg>
);

// 5. Blue Lollipop Sphere (Concentric sapphire reflections)
const BlueCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
    <defs>
      <radialGradient id="bluGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#bae6fd" />
        <stop offset="35%" stopColor="#0284c7" />
        <stop offset="80%" stopColor="#0369a1" />
        <stop offset="100%" stopColor="#082f49" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="54" r="41" fill="#041826" opacity="0.4" />
    <circle cx="50" cy="50" r="41" fill="url(#bluGrad)" stroke="#38bdf8" strokeWidth="1.8" />
    {/* Crescent highlight */}
    <path
      d="M 28 26 C 42 16, 68 22, 74 36 C 68 28, 46 24, 34 32 Z"
      fill="#ffffff"
      opacity="0.85"
    />
    <circle cx="34" cy="34" r="3.5" fill="#ffffff" opacity="0.85" />
    {/* Bottom glow */}
    <ellipse cx="50" cy="76" rx="18" ry="6" fill="#7dd3fc" opacity="0.28" />
  </svg>
);

// 6. Purple Cluster (Faceted grape crystal with sparkling facets)
const PurpleCandySVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
    <defs>
      <radialGradient id="purpGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#f3e8ff" />
        <stop offset="35%" stopColor="#a855f7" />
        <stop offset="80%" stopColor="#7e22ce" />
        <stop offset="100%" stopColor="#3b0764" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="54" r="41" fill="#200438" opacity="0.4" />
    <circle cx="50" cy="50" r="41" fill="url(#purpGrad)" stroke="#c084fc" strokeWidth="1.8" />
    {/* Facet lines */}
    <polygon points="50,22 72,36 68,66 32,66 28,36" fill="none" stroke="#e9d5ff" strokeWidth="1.2" opacity="0.4" />
    {/* Specular Star Glint */}
    <circle cx="35" cy="32" r="5" fill="#ffffff" opacity="0.85" />
    <path d="M 35 24 L 35 40 M 27 32 L 43 32" stroke="#ffffff" strokeWidth="1.5" opacity="0.75" />
    <ellipse cx="50" cy="76" rx="18" ry="6" fill="#d8b4fe" opacity="0.25" />
  </svg>
);

const CANDY_COMPONENTS = [
  RedCandySVG,
  PurpleCandySVG,
  YellowCandySVG,
  GreenCandySVG,
  OrangeCandySVG,
  BlueCandySVG,
];

// Special Candies
const StripedCandySVG: React.FC<{ type: number; direction: 'h' | 'v'; className?: string }> = ({
  type,
  direction,
  className = 'w-full h-full',
}) => {
  const BaseCandy = CANDY_COMPONENTS[type] || CANDY_COMPONENTS[0];
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <BaseCandy />
      {/* 3D Diagonal Confectioner Sugar Laser Stripes */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
        <defs>
          <linearGradient id={`strShine-${direction}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        {direction === 'h' ? (
          <g stroke={`url(#strShine-${direction})`} strokeWidth="7.5" strokeLinecap="round" opacity="0.95">
            <line x1="16" y1="34" x2="84" y2="34" />
            <line x1="12" y1="50" x2="88" y2="50" />
            <line x1="16" y1="66" x2="84" y2="66" />
          </g>
        ) : (
          <g stroke={`url(#strShine-${direction})`} strokeWidth="7.5" strokeLinecap="round" opacity="0.95">
            <line x1="34" y1="16" x2="34" y2="84" />
            <line x1="50" y1="12" x2="50" y2="88" />
            <line x1="66" y1="16" x2="66" y2="84" />
          </g>
        )}
      </svg>
      {/* Animated Directional Laser Arrow Badge */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[14px] text-white font-black drop-shadow-[0_0_10px_rgba(255,255,255,1)] animate-pulse">
          {direction === 'h' ? '⬌' : '⬍'}
        </span>
      </div>
    </div>
  );
};

const WrappedCandySVG: React.FC<{ type: number; className?: string }> = ({
  type,
  className = 'w-full h-full',
}) => {
  const BaseCandy = CANDY_COMPONENTS[type] || CANDY_COMPONENTS[0];
  return (
    <div className={`relative ${className} flex items-center justify-center p-0.5`}>
      <BaseCandy />
      {/* 3D Cellophane Wrapper with Twisted Bow Tails */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
        <defs>
          <radialGradient id="wrapWing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#fef08a" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
          </radialGradient>
        </defs>
        {/* Left twisted wing */}
        <polygon points="12,50 2,28 3,72" fill="url(#wrapWing)" stroke="#ffffff" strokeWidth="1.2" />
        {/* Right twisted wing */}
        <polygon points="88,50 98,28 97,72" fill="url(#wrapWing)" stroke="#ffffff" strokeWidth="1.2" />
        {/* Square pouch highlight */}
        <rect x="18" y="18" width="64" height="64" rx="18" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.92" />
      </svg>
      <div className="absolute -top-1 -right-1 text-[13px] animate-bounce">✨</div>
    </div>
  );
};

const ColorBombSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.75))' }}>
    <defs>
      <radialGradient id="chocTruffle" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#6b4124" />
        <stop offset="40%" stopColor="#3d2314" />
        <stop offset="85%" stopColor="#24140b" />
        <stop offset="100%" stopColor="#100602" />
      </radialGradient>
      <radialGradient id="rainbowGlow" cx="50%" cy="50%" r="50%">
        <stop offset="50%" stopColor="transparent" />
        <stop offset="85%" stopColor="#ec4899" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
      </radialGradient>
    </defs>
    {/* Twinkling Rainbow Corona */}
    <circle cx="50" cy="50" r="47" fill="url(#rainbowGlow)" />
    {/* Dark Chocolate Truffle Core */}
    <circle cx="50" cy="50" r="41" fill="url(#chocTruffle)" stroke="#f59e0b" strokeWidth="2" />
    {/* 12 Rainbow Nonpareil Sprinkles */}
    <circle cx="34" cy="30" r="4.2" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="48" cy="22" r="4.2" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="64" cy="28" r="4.2" fill="#10b981" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="70" cy="44" r="4.2" fill="#eab308" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="60" cy="62" r="4.2" fill="#ec4899" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="44" cy="68" r="4.2" fill="#8b5cf6" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="28" cy="58" r="4.2" fill="#f97316" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="24" cy="42" r="4.2" fill="#06b6d4" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="48" cy="44" r="4.8" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="38" cy="46" r="3.6" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="56" cy="36" r="3.6" fill="#f43f5e" stroke="#ffffff" strokeWidth="0.8" />
    {/* Specular curved glaze */}
    <ellipse cx="38" cy="26" rx="9" ry="4" transform="rotate(-30 38 26)" fill="#ffffff" opacity="0.75" />
  </svg>
);

// ---------------------------------------------------------------------------
// HTML5 CANVAS PARTICLE SYSTEM FOR REAL SUGAR SPARKLES & FLYING SCORE
// ---------------------------------------------------------------------------
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  alpha: number;
  color: string;
}

interface CandySagaStageProps {
  onClose?: () => void;
}

export const CandySagaStage: React.FC<CandySagaStageProps> = ({ onClose }) => {
  // Saga Map Progress from localStorage
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('candy_saga_unlocked_level')) || 1;
    } catch {
      return 1;
    }
  });

  const [levelStars, setLevelStars] = useState<Record<number, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('candy_saga_stars') || '{}');
    } catch {
      return {};
    }
  });

  const [levelHighScores, setLevelHighScores] = useState<Record<number, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('candy_saga_highscores') || '{}');
    } catch {
      return {};
    }
  });

  // Current Game View: 'map' | 'preview' | 'playing' | 'victory' | 'gameover'
  const [viewMode, setViewMode] = useState<'map' | 'preview' | 'playing' | 'victory' | 'gameover'>('map');
  const [activeLevel, setActiveLevel] = useState<CandyLevelConfig>(CANDY_LEVELS[0]);

  // In-Game State
  const [board, setBoard] = useState<CandyTileData[][]>([]);
  const [jellyMap, setJellyMap] = useState<boolean[][]>([]);
  const [movesLeft, setMovesLeft] = useState<number>(15);
  const [score, setScore] = useState<number>(0);
  const [collectedOrders, setCollectedOrders] = useState<Record<number, number>>({});
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeHammer, setActiveHammer] = useState<boolean>(false);
  const [announcerBanner, setAnnouncerBanner] = useState<{ text: string; sub: string; color: string } | null>(null);
  const [screenShake, setScreenShake] = useState<'none' | 'light' | 'heavy'>('none');

  // Swipe drag ref
  const dragStartRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);

  // Canvas ref for particles
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // Total Stars
  const totalStars = Object.values(levelStars).reduce((acc, s) => acc + s, 0);

  // Spawn particles on canvas
  const spawnSugarBurst = useCallback((cellX: number, cellY: number, color: string, points?: number) => {
    const colors = [color, '#ffffff', '#ffd700', '#f43f5e', '#38bdf8'];
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5.5;
      particlesRef.current.push({
        x: cellX,
        y: cellY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 4.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.025 + Math.random() * 0.025,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
      });
    }

    if (points) {
      floatingTextsRef.current.push({
        x: cellX,
        y: cellY,
        text: `+${points}`,
        alpha: 1,
        color: '#fde047',
      });
    }
  }, []);

  // Particle loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render & update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.alpha -= p.decay;
        p.rotation += p.vRot;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      // Render & update floating text
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y -= 1.2;
        ft.alpha -= 0.02;

        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x - 12, ft.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [viewMode]);

  // Start Level
  const handleStartLevel = (lvl: CandyLevelConfig) => {
    setActiveLevel(lvl);
    setBoard(CandyCrushEngine.createRandom8x8Board());
    setMovesLeft(lvl.moves);
    setScore(0);
    setCollectedOrders({});
    setSelectedCell(null);
    setActiveHammer(false);
    setAnnouncerBanner(null);

    // Initial Jelly
    if (lvl.initialJellyMap) {
      setJellyMap(lvl.initialJellyMap.map((row) => [...row]));
    } else {
      setJellyMap(Array.from({ length: 8 }, () => Array(8).fill(false)));
    }

    setViewMode('playing');
  };

  // Check Win Condition
  const checkLevelProgress = (newScore: number, newJellyMap: boolean[][], newOrders: Record<number, number>) => {
    let targetMet = false;

    if (activeLevel.type === 'score') {
      targetMet = newScore >= activeLevel.targetScore;
    } else if (activeLevel.type === 'jelly') {
      const remainingJellies = newJellyMap.flat().filter(Boolean).length;
      targetMet = remainingJellies === 0;
    } else if (activeLevel.type === 'order') {
      targetMet = Boolean(
        activeLevel.targetOrders?.every((ord) => (newOrders[ord.type] || 0) >= ord.count)
      );
    }

    return targetMet;
  };

  // Handle Level Victory
  const handleLevelWin = (finalScore: number) => {
    playAnnouncerVoice('sugar_crush');
    playVictoryFanfare();

    let starsEarned = 1;
    if (finalScore >= activeLevel.starScores[2]) starsEarned = 3;
    else if (finalScore >= activeLevel.starScores[1]) starsEarned = 2;

    const newStars = { ...levelStars, [activeLevel.id]: Math.max(levelStars[activeLevel.id] || 0, starsEarned) };
    const newHighScores = { ...levelHighScores, [activeLevel.id]: Math.max(levelHighScores[activeLevel.id] || 0, finalScore) };
    const nextUnlocked = Math.max(unlockedLevel, activeLevel.id + 1);

    setLevelStars(newStars);
    setLevelHighScores(newHighScores);
    setUnlockedLevel(nextUnlocked);

    try {
      localStorage.setItem('candy_saga_stars', JSON.stringify(newStars));
      localStorage.setItem('candy_saga_highscores', JSON.stringify(newHighScores));
      localStorage.setItem('candy_saga_unlocked_level', String(nextUnlocked));
    } catch {}

    setViewMode('victory');
  };

  // Execute Swap on board
  const handlePerformSwap = (r1: number, c1: number, r2: number, c2: number) => {
    if (isProcessing || movesLeft <= 0) return;

    playCandySwapSound();
    setIsProcessing(true);
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    const res = CandyCrushEngine.executeSwap(newBoard, r1, c1, r2, c2);

    if (!res.success) {
      setIsProcessing(false);
      return;
    }

    playCandyPop(res.comboCount);
    if (res.comboType === 'striped_h' || res.comboType === 'striped_v' || res.comboType === 'combo_cross') {
      playLaserBeamSound();
    } else if (res.comboType === 'wrapped' || res.comboType === 'combo_giant' || res.comboType === 'combo_wipe') {
      playExplosionSound();
    } else if (res.comboType === 'color_bomb' || res.comboType === 'combo_color_striped') {
      playColorBombSound();
    }

    const newMoves = movesLeft - 1;
    setMovesLeft(newMoves);

    // Points calculation
    const pointsGained = res.totalDamage * 45;
    const newScore = score + pointsGained;
    setScore(newScore);

    // Trigger Particle Bursts on Canvas
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const cellSize = rect.width / 8;
      spawnSugarBurst(c2 * cellSize + cellSize / 2, r2 * cellSize + cellSize / 2, '#f59e0b', pointsGained);
    }

    // Clear jelly where matches occurred
    const newJelly = jellyMap.map((row) => [...row]);
    if (activeLevel.type === 'jelly') {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (newBoard[r][c].id.includes('del') || newBoard[r][c].id.includes('spawn')) {
            newJelly[r][c] = false;
          }
        }
      }
      setJellyMap(newJelly);
    }

    // Orders tracking
    const newOrders = { ...collectedOrders };
    if (activeLevel.targetOrders) {
      activeLevel.targetOrders.forEach((ord) => {
        newOrders[ord.type] = (newOrders[ord.type] || 0) + Math.round(res.totalDamage / 4);
      });
      setCollectedOrders(newOrders);
    }

    setBoard(newBoard);

    // Announcer & Screen Shake
    if (res.announcer) {
      playAnnouncerVoice(res.announcer);
      setScreenShake('heavy');
      setTimeout(() => setScreenShake('none'), 650);

      const voiceMap: Record<string, { text: string; sub: string; color: string }> = {
        sweet: { text: 'SWEET!', sub: '3x COMBO', color: 'from-amber-400 via-yellow-300 to-amber-500' },
        tasty: { text: 'TASTY!', sub: '4x COMBO', color: 'from-orange-500 via-amber-400 to-yellow-400' },
        delicious: { text: 'DELICIOUS!', sub: '5x SUPER COMBO', color: 'from-pink-500 via-purple-400 to-indigo-500' },
        divine: { text: 'DIVINE!', sub: '6x MEGA COMBO', color: 'from-cyan-400 via-sky-300 to-blue-500' },
        sugar_crush: { text: 'SUGAR CRUSH!', sub: 'LEVEL CLEAR', color: 'from-rose-500 via-amber-300 to-fuchsia-500' },
      };

      setAnnouncerBanner(voiceMap[res.announcer]);
      setTimeout(() => setAnnouncerBanner(null), 1800);
    }

    setIsProcessing(false);

    // Check Victory
    const isTargetMet = checkLevelProgress(newScore, newJelly, newOrders);
    if (isTargetMet) {
      // Sugar Crush bonus for remaining moves
      const sugarBonus = newMoves * 250;
      handleLevelWin(newScore + sugarBonus);
    } else if (newMoves <= 0) {
      setViewMode('gameover');
    }
  };

  // Hammer booster
  const handleUseHammer = (r: number, c: number) => {
    playHammerSmashSound();
    setActiveHammer(false);

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    newBoard[r][c] = { id: `smashed-${r}-${c}`, type: -1, special: 'none', hasItem: false };
    const harvest: any[] = [];
    CandyCrushEngine.refillBoard(newBoard, harvest);
    CandyCrushEngine.processAllCascades(newBoard, harvest);

    const newJelly = jellyMap.map((row) => [...row]);
    newJelly[r][c] = false;
    setJellyMap(newJelly);
    setBoard(newBoard);
    setScore((prev) => prev + 150);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const cellSize = rect.width / 8;
      spawnSugarBurst(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2, '#fbbf24', 150);
    }

    const isTargetMet = checkLevelProgress(score + 150, newJelly, collectedOrders);
    if (isTargetMet) {
      handleLevelWin(score + 150 + movesLeft * 250);
    }
  };

  // Pointer Swipe Handlers
  const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
    if (activeHammer) {
      handleUseHammer(r, c);
      return;
    }
    dragStartRef.current = { r, c, x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current || isProcessing || movesLeft <= 0) return;
    const { r, c, x, y } = dragStartRef.current;
    const dx = e.clientX - x;
    const dy = e.clientY - y;
    const threshold = 22;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      let targetR = r;
      let targetC = c;
      if (Math.abs(dx) > Math.abs(dy)) {
        targetC = dx > 0 ? c + 1 : c - 1;
      } else {
        targetR = dy > 0 ? r + 1 : r - 1;
      }
      dragStartRef.current = null;

      if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
        setSelectedCell(null);
        handlePerformSwap(r, c, targetR, targetC);
      }
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (activeHammer) {
      handleUseHammer(r, c);
      return;
    }

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

    setSelectedCell(null);
    handlePerformSwap(r1, c1, r, c);
  };

  // Render Candy Tile
  const renderCandy = (cell: CandyTileData) => {
    if (cell.type === -1) return null;
    if (cell.special === 'color_bomb' || cell.type === -2) return <ColorBombSVG />;
    if (cell.special === 'striped_h') return <StripedCandySVG type={cell.type} direction="h" />;
    if (cell.special === 'striped_v') return <StripedCandySVG type={cell.type} direction="v" />;
    if (cell.special === 'wrapped') return <WrappedCandySVG type={cell.type} />;
    const Comp = CANDY_COMPONENTS[cell.type] || CANDY_COMPONENTS[0];
    return <Comp />;
  };

  // -------------------------------------------------------------------------
  // 1. SAGA MAP VIEW (CANDY KINGDOM ROAD)
  // -------------------------------------------------------------------------
  if (viewMode === 'map') {
    return (
      <div className="w-full h-full flex flex-col items-center bg-gradient-to-b from-[#3b0764] via-[#4c1d95] to-[#1e1b4b] text-white p-3 sm:p-5 relative overflow-y-auto select-none rounded-3xl border-2 border-amber-400/40 shadow-2xl">
        {/* Candy Cane Clouds background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 10% 20%, rgba(254, 205, 211, 0.6) 0%, transparent 35%),
                              radial-gradient(circle at 90% 60%, rgba(199, 210, 254, 0.6) 0%, transparent 40%)`,
          }}
        />

        {/* Header Bar */}
        <div className="w-full max-w-md flex items-center justify-between z-20 pb-2 border-b border-white/15">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl animate-bounce">🍭</span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-amber-300 drop-shadow">
                CANDY CRUSH SAGA
              </h2>
              <p className="text-[10px] text-pink-200 font-medium">แผนที่ผจญภัยอาณาจักรลูกกวาด</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/30 border border-yellow-400 text-yellow-300 font-black text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(250,204,21,0.4)]">
              <span>⭐</span>
              <span>{totalStars} / 30</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm font-bold cursor-pointer transition-all active:scale-90"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Winding Road Saga Map */}
        <div className="w-full max-w-md my-6 flex flex-col items-center gap-5 relative z-10 py-4">
          {CANDY_LEVELS.map((lvl, idx) => {
            const isUnlocked = lvl.id <= unlockedLevel;
            const stars = levelStars[lvl.id] || 0;
            const isCurrent = lvl.id === unlockedLevel;
            const xOffset = Math.sin(idx * 0.95) * 85;

            return (
              <div
                key={lvl.id}
                style={{ transform: `translateX(${xOffset}px)` }}
                className="relative flex flex-col items-center my-1"
              >
                {/* Level Node Pin */}
                <button
                  onClick={() => {
                    if (isUnlocked) {
                      setActiveLevel(lvl);
                      setViewMode('preview');
                    }
                  }}
                  disabled={!isUnlocked}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center font-black text-lg transition-all shadow-xl relative cursor-pointer active:scale-95 ${
                    isCurrent
                      ? 'bg-gradient-to-tr from-yellow-400 via-amber-300 to-yellow-500 text-black ring-4 ring-yellow-200 animate-pulse shadow-[0_0_24px_rgba(253,224,71,0.95)]'
                      : isUnlocked
                      ? 'bg-gradient-to-tr from-pink-500 to-rose-600 text-white ring-2 ring-white/60 hover:scale-110 shadow-[0_4px_16px_rgba(244,63,94,0.6)]'
                      : 'bg-zinc-800 text-zinc-500 ring-1 ring-zinc-700 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {isUnlocked ? (
                    <>
                      <span className="text-base sm:text-lg">{lvl.id}</span>
                      <div className="flex gap-0.5 text-[10px] mt-0.5">
                        <span className={stars >= 1 ? 'text-yellow-300' : 'text-black/30'}>★</span>
                        <span className={stars >= 2 ? 'text-yellow-300' : 'text-black/30'}>★</span>
                        <span className={stars >= 3 ? 'text-yellow-300' : 'text-black/30'}>★</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm">🔒</span>
                  )}

                  {isCurrent && (
                    <span className="absolute -bottom-2.5 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.8)]">
                      PLAY
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 2. PRE-LEVEL MODAL (TARGET PREVIEW)
  // -------------------------------------------------------------------------
  if (viewMode === 'preview') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-white">
        <div className="w-full max-w-sm rounded-3xl p-6 bg-gradient-to-b from-[#3b0764] via-[#581c87] to-[#1e1b4b] border-2 border-yellow-400 shadow-[0_16px_50px_rgba(0,0,0,0.95)] flex flex-col items-center text-center relative animate-in zoom-in-95">
          <button
            onClick={() => setViewMode('map')}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>

          <span className="text-4xl mb-2">🍭</span>
          <h3 className="text-xl font-black text-yellow-300">{activeLevel.title}</h3>
          <p className="text-xs text-zinc-300 mb-4">{activeLevel.subtitle}</p>

          <div className="w-full rounded-2xl bg-black/40 p-4 border border-white/10 mb-5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">เป้าหมาย:</span>
              <span className="font-bold text-amber-300">
                {activeLevel.type === 'score'
                  ? `ทำคะแนนให้ถึง ${activeLevel.targetScore.toLocaleString()} แต้ม`
                  : activeLevel.type === 'jelly'
                  ? `ล้างเจลลี่น้ำแข็งให้หมด (${activeLevel.targetJellyCount} ช่อง)`
                  : 'เก็บลูกอมตามออเดอร์ให้ครบ'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">จำนวนตาเดิน:</span>
              <span className="font-bold text-emerald-400">{activeLevel.moves} ตา</span>
            </div>
          </div>

          <p className="text-[11px] text-pink-200/90 italic mb-6">💡 คำแนะนำ: {activeLevel.hint}</p>

          <button
            onClick={() => handleStartLevel(activeLevel)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black text-base shadow-[0_0_25px_rgba(74,222,128,0.8)] transition-all cursor-pointer active:scale-95 tracking-wider"
          >
            เริ่มเล่นเลย! 🚀
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 3. GAMEPLAY SCREEN (AUTHENTIC CANDY CRUSH SAGA WAFFLE BOARD)
  // -------------------------------------------------------------------------
  const remainingJellies = jellyMap.flat().filter(Boolean).length;
  const scorePercent = Math.min(100, (score / activeLevel.starScores[2]) * 100);
  const currentStars = score >= activeLevel.starScores[2] ? 3 : score >= activeLevel.starScores[1] ? 2 : score >= activeLevel.starScores[0] ? 1 : 0;

  return (
    <div className="w-full h-full flex flex-col justify-between items-center bg-gradient-to-b from-[#2e1065] via-[#3b0764] to-[#1e1b4b] text-white p-2 sm:p-4 select-none relative overflow-hidden rounded-3xl border-2 border-amber-400/40 shadow-2xl">
      {/* Top Header HUD */}
      <div className="w-full max-w-md flex items-center justify-between z-20 shrink-0">
        <button
          onClick={() => setViewMode('map')}
          className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
        >
          <span>🗺️</span>
          <span>แผนที่</span>
        </button>

        {/* Moves Left Badge */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 border-2 border-white shadow-[0_0_20px_rgba(244,63,94,0.85)] flex flex-col items-center justify-center">
            <span className="text-xl sm:text-2xl font-black text-white leading-none drop-shadow">{movesLeft}</span>
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-yellow-200">MOVES</span>
          </div>
        </div>

        {/* Target Objective Mini Badge */}
        <div className="px-3 py-1.5 rounded-2xl bg-black/50 border border-white/20 flex flex-col items-end text-right shadow-md">
          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wide">เป้าหมาย</span>
          <span className="text-xs font-black text-amber-300">
            {activeLevel.type === 'score'
              ? `${score.toLocaleString()} / ${activeLevel.targetScore.toLocaleString()}`
              : activeLevel.type === 'jelly'
              ? `เจลลี่: ${remainingJellies} ช่อง`
              : 'ออเดอร์ครบตามสั่ง'}
          </span>
        </div>
      </div>

      {/* 3-Star Score Progress Bar */}
      <div className="w-full max-w-xs my-1 z-20 shrink-0 flex flex-col items-center">
        <div className="w-full flex justify-between text-[11px] font-black text-yellow-300 px-1 mb-0.5">
          <span>แต้ม: {score.toLocaleString()}</span>
          <div className="flex gap-1 text-sm">
            <span className={currentStars >= 1 ? 'text-yellow-300 animate-bounce' : 'text-zinc-600'}>★</span>
            <span className={currentStars >= 2 ? 'text-yellow-300 animate-bounce' : 'text-zinc-600'}>★</span>
            <span className={currentStars >= 3 ? 'text-yellow-300 animate-bounce' : 'text-zinc-600'}>★</span>
          </div>
        </div>
        <div className="w-full h-3 rounded-full bg-black/60 border border-white/20 relative overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]"
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* =====================================================================
          8x8 WAFFLE / BISCUIT CHECKERBOARD GRID (AUTHENTIC CANDY CRUSH TILE SLOTS)
          ===================================================================== */}
      <div
        onPointerMove={handlePointerMove}
        onPointerUp={() => (dragStartRef.current = null)}
        className={`rounded-3xl p-2 relative shadow-2xl flex items-center justify-center shrink-0 border-4 border-[#854d0e] select-none backdrop-blur-md transition-transform duration-75 ${
          screenShake === 'heavy' ? 'translate-x-2 -translate-y-1 rotate-1 scale-[1.03]' : ''
        }`}
        style={{
          background: 'radial-gradient(circle at 50% 50%, #451a03 0%, #1c0a00 100%)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.9), inset 0 0 25px rgba(234, 179, 8, 0.2)',
          height: 'min(48vh, 390px)',
          width: 'min(48vh, 390px)',
        }}
      >
        {/* Background Candy Grid Slot Holes */}
        <div className="w-full h-full grid grid-cols-8 gap-0.5 relative z-10">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const hasJelly = jellyMap[r]?.[c];
              // Checkerboard pattern (alternating chocolate cookie slots)
              const isLightSlot = (r + c) % 2 === 0;

              return (
                <button
                  key={cell.id || `${r}-${c}`}
                  onPointerDown={(e) => handlePointerDown(r, c, e)}
                  onClick={() => handleCellClick(r, c)}
                  disabled={cell.type === -1}
                  className={`relative rounded-xl flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-90 touch-none shadow-inner ${
                    isLightSlot ? 'bg-[#50240d]' : 'bg-[#3b1706]'
                  } ${
                    isSelected
                      ? 'ring-4 ring-yellow-300 scale-110 z-30 shadow-[0_0_20px_rgba(253,224,71,1)]'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    aspectRatio: '1/1',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.7), inset 0 -1px 2px rgba(255,255,255,0.1)',
                  }}
                >
                  {/* Frosted Translucent Jelly Layer */}
                  {hasJelly && (
                    <div className="absolute inset-0 rounded-xl bg-cyan-400/40 border-2 border-cyan-200/80 shadow-[inset_0_0_12px_rgba(165,243,252,0.9)] pointer-events-none z-0 animate-pulse" />
                  )}

                  {/* 3D Glossy Candy Sprite */}
                  <div className="w-full h-full p-1 flex items-center justify-center relative z-10 pointer-events-none">
                    {renderCandy(cell)}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* HTML5 Canvas for Real Sugar Sparkles & Floating Score Particles */}
        <canvas
          ref={canvasRef}
          width={390}
          height={390}
          className="absolute inset-0 pointer-events-none z-30 w-full h-full"
        />

        {/* 3D Floating Announcer Banner */}
        {announcerBanner && (
          <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center animate-in zoom-in-75 duration-200">
            <div
              className={`px-7 py-3 rounded-3xl bg-gradient-to-r ${announcerBanner.color} text-black font-black text-2xl sm:text-3xl shadow-[0_0_45px_rgba(255,255,255,1)] border-2 border-white flex flex-col items-center tracking-wider animate-bounce`}
            >
              <span className="drop-shadow-md">{announcerBanner.text}</span>
              <span className="text-[11px] font-mono font-bold tracking-widest text-black/80">
                {announcerBanner.sub}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Boosters Toolbar */}
      <div className="w-full max-w-xs flex items-center justify-center gap-4 z-20 shrink-0 pb-1">
        {/* Lollipop Hammer Booster */}
        <button
          onClick={() => setActiveHammer(!activeHammer)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs shadow-xl transition-all cursor-pointer active:scale-95 ${
            activeHammer
              ? 'bg-amber-400 text-black ring-4 ring-white animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.9)]'
              : 'bg-black/60 text-white border border-white/25 hover:bg-black/80'
          }`}
        >
          <span className="text-base">🔨</span>
          <span>{activeHammer ? 'คลิกช่องที่ต้องการทุบ' : 'ค้อนทุบฟรี'}</span>
        </button>
      </div>

      {/* VICTORY MODAL */}
      {viewMode === 'victory' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in zoom-in-90">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-gradient-to-b from-[#3b0764] via-[#581c87] to-[#1e1b4b] border-2 border-yellow-400 shadow-[0_0_55px_rgba(250,204,21,0.7)] flex flex-col items-center text-center">
            <span className="text-5xl animate-bounce mb-1">🎉</span>
            <h2 className="text-2xl font-black text-yellow-300 tracking-wider">LEVEL COMPLETED!</h2>
            <p className="text-xs text-zinc-300 mb-4">{activeLevel.title}</p>

            <div className="flex gap-2 text-4xl text-yellow-300 my-2">
              <span className={currentStars >= 1 ? 'text-yellow-300 animate-bounce' : 'text-zinc-600'}>★</span>
              <span className={currentStars >= 2 ? 'text-yellow-300 animate-bounce' : 'text-zinc-600'}>★</span>
              <span className={currentStars >= 3 ? 'text-yellow-300 animate-bounce' : 'text-zinc-600'}>★</span>
            </div>

            <p className="text-sm font-bold text-white mb-6">คะแนนรวม: {score.toLocaleString()} แต้ม</p>

            <div className="w-full flex gap-2">
              <button
                onClick={() => handleStartLevel(activeLevel)}
                className="flex-1 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs cursor-pointer"
              >
                เล่นซ้ำ ↺
              </button>
              <button
                onClick={() => {
                  const nextLvl = CANDY_LEVELS.find((l) => l.id === activeLevel.id + 1) || activeLevel;
                  handleStartLevel(nextLvl);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-black text-xs shadow-lg cursor-pointer"
              >
                ด่านถัดไป ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER (OUT OF MOVES) MODAL */}
      {viewMode === 'gameover' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in zoom-in-90">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-gradient-to-b from-zinc-900 via-rose-950 to-zinc-900 border-2 border-rose-500 shadow-2xl flex flex-col items-center text-center">
            <span className="text-5xl mb-1">💔</span>
            <h2 className="text-xl font-black text-rose-400">OUT OF MOVES!</h2>
            <p className="text-xs text-zinc-400 mb-4">หมดจำนวนตาเดินแล้ว ลองใหม่อีกครั้งนะ</p>

            <div className="w-full flex gap-2">
              <button
                onClick={() => setViewMode('map')}
                className="flex-1 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs cursor-pointer"
              >
                กลับแผนที่ 🗺️
              </button>
              <button
                onClick={() => handleStartLevel(activeLevel)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-black text-xs shadow-lg cursor-pointer"
              >
                ลองใหม่ ↺
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
