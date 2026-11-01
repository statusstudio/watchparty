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
  theme?: 'dark' | 'light';
}

// 6 Candy Color Types
const CANDY_TYPES = [
  { id: 0, name: 'ruby', label: 'สตรอว์เบอร์รี่', color: 'from-rose-500 via-red-400 to-rose-700', shadow: 'rgba(244,63,94,0.6)', border: 'border-rose-300' },
  { id: 1, name: 'cyan', label: 'บลูเบอร์รี่', color: 'from-sky-400 via-cyan-300 to-blue-600', shadow: 'rgba(14,165,233,0.6)', border: 'border-cyan-200' },
  { id: 2, name: 'lemon', label: 'เลมอนทอง', color: 'from-amber-400 via-yellow-300 to-amber-600', shadow: 'rgba(245,158,11,0.6)', border: 'border-yellow-200' },
  { id: 3, name: 'mint', label: 'มินต์หยก', color: 'from-emerald-400 via-green-300 to-teal-600', shadow: 'rgba(16,185,129,0.6)', border: 'border-emerald-200' },
  { id: 4, name: 'grape', label: 'องุ่นม่วง', color: 'from-purple-500 via-fuchsia-400 to-indigo-700', shadow: 'rgba(168,85,247,0.6)', border: 'border-purple-200' },
  { id: 5, name: 'orange', label: 'ส้มเยลลี่', color: 'from-orange-400 via-amber-300 to-orange-600', shadow: 'rgba(249,115,22,0.6)', border: 'border-orange-200' },
];

const ITEM_TYPES: CandyItemType[] = ['heal', 'shield', 'fire', 'hammer'];

interface BoardTile {
  id: string;
  type: number;
  hasItem: boolean;
  itemType?: CandyItemType;
  isMatched?: boolean;
}

const GRID_SIZE = 7;

