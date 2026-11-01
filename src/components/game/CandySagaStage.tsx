import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CandyTileData, CandySpecialType } from '../../types/index.js';
import { CandyCrushEngine } from '../../services/candyEngine.js';
import { CANDY_LEVELS, CandyLevelConfig } from '../../services/candyLevels.js';
import {
  CANDY_COMPONENTS,
  StripedCandySVG,
  WrappedCandySVG,
  ColorBombSVG,
  LaserBeamOverlay,
  ShockwaveBlastOverlay,
  LightningZapOverlay,
} from './CandyGraphics.js';
import {
  playCandyPop,
  playCandySwapSound,
  playInvalidSwapSound,
  playLaserBeamSound,
  playExplosionSound,
  playColorBombSound,
  playStarChime,
  playHammerSmashSound,
  playVictoryFanfare,
  playAnnouncerVoice,
} from '../../services/candySoundEffects.js';

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

  // Animation & Motion States
  const [swappingPair, setSwappingPair] = useState<{
    r1: number;
    c1: number;
    r2: number;
    c2: number;
    phase: 'sliding' | 'reverting';
  } | null>(null);
  const [poppingCoords, setPoppingCoords] = useState<Set<string>>(new Set());
  const [fallingTiles, setFallingTiles] = useState<Record<string, number>>({});
  const [laserBeams, setLaserBeams] = useState<Array<{ id: string; type: 'h' | 'v'; index: number; color: string }>>([]);
  const [shockwaves, setShockwaves] = useState<Array<{ id: string; r: number; c: number }>>([]);
  const [lightningZaps, setLightningZaps] = useState<Array<{
    id: string;
    fromR: number;
    fromC: number;
    targets: Array<{ r: number; c: number }>;
  }>>([]);

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
        color: points >= 300 ? '#f43f5e' : points >= 150 ? '#fbbf24' : '#38bdf8',
      });
    }
  }, []);

  const spawnFloatingScore = useCallback((cellX: number, cellY: number, points: number) => {
    floatingTextsRef.current.push({
      x: cellX,
      y: cellY,
      text: `+${points}`,
      alpha: 1,
      color: points >= 300 ? '#f43f5e' : points >= 150 ? '#fbbf24' : '#38bdf8',
    });
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
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = '900 22px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
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

  // Execute Sequential Cascade Waves with Full Visual Kinematics
  const runCascadeLoop = async (
    currentBoard: CandyTileData[][],
    focusCoord: { r: number; c: number },
    currentMoves: number,
    isSpecialCombo: boolean,
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ) => {
    let cascadeCombo = 0;
    let totalScoreGained = 0;
    let currentScore = score;
    const currentJelly = jellyMap.map((row) => [...row]);
    const currentOrders = { ...collectedOrders };

    // 1. Handle Special Combo Pre-Explosions (Color Bomb, Striped+Striped, etc.)
    if (isSpecialCombo) {
      const tile1 = currentBoard[r1][c1];
      const tile2 = currentBoard[r2][c2];

      if (tile1.special === 'color_bomb' || tile2.special === 'color_bomb') {
        const colorBombCoord = tile1.special === 'color_bomb' ? { r: r1, c: c1 } : { r: r2, c: c2 };
        const otherTile = tile1.special === 'color_bomb' ? tile2 : tile1;
        playColorBombSound();
        setScreenShake('heavy');

        const targets: Array<{ r: number; c: number }> = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (currentBoard[r][c].type === otherTile.type && (r !== colorBombCoord.r || c !== colorBombCoord.c)) {
              targets.push({ r, c });
            }
          }
        }

        setLightningZaps([{ id: `zap-${Date.now()}`, fromR: colorBombCoord.r, fromC: colorBombCoord.c, targets }]);
        await new Promise((resolve) => setTimeout(resolve, 450));
        setLightningZaps([]);
      } else if (
        (tile1.special === 'striped_h' || tile1.special === 'striped_v') &&
        (tile2.special === 'striped_h' || tile2.special === 'striped_v')
      ) {
        playLaserBeamSound();
        setScreenShake('heavy');
        setLaserBeams([
          { id: `lh-${Date.now()}`, type: 'h', index: r2, color: '#38bdf8' },
          { id: `lv-${Date.now()}`, type: 'v', index: c2, color: '#ec4899' },
        ]);
        await new Promise((resolve) => setTimeout(resolve, 400));
        setLaserBeams([]);
      } else if (tile1.special === 'wrapped' && tile2.special === 'wrapped') {
        playExplosionSound();
        setScreenShake('heavy');
        setShockwaves([{ id: `sw-${Date.now()}`, r: r2, c: c2 }]);
        await new Promise((resolve) => setTimeout(resolve, 420));
        setShockwaves([]);
      }
    }

    // 2. Sequential Cascade Loop
    while (true) {
      const { matchedCoords, specialsToSpawn } = CandyCrushEngine.findMatches(currentBoard, focusCoord);
      if (matchedCoords.size === 0) break;

      cascadeCombo++;
      playCandyPop(cascadeCombo);

      // Announcer voice check
      if (cascadeCombo >= 3) {
        const voiceKeys = ['sweet', 'tasty', 'delicious', 'divine'] as const;
        const v = voiceKeys[Math.min(cascadeCombo - 3, voiceKeys.length - 1)];
        playAnnouncerVoice(v);
        setScreenShake(cascadeCombo >= 5 ? 'heavy' : 'light');
        setTimeout(() => setScreenShake('none'), 600);

        const voiceMap: Record<string, { text: string; sub: string; color: string }> = {
          sweet: { text: 'SWEET!', sub: '3x COMBO', color: 'from-amber-400 via-yellow-300 to-amber-500' },
          tasty: { text: 'TASTY!', sub: '4x COMBO', color: 'from-orange-500 via-amber-400 to-yellow-400' },
          delicious: { text: 'DELICIOUS!', sub: '5x SUPER COMBO', color: 'from-pink-500 via-purple-400 to-indigo-500' },
          divine: { text: 'DIVINE!', sub: '6x MEGA COMBO', color: 'from-cyan-400 via-sky-300 to-blue-500' },
        };
        setAnnouncerBanner(voiceMap[v]);
        setTimeout(() => setAnnouncerBanner(null), 1600);
      }

      // Check special detonations within matched tiles
      const destroyed = new Set<string>(matchedCoords);
      const newBeams: Array<{ id: string; type: 'h' | 'v'; index: number; color: string }> = [];
      const newShockwaves: Array<{ id: string; r: number; c: number }> = [];

      matchedCoords.forEach((coord) => {
        const [r, c] = coord.split(',').map(Number);
        const tile = currentBoard[r][c];
        if (tile.special === 'striped_h') {
          playLaserBeamSound();
          for (let col = 0; col < 8; col++) destroyed.add(`${r},${col}`);
          newBeams.push({ id: `lh-${r}-${Date.now()}`, type: 'h', index: r, color: '#38bdf8' });
        } else if (tile.special === 'striped_v') {
          playLaserBeamSound();
          for (let row = 0; row < 8; row++) destroyed.add(`${row},${c}`);
          newBeams.push({ id: `lv-${c}-${Date.now()}`, type: 'v', index: c, color: '#f43f5e' });
        } else if (tile.special === 'wrapped') {
          playExplosionSound();
          newShockwaves.push({ id: `sw-${r}-${c}`, r, c });
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) destroyed.add(`${nr},${nc}`);
            }
          }
        }
      });

      if (newBeams.length > 0) {
        setLaserBeams(newBeams);
        setScreenShake('light');
      }
      if (newShockwaves.length > 0) {
        setShockwaves(newShockwaves);
        setScreenShake('heavy');
      }

      // Highlight popping tiles (scale up & glow white-hot)
      setPoppingCoords(new Set(destroyed));

      // Particle Bursts on Canvas & Floating Score text
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const cellSize = rect.width / 8;
        const wavePoints = Math.round(destroyed.size * 25 * (1 + cascadeCombo * 0.4));
        totalScoreGained += wavePoints;
        currentScore += wavePoints;
        setScore(currentScore);

        destroyed.forEach((coord) => {
          const [r, c] = coord.split(',').map(Number);
          const tile = currentBoard[r][c];
          const candyColors = ['#ef233c', '#9333ea', '#eab308', '#22c55e', '#f97316', '#0284c7'];
          const color = tile.type >= 0 ? candyColors[tile.type] : '#ffd700';
          spawnSugarBurst(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2, color);
        });

        const coordsArr = Array.from(destroyed);
        const midCoord = coordsArr[Math.floor(coordsArr.length / 2)].split(',').map(Number);
        spawnFloatingScore(midCoord[1] * cellSize + cellSize / 2, midCoord[0] * cellSize + cellSize / 2, wavePoints);
      }

      // Clear jelly on destroyed coords
      if (activeLevel.type === 'jelly') {
        destroyed.forEach((coord) => {
          const [r, c] = coord.split(',').map(Number);
          currentJelly[r][c] = false;
        });
        setJellyMap(currentJelly.map((row) => [...row]));
      }

      // Orders tracking
      if (activeLevel.targetOrders) {
        activeLevel.targetOrders.forEach((ord) => {
          currentOrders[ord.type] = (currentOrders[ord.type] || 0) + Math.round(destroyed.size / 4);
        });
        setCollectedOrders({ ...currentOrders });
      }

      // Wait for pop celebration & laser beam
      await new Promise((resolve) => setTimeout(resolve, 220));
      setLaserBeams([]);
      setShockwaves([]);
      setPoppingCoords(new Set());

      // Mark destroyed tiles as -1
      destroyed.forEach((coord) => {
        const [r, c] = coord.split(',').map(Number);
        currentBoard[r][c] = { id: `del-${r}-${c}`, type: -1, special: 'none', hasItem: false };
      });

      // Place newly created specials into board
      specialsToSpawn.forEach((spec, coord) => {
        const [r, c] = coord.split(',').map(Number);
        currentBoard[r][c] = {
          id: `spec-${r}-${c}-${Date.now()}`,
          type: spec.type,
          special: spec.special,
          hasItem: false,
        };
      });

      // Gravity Drop & Refill with physical tracking
      const { dropMap } = CandyCrushEngine.refillBoardWithTracking(currentBoard);
      setFallingTiles(dropMap);
      setBoard(currentBoard.map((row) => row.map((cell) => ({ ...cell }))));

      // Wait for candies to physically drop and bounce down into place
      await new Promise((resolve) => setTimeout(resolve, 260));
      setFallingTiles({});
      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    setIsProcessing(false);

    // Check Victory
    const isTargetMet = checkLevelProgress(currentScore, currentJelly, currentOrders);
    if (isTargetMet) {
      const sugarBonus = currentMoves * 250;
      handleLevelWin(currentScore + sugarBonus);
    } else if (currentMoves <= 0) {
      setViewMode('gameover');
    }
  };

  // Perform Swap with Visual Sliding & Invalid Bounce-Back
  const handlePerformSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isProcessing || movesLeft <= 0) return;
    setIsProcessing(true);
    setSelectedCell(null);

    // 1. Check Swap Validity
    const { valid, isSpecialCombo } = CandyCrushEngine.validateSwap(board, r1, c1, r2, c2);

    if (!valid) {
      // INVALID: Slide halfway towards each other, then bounce back with a dull thud!
      playCandySwapSound();
      setSwappingPair({ r1, c1, r2, c2, phase: 'sliding' });

      await new Promise((resolve) => setTimeout(resolve, 180));
      playInvalidSwapSound();
      setSwappingPair({ r1, c1, r2, c2, phase: 'reverting' });

      await new Promise((resolve) => setTimeout(resolve, 180));
      setSwappingPair(null);
      setIsProcessing(false);
      return;
    }

    // VALID: Smoothly slide past each other
    playCandySwapSound();
    setSwappingPair({ r1, c1, r2, c2, phase: 'sliding' });

    const newMoves = movesLeft - 1;
    setMovesLeft(newMoves);

    await new Promise((resolve) => setTimeout(resolve, 190));

    // Update board state with swapped tiles
    const curBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    const temp = curBoard[r1][c1];
    curBoard[r1][c1] = curBoard[r2][c2];
    curBoard[r2][c2] = temp;
    setBoard(curBoard.map((row) => row.map((cell) => ({ ...cell }))));
    setSwappingPair(null);

    // Execute sequential cascade animation loop
    await runCascadeLoop(curBoard, { r: r2, c: c2 }, newMoves, isSpecialCombo, r1, c1, r2, c2);
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
    <div className="w-full h-full flex flex-col justify-between items-center bg-gradient-to-b from-[#38bdf8] via-[#7dd3fc] to-[#bae6fd] text-white p-2 sm:p-4 select-none relative overflow-hidden rounded-3xl border-2 border-amber-400/40 shadow-2xl">
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
        className={`rounded-3xl p-2 relative shadow-2xl flex items-center justify-center shrink-0 border-4 border-amber-400/90 select-none backdrop-blur-md transition-transform duration-75 ${
          screenShake === 'heavy' ? 'translate-x-2 -translate-y-1 rotate-1 scale-[1.03]' : ''
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(56, 189, 248, 0.4)',
          height: 'min(48vh, 390px)',
          width: 'min(48vh, 390px)',
        }}
      >
        {/* Dynamic Visual FX Overlays: Laser Beams, Shockwaves, Lightning Zaps */}
        {laserBeams.map((beam) => (
          <LaserBeamOverlay key={beam.id} type={beam.type} index={beam.index} color={beam.color} />
        ))}
        {shockwaves.map((sw) => (
          <ShockwaveBlastOverlay key={sw.id} r={sw.r} c={sw.c} />
        ))}
        {lightningZaps.map((zap) => (
          <LightningZapOverlay key={zap.id} fromR={zap.fromR} fromC={zap.fromC} targets={zap.targets} />
        ))}

        {/* 8x8 Candy Grid with Fixed Biscuit Slots and Kinematic Candy Transforms */}
        <div className="w-full h-full grid grid-cols-8 gap-0.5 relative z-10">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const hasJelly = jellyMap[r]?.[c];
              const isLightSlot = (r + c) % 2 === 0;

              // Sliding swap animation check
              const isSwapping =
                swappingPair &&
                ((swappingPair.r1 === r && swappingPair.c1 === c) ||
                  (swappingPair.r2 === r && swappingPair.c2 === c));

              let swapTransform = '';
              let swapTransition = '';
              let zIndex = isSelected ? 40 : 10;

              if (isSwapping) {
                zIndex = 50;
                const isFirst = swappingPair.r1 === r && swappingPair.c1 === c;
                const targetR = isFirst ? swappingPair.r2 : swappingPair.r1;
                const targetC = isFirst ? swappingPair.c2 : swappingPair.c1;
                const dX = (targetC - c) * 100;
                const dY = (targetR - r) * 100;

                if (swappingPair.phase === 'sliding') {
                  swapTransform = `translate(${dX}%, ${dY}%) scale(1.15)`;
                  swapTransition = 'transform 180ms cubic-bezier(0.25, 1, 0.5, 1)';
                } else {
                  swapTransform = 'translate(0%, 0%) scale(0.95)';
                  swapTransition = 'transform 160ms cubic-bezier(0.4, 0, 0.2, 1)';
                }
              }

              // Popping animation check
              const isPopping = poppingCoords.has(`${r},${c}`);

              // Gravity drop animation check
              const dropDistance = fallingTiles[cell.id] || 0;
              const isFalling = dropDistance > 0;

              let tileTransform = '';
              let tileTransition = '';

              if (isSwapping) {
                tileTransform = swapTransform;
                tileTransition = swapTransition;
              } else if (isPopping) {
                tileTransform = 'scale(1.35) rotate(10deg)';
                tileTransition = 'transform 180ms ease-out, filter 180ms ease-out';
              } else if (isFalling) {
                tileTransform = `translateY(${-dropDistance * 80}%)`;
                tileTransition = 'transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)';
              }

              return (
                <div
                  key={`slot-${r}-${c}`}
                  className={`relative rounded-xl flex items-center justify-center select-none ${
                    isLightSlot ? 'bg-white/10' : 'bg-black/25'
                  }`}
                  style={{
                    aspectRatio: '1/1',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6), inset 0 -1px 2px rgba(255,255,255,0.08)',
                  }}
                >
                  {/* Frosted Translucent Jelly Layer */}
                  {hasJelly && (
                    <div className="absolute inset-0 rounded-xl bg-cyan-400/40 border-2 border-cyan-200/80 shadow-[inset_0_0_12px_rgba(165,243,252,0.9)] pointer-events-none z-0 animate-pulse" />
                  )}

                  {/* 3D Glossy Candy Sprite with Kinematic Motion */}
                  {cell.type !== -1 && (
                    <button
                      onPointerDown={(e) => handlePointerDown(r, c, e)}
                      onClick={() => handleCellClick(r, c)}
                      disabled={isProcessing}
                      className={`w-full h-full p-1 flex items-center justify-center relative cursor-pointer active:scale-95 touch-none ${
                        isSelected
                          ? 'ring-4 ring-yellow-300 rounded-xl scale-110 shadow-[0_0_20px_rgba(253,224,71,1)]'
                          : 'hover:scale-105'
                      } ${isPopping ? 'brightness-150 drop-shadow-[0_0_20px_white]' : ''}`}
                      style={{
                        zIndex,
                        transform: tileTransform,
                        transition: tileTransition,
                      }}
                    >
                      {renderCandy(cell)}
                    </button>
                  )}
                </div>
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