function createRandomBoard(): BoardTile[][] {
  const board: BoardTile[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: BoardTile[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let type: number;
      // Prevent 3-in-a-row on initial board
      do {
        type = Math.floor(Math.random() * CANDY_TYPES.length);
      } while (
        (c >= 2 && row[c - 1].type === type && row[c - 2].type === type) ||
        (r >= 2 && board[r - 1][c].type === type && board[r - 2][c].type === type)
      );

      // 18% chance to hold a hidden mystery item
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
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // Game Board State
  const [board, setBoard] = useState<BoardTile[][]>(() => createRandomBoard());
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeHammerMode, setActiveHammerMode] = useState(false);

  // Player Inventory
  const [inventory, setInventory] = useState<Record<CandyItemType, number>>({
    heal: 0,
    shield: 0,
    fire: 0,
    hammer: 0,
  });

  // Visual Effects
  const [recentItemRevealed, setRecentItemRevealed] = useState<{ name: string; icon: string } | null>(null);
  const [screenVFX, setScreenVFX] = useState<'fire' | 'heal' | 'shield' | null>(null);
  const [floatingDamage, setFloatingDamage] = useState<{ id: string; text: string; x: number; y: number }[]>([]);

  // Sound ref for countdown
  const lastCountdownRef = useRef<number>(-1);
  const prevPhaseRef = useRef<string | undefined>(gameState?.phase);

  const myPlayer = gameState?.players.find((p) => p.userId === currentUser.id);
  const isSpectator = !myPlayer;
  const isHost = myPlayer?.isHost;
  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

  // Audio countdown cue
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

  // Reset board on playing start
  useEffect(() => {
    if (gameState?.phase === 'playing') {
      setBoard(createRandomBoard());
      setInventory({ heal: 1, shield: 0, fire: 0, hammer: 1 }); // Give 1 starter heal & hammer
      setActiveHammerMode(false);
    }
  }, [gameState?.phase]);

  // Remove temporary item toast
  useEffect(() => {
    if (recentItemRevealed) {
      const timer = setTimeout(() => setRecentItemRevealed(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [recentItemRevealed]);

  // Remove screen VFX
  useEffect(() => {
    if (screenVFX) {
      const timer = setTimeout(() => setScreenVFX(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [screenVFX]);

  // Match-3 Processing Algorithm
  const checkAndClearMatches = useCallback((currentBoard: BoardTile[][], currentCombo: number = 1): boolean => {
    const matchedCoords = new Set<string>();

    // Horizontal check
    for (let r = 0; r < GRID_SIZE; r++) {
      let matchLen = 1;
      for (let c = 1; c < GRID_SIZE; c++) {
        if (currentBoard[r][c].type === currentBoard[r][c - 1].type) {
          matchLen++;
        } else {
          if (matchLen >= 3) {
            for (let k = 0; k < matchLen; k++) {
              matchedCoords.add(`${r},${c - 1 - k}`);
            }
          }
          matchLen = 1;
        }
      }
      if (matchLen >= 3) {
        for (let k = 0; k < matchLen; k++) {
          matchedCoords.add(`${r},${GRID_SIZE - 1 - k}`);
        }
      }
    }

    // Vertical check
    for (let c = 0; c < GRID_SIZE; c++) {
      let matchLen = 1;
      for (let r = 1; r < GRID_SIZE; r++) {
        if (currentBoard[r][c].type === currentBoard[r - 1][c].type) {
          matchLen++;
        } else {
          if (matchLen >= 3) {
            for (let k = 0; k < matchLen; k++) {
              matchedCoords.add(`${r - 1 - k},${c}`);
            }
          }
          matchLen = 1;
        }
      }
      if (matchLen >= 3) {
        for (let k = 0; k < matchLen; k++) {
          matchedCoords.add(`${GRID_SIZE - 1 - k},${c}`);
        }
      }
    }

    if (matchedCoords.size === 0) {
      return false;
    }

    // Play Pop sound
    playCandyPop(currentCombo);

    // Harvest items and calculate damage
    let damage = Math.round(matchedCoords.size * 2.5 * (1 + (currentCombo - 1) * 0.4));
    const itemsFound: CandyItemType[] = [];

    matchedCoords.forEach((coord) => {
      const [r, c] = coord.split(',').map(Number);
      const tile = currentBoard[r][c];
      if (tile.hasItem && tile.itemType) {
        itemsFound.push(tile.itemType);
      }
    });

    if (itemsFound.length > 0) {
      playItemRevealSound();
      setInventory((prev) => {
        const next = { ...prev };
        itemsFound.forEach((it) => {
          next[it] = (next[it] || 0) + 1;
        });
        return next;
      });

      const firstItem = itemsFound[0];
      const itemMeta = {
        heal: { name: 'ยาเพิ่มเลือด 💚 (+30 HP)', icon: 'vital_signs' },
        shield: { name: 'เกราะป้องกัน 🛡️', icon: 'shield' },
        fire: { name: 'คลื่นไฟโจมตีหมู่ 🔥 (-20 HP)', icon: 'local_fire_department' },
        hammer: { name: 'ค้อนวิเศษ 🔨', icon: 'hardware' },
      }[firstItem];
      if (itemMeta) setRecentItemRevealed(itemMeta);
    }

    // Send attack to server!
    if (myPlayer && !myPlayer.isDead) {
      onAttack(damage, currentCombo, myPlayer.targetUserId || undefined);
    }

    // Drop and refill board
    const nextBoard = currentBoard.map((row) => row.map((cell) => ({ ...cell })));

    // Clear matched cells
    matchedCoords.forEach((coord) => {
      const [r, c] = coord.split(',').map(Number);
      nextBoard[r][c] = {
        id: `empty-${r}-${c}`,
        type: -1,
        hasItem: false,
      };
    });

    // Gravity drop per column
    for (let c = 0; c < GRID_SIZE; c++) {
      const colItems: BoardTile[] = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        if (nextBoard[r][c].type !== -1) {
          colItems.push(nextBoard[r][c]);
        }
      }
      const missingCount = GRID_SIZE - colItems.length;
      for (let i = 0; i < missingCount; i++) {
        const hasItem = Math.random() < 0.18;
        const itemType = hasItem ? ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)] : undefined;
        colItems.unshift({
          id: `new-${c}-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          type: Math.floor(Math.random() * CANDY_TYPES.length),
          hasItem,
          itemType,
        });
      }
      for (let r = 0; r < GRID_SIZE; r++) {
        nextBoard[r][c] = colItems[r];
      }
    }

    setBoard(nextBoard);

    // Chain combo cascade check
    setTimeout(() => {
      checkAndClearMatches(nextBoard, currentCombo + 1);
    }, 280);

    return true;
  }, [myPlayer, onAttack]);

  // Handle cell click (Swap or Hammer)
  const handleCellClick = (r: number, c: number) => {
    if (gameState?.phase !== 'playing' || myPlayer?.isDead || isProcessing) return;

    // Active Hammer smash mode
    if (activeHammerMode) {
      playHammerSmashSound();
      setActiveHammerMode(false);

      const targetTile = board[r][c];
      if (targetTile.hasItem && targetTile.itemType) {
        playItemRevealSound();
        setInventory((prev) => ({
          ...prev,
          [targetTile.itemType!]: (prev[targetTile.itemType!] || 0) + 1,
        }));
      }

      // Break this tile and trigger gravity
      const nextBoard = board.map((row) => row.map((cell) => ({ ...cell })));
      nextBoard[r][c] = { id: `smashed-${r}-${c}`, type: -1, hasItem: false };

      // Gravity fill
      for (let col = 0; col < GRID_SIZE; col++) {
        const colItems = [];
        for (let row = 0; row < GRID_SIZE; row++) {
          if (nextBoard[row][col].type !== -1) colItems.push(nextBoard[row][col]);
        }
        const missing = GRID_SIZE - colItems.length;
        for (let i = 0; i < missing; i++) {
          const hasItem = Math.random() < 0.18;
          colItems.unshift({
            id: `spawn-${col}-${i}-${Date.now()}`,
            type: Math.floor(Math.random() * CANDY_TYPES.length),
            hasItem,
            itemType: hasItem ? ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)] : undefined,
          });
        }
        for (let row = 0; row < GRID_SIZE; row++) {
          nextBoard[row][col] = colItems[row];
        }
      }

      setBoard(nextBoard);
      setTimeout(() => checkAndClearMatches(nextBoard, 1), 200);
      return;
    }

    // Regular Match-3 Click Selection
    if (!selectedCell) {
      setSelectedCell({ r, c });
      return;
    }

    const { r: r1, c: c1 } = selectedCell;
    const isAdjacent = (Math.abs(r - r1) === 1 && c === c1) || (Math.abs(c - c1) === 1 && r === r1);

    if (!isAdjacent) {
      setSelectedCell({ r, c });
      return;
    }

    // Try Swap
    setIsProcessing(true);
    setSelectedCell(null);

    const testBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    const temp = testBoard[r1][c1];
    testBoard[r1][c1] = testBoard[r][c];
    testBoard[r][c] = temp;

    setBoard(testBoard);

    setTimeout(() => {
      const hasMatch = checkAndClearMatches(testBoard, 1);
      if (!hasMatch) {
        // Swap back if no match!
        setBoard(board);
      }
      setIsProcessing(false);
    }, 180);
  };

  // Handle Item Use
  const handleTriggerItem = (item: CandyItemType) => {
    if (inventory[item] <= 0 || myPlayer?.isDead) return;

    if (item === 'hammer') {
      setActiveHammerMode(!activeHammerMode);
      return;
    }

    // Decrement item
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
  // 1. LOBBY VIEW (Waiting Phase)
  // -------------------------------------------------------------------------
  if (!gameState || gameState.phase === 'waiting' || gameState.phase === 'countdown') {
    const players = gameState?.players || [];
    const isFull = players.length >= 4;
    const isCountdown = gameState?.phase === 'countdown';

    return (
      <div className={`w-full h-full flex-1 flex flex-col items-center justify-center p-3 sm:p-5 relative overflow-hidden select-none ${
        isLight ? 'bg-gradient-to-b from-[#faf8ff] via-[#f1f4ff] to-[#e4eaff] text-[#131b2e]' : 'bg-gradient-to-b from-[#111319] via-[#161922] to-[#0c0e14] text-[#e2e2ea]'
      }`}>
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Title & Badge */}
        <div className="flex flex-col items-center text-center z-10 max-w-md">
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400 font-extrabold text-xs tracking-wider uppercase mb-2 shadow-sm animate-pulse">
            <span>🍬 Candy Battle Royale 3D</span>
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <span>ศึกประลองแคนดี้ 4 ผู้เล่น</span>
            <span className="text-2xl">⚔️</span>
          </h2>
          <p className={`text-xs mt-1 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            สู้กันด้วยเลือด 100 HP เท่ากันทุกคน เรียงลูกอมเพื่อโจมตี เก็บไอเทมลับ และเอาชีวิตรอดเป็นคนสุดท้าย!
          </p>

          {/* 30s Countdown Banner / Countdown 3..2..1 */}
          <div className="mt-3 w-full p-2.5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-[20px] animate-spin">
                {isCountdown ? 'timer' : 'hourglass_top'}
              </span>
              <span className="text-xs font-bold">
                {isCountdown
                  ? `🚀 กำลังเริ่มเกมใน ${gameState.lobbyTimeLeft} วินาที...`
                  : `⏳ เริ่มเกมอัตโนมัติใน ${gameState?.lobbyTimeLeft || 30}s (หรือครบ 4 คน)`}
              </span>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-mono font-bold text-cyan-400">
              {players.length} / 4 ผู้เล่น
            </span>
          </div>
        </div>

        {/* 4 Player Podiums */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-5 sm:my-6 w-full max-w-2xl z-10">
          {[0, 1, 2, 3].map((slotIdx) => {
            const player = players[slotIdx];

            return (
              <div
                key={slotIdx}
                className={`relative rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-between text-center border transition-all duration-300 min-h-[160px] sm:min-h-[180px] shadow-lg ${
                  player
                    ? isLight
                      ? 'bg-white border-[#dae2fd] shadow-md ring-2 ring-pink-500/30'
                      : 'bg-[#191b22] border-white/15 shadow-xl ring-2 ring-cyan-500/30'
                    : isLight
                    ? 'bg-white/40 border-dashed border-[#dae2fd]'
                    : 'bg-white/[0.03] border-dashed border-white/10'
                }`}
              >
                {/* Slot Tag */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-black/40 text-white/80">
                  ที่นั่ง {slotIdx + 1}
                </div>

                {player ? (
                  <>
                    {player.isHost && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black shadow-xs">
                        👑 หัวหน้าห้อง
                      </span>
                    )}

                    <div className="relative mt-4">
                      <img
                        src={player.avatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                        alt={player.userName}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-pink-400 shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-[9px] font-black text-white">
                        100 HP
                      </div>
                    </div>

                    <div className="w-full mt-2 min-w-0">
                      <p className="text-xs font-bold truncate">{player.userName}</p>
                      <p className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        พร้อมแข่งขัน
                      </p>
                    </div>

                    {/* Leave Button if Self */}
                    {player.userId === currentUser.id && (
                      <button
                        onClick={onLeaveLobby}
                        className="mt-2 text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                      >
                        สละสิทธิ์
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center my-auto">
                    <div className="w-12 h-12 rounded-2xl border border-dashed border-white/20 flex items-center justify-center text-white/40 mb-2">
                      <span className="material-symbols-outlined text-[24px]">add</span>
                    </div>
                    {!myPlayer ? (
                      <button
                        onClick={onJoinLobby}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-105 active:scale-95 text-white text-[11px] font-bold shadow-md cursor-pointer transition-all"
                      >
                        ขึ้นเล่นที่นั่งนี้
                      </button>
                    ) : (
                      <span className="text-[10px] text-zinc-500">รอผู้เล่น...</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 z-10">
          {/* Host Start Button */}
          {isHost && (
            <button
              onClick={onStartGame}
              disabled={players.length < 1 || isCountdown}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:scale-105 active:scale-95 text-white font-black text-sm shadow-[0_4px_20px_rgba(16,185,129,0.5)] cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">play_arrow</span>
              <span>เริ่มเกมทันที (Start Match)</span>
            </button>
          )}

          {/* Join button for spectator */}
          {!myPlayer && !isFull && (
            <button
              onClick={onJoinLobby}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:scale-105 active:scale-95 text-white font-black text-sm shadow-[0_4px_20px_rgba(236,72,153,0.5)] cursor-pointer transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">sports_esports</span>
              <span>กดขึ้นเล่นเกม (Join Match)</span>
            </button>
          )}

          {/* Stop / Exit Game button for Admin/Owner */}
          {isAdminOrOwner && (
            <button
              onClick={onStopGame}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-white/10 text-xs font-semibold cursor-pointer transition-all"
            >
              ยุติเกม
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 2. PLAYING & GAME OVER VIEW
  // -------------------------------------------------------------------------
  const players = gameState.players;
  const isGameOver = gameState.phase === 'game_over';

  return (
    <div className={`w-full h-full flex-1 flex flex-col relative overflow-hidden select-none ${
      isLight ? 'bg-gradient-to-b from-[#faf8ff] to-[#edf1fd] text-[#131b2e]' : 'bg-gradient-to-b from-[#0f1117] via-[#14161f] to-[#0a0c10] text-[#e2e2ea]'
    }`}>
      {/* Screen Effects Layer */}
      {screenVFX === 'fire' && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-red-600/30 animate-pulse border-4 border-red-500 flex items-center justify-center">
          <div className="text-4xl sm:text-6xl animate-bounce">🔥🔥🔥</div>
        </div>
      )}
      {screenVFX === 'heal' && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-emerald-500/20 animate-pulse border-4 border-emerald-400 flex items-center justify-center">
          <div className="text-4xl sm:text-6xl animate-bounce">💚💚💚</div>
        </div>
      )}
      {screenVFX === 'shield' && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-cyan-500/20 animate-pulse border-4 border-cyan-400 flex items-center justify-center">
          <div className="text-4xl sm:text-6xl animate-bounce">🛡️✨</div>
        </div>
      )}

      {/* Item Discovery Popover */}
      {recentItemRevealed && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-extrabold text-xs shadow-2xl animate-bounce flex items-center gap-2">
          <span>✨ ปลดล็อกไอเทมลับ:</span>
          <span>{recentItemRevealed.name}</span>
        </div>
      )}

      {/* TOP HEADER: Battle HUD & Match Time */}
      <div className="px-3 py-2 border-b dark:border-white/10 border-black/10 flex items-center justify-between gap-2 shrink-0 bg-black/20 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">🍬</span>
          <span className="font-black text-xs sm:text-sm tracking-tight text-pink-400">
            CANDY BATTLE ROYALE
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
            ⚔️ สู้กันด้วยเลือด (100 HP)
          </span>
        </div>

        {/* Match Timer */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-black/40 border border-white/10 font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">timer</span>
            <span>{Math.floor(gameState.gameTimeLeft / 60)}:{(gameState.gameTimeLeft % 60).toString().padStart(2, '0')}</span>
          </div>

          {isAdminOrOwner && (
            <button
              onClick={onStopGame}
              className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 text-xs"
              title="ยุติเกม"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* MAIN ARENA: 4 Players Status Bars (Surrounding the board) */}
      <div className="px-3 py-2 grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 z-20">
        {players.map((p) => {
          const isTarget = myPlayer?.targetUserId === p.userId;
          const isSelf = p.userId === currentUser.id;

          return (
            <div
              key={p.userId}
              onClick={() => {
                if (!isSelf && !p.isDead && myPlayer && !myPlayer.isDead) {
                  onSelectTarget(p.userId);
                }
              }}
              className={`relative rounded-2xl p-2 sm:p-2.5 border transition-all cursor-pointer ${
                p.isDead
                  ? 'opacity-40 grayscale bg-black/30 border-white/5'
                  : isTarget
                  ? 'bg-rose-500/15 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-102 ring-2 ring-rose-400'
                  : isSelf
                  ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-black/30 border-white/10 hover:border-white/30'
              }`}
            >
              {/* Target Indicator */}
              {isTarget && (
                <div className="absolute -top-2 right-2 px-2 py-0.2 rounded-full bg-rose-500 text-white font-black text-[8px] animate-pulse">
                  🎯 เป้าหมายคุณ
                </div>
              )}
              {isSelf && (
                <div className="absolute -top-2 right-2 px-2 py-0.2 rounded-full bg-cyan-500 text-black font-black text-[8px]">
                  คุณ (ME)
                </div>
              )}

              {/* Player Top row */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img
                    src={p.avatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                    alt={p.userName}
                    className="w-8 h-8 rounded-xl object-cover border border-white/20"
                  />
                  {p.shield && (
                    <span className="absolute -top-1 -right-1 text-xs animate-bounce" title="มีเกราะป้องกัน">
                      🛡️
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold truncate leading-tight">{p.userName}</p>
                  <p className="font-mono text-[9px] font-bold text-emerald-400 mt-0.5">
                    {p.isDead ? '💀 K.O. ตกรอบ' : `${p.hp} / 100 HP`}
                  </p>
                </div>
              </div>

              {/* HP Bar */}
              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden mt-1.5 border border-white/10">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    p.hp > 50
                      ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                      : p.hp > 25
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                      : 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, p.hp))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* CENTER: 3D Match-3 Candy Board */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 z-10 overflow-hidden relative">
        {/* Active Target Banner */}
        {myPlayer && !myPlayer.isDead && (
          <div className="text-[10px] font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
            <span>แตะการ์ดเพื่อนด้านบนเพื่อเปลี่ยนเป้าหมาย:</span>
            <span className="text-rose-400 font-extrabold">
              🎯 {players.find((p) => p.userId === myPlayer.targetUserId)?.userName || 'สุ่มเป้าหมายอัตโนมัติ'}
            </span>
          </div>
        )}

        {/* 7x7 Candy Board Container */}
        <div
          className={`relative p-2 rounded-3xl border shadow-2xl backdrop-blur-xl ${
            isLight
              ? 'bg-white/80 border-[#dae2fd] shadow-[0_12px_36px_rgba(0,0,0,0.1)]'
              : 'bg-[#151720]/90 border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]'
          }`}
          style={{ maxWidth: '420px', width: '100%', aspectRatio: '1/1' }}
        >
          {/* Active Hammer Indicator Overlay */}
          {activeHammerMode && (
            <div className="absolute top-2 inset-x-2 px-3 py-1 rounded-xl bg-amber-500 text-black text-[10px] font-black text-center z-30 shadow-md animate-pulse">
              🔨 โหมดค้อนวิเศษ: จิ้มทุบลูกแคนดี้ที่ต้องการ 1 ลูกทันที!
            </div>
          )}

          {/* Grid Cells */}
          <div className="w-full h-full grid grid-cols-7 gap-1 sm:gap-1.5">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const candyMeta = CANDY_TYPES[cell.type] || CANDY_TYPES[0];
                const isSelected = selectedCell?.r === r && selectedCell?.c === c;

                return (
                  <button
                    key={cell.id}
                    onClick={() => handleCellClick(r, c)}
                    disabled={myPlayer?.isDead}
                    className={`relative rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer group active:scale-90 ${
                      isSelected
                        ? 'ring-3 ring-amber-300 scale-108 z-20 shadow-[0_0_18px_rgba(251,191,36,0.9)]'
                        : 'hover:scale-104'
                    }`}
                    style={{
                      aspectRatio: '1/1',
                    }}
                  >
                    {/* 3D Sphere Candy Body */}
                    <div
                      className={`w-full h-full rounded-xl sm:rounded-2xl bg-gradient-to-tr ${candyMeta.color} relative overflow-hidden shadow-md flex items-center justify-center border ${candyMeta.border} ${
                        cell.hasItem ? 'animate-pulse ring-2 ring-amber-300/80 shadow-[0_0_12px_rgba(251,191,36,0.7)]' : ''
                      }`}
                    >
                      {/* 3D Specular Spherical Light Reflection */}
                      <div className="absolute top-1 left-1 w-2.5 sm:w-3.5 h-1.5 sm:h-2 rounded-full bg-white/60 blur-[0.5px] pointer-events-none transform -rotate-25" />

                      {/* Mystery Item Glow Shimmer (Secret inside, user only sees glowing mystery sparkle) */}
                      {cell.hasItem && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-white text-xs sm:text-sm drop-shadow-md animate-spin font-black select-none opacity-80">
                            ✨
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Combat Action Log Marquee */}
        <div className="w-full max-w-md mt-1.5 px-3 py-1 rounded-xl bg-black/30 border border-white/5 text-[10px] text-zinc-400 truncate text-center font-mono">
          {gameState.recentLogs[0]?.text || '⚔️ แข่งขันกันทำลายลูกอมเพื่อลดเลือดคู่ต่อสู้!'}
        </div>
      </div>

      {/* BOTTOM INVENTORY DOCK: Items (Heal, Shield, Fire, Hammer) */}
      <div className="p-2 sm:p-3 border-t dark:border-white/10 border-black/10 shrink-0 bg-black/40 backdrop-blur-md z-20">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {/* 1. Heal Potion */}
          <button
            onClick={() => handleTriggerItem('heal')}
            disabled={inventory.heal <= 0 || myPlayer?.isDead}
            className={`flex-1 py-1.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer relative ${
              inventory.heal > 0
                ? 'bg-emerald-500/20 border-emerald-400/50 hover:bg-emerald-500/30 text-emerald-300'
                : 'opacity-40 border-white/5 text-zinc-500'
            }`}
          >
            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[9px] font-black">
              {inventory.heal}
            </span>
            <span className="text-sm">💚</span>
            <span className="text-[9px] font-bold leading-tight">ยาเพิ่มเลือด (+30)</span>
          </button>

          {/* 2. Shield */}
          <button
            onClick={() => handleTriggerItem('shield')}
            disabled={inventory.shield <= 0 || myPlayer?.isDead}
            className={`flex-1 py-1.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer relative ${
              inventory.shield > 0
                ? 'bg-cyan-500/20 border-cyan-400/50 hover:bg-cyan-500/30 text-cyan-300'
                : 'opacity-40 border-white/5 text-zinc-500'
            }`}
          >
            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-cyan-400 text-black text-[9px] font-black">
              {inventory.shield}
            </span>
            <span className="text-sm">🛡️</span>
            <span className="text-[9px] font-bold leading-tight">เกราะป้องกัน</span>
          </button>

          {/* 3. Firestorm */}
          <button
            onClick={() => handleTriggerItem('fire')}
            disabled={inventory.fire <= 0 || myPlayer?.isDead}
            className={`flex-1 py-1.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer relative ${
              inventory.fire > 0
                ? 'bg-orange-500/20 border-orange-400/50 hover:bg-orange-500/30 text-orange-300'
                : 'opacity-40 border-white/5 text-zinc-500'
            }`}
          >
            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[9px] font-black">
              {inventory.fire}
            </span>
            <span className="text-sm">🔥</span>
            <span className="text-[9px] font-bold leading-tight">คลื่นไฟหมู่ (-20)</span>
          </button>

          {/* 4. Magic Hammer */}
          <button
            onClick={() => handleTriggerItem('hammer')}
            disabled={inventory.hammer <= 0 || myPlayer?.isDead}
            className={`flex-1 py-1.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer relative ${
              activeHammerMode
                ? 'bg-amber-500 text-black font-black ring-2 ring-white scale-105'
                : inventory.hammer > 0
                ? 'bg-amber-500/20 border-amber-400/50 hover:bg-amber-500/30 text-amber-300'
                : 'opacity-40 border-white/5 text-zinc-500'
            }`}
          >
            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[9px] font-black">
              {inventory.hammer}
            </span>
            <span className="text-sm">🔨</span>
            <span className="text-[9px] font-bold leading-tight">ค้อนวิเศษ</span>
          </button>
        </div>
      </div>

      {/* GAME OVER PODIUM OVERLAY */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl p-6 text-center border border-amber-400/40 bg-gradient-to-b from-[#1f1d2b] to-[#12131a] shadow-2xl flex flex-col items-center animate-in zoom-in-95">
            <span className="text-5xl animate-bounce">👑</span>
            <h3 className="text-xl font-black text-amber-400 mt-2">CANDY CHAMPION!</h3>
            <p className="text-xs text-zinc-400 mt-0.5">ผู้รอดชีวิตอันดับ 1 ใน Candy Battle Royale</p>

            {gameState.winner ? (
              <div className="mt-4 flex flex-col items-center">
                <img
                  src={gameState.winner.avatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                  alt={gameState.winner.userName}
                  className="w-20 h-20 rounded-2xl border-4 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)]"
                />
                <p className="font-extrabold text-base mt-2">{gameState.winner.userName}</p>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mt-1">
                  เลือดคงเหลือ {gameState.winner.hp} HP
                </span>
              </div>
            ) : (
              <p className="text-sm font-bold text-zinc-400 mt-4">ไม่มีผู้รอดชีวิตในการต่อสู้นี้!</p>
            )}

            <p className="text-[11px] text-zinc-500 mt-5">
              กำลังรีเซ็ตกลับสู่ล็อบบี้ในอีกสักครู่...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
