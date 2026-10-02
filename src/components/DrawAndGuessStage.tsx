import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Paintbrush,
  Eraser,
  Trash2,
  Send,
  Timer,
  Trophy,
  Crown,
  Sparkles,
  HelpCircle,
  XCircle,
  CheckCircle2,
  Users,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  DrawAndGuessGameState,
  DrawStroke,
  UserProfile,
  UserRole,
} from '../types/index';

interface DrawAndGuessStageProps {
  gameState: DrawAndGuessGameState;
  currentUser: UserProfile;
  myRole: UserRole;
  onSendStroke: (stroke: DrawStroke) => void;
  onClearCanvas: () => void;
  onSelectWord: (word: string, category: string) => void;
  onGuess: (guess: string) => void;
  onStopGame: () => void;
}

const COLOR_PALETTE = [
  '#000000', // Black
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#78350f', // Brown
  '#ffffff', // White (can also act as eraser color)
];

const BRUSH_SIZES = [
  { label: 'เล็ก', size: 3 },
  { label: 'กลาง', size: 7 },
  { label: 'ใหญ่', size: 14 },
  { label: 'หนาพิเศษ', size: 24 },
];

// Fixed coordinate resolution for normalized drawing
const VIRTUAL_WIDTH = 800;
const VIRTUAL_HEIGHT = 500;

export const DrawAndGuessStage: React.FC<DrawAndGuessStageProps> = ({
  gameState,
  currentUser,
  myRole,
  onSendStroke,
  onClearCanvas,
  onSelectWord,
  onGuess,
  onStopGame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(7);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [guessInput, setGuessInput] = useState<string>('');

  const isDrawer = currentUser.id === gameState.currentDrawerId;
  const isOwnerOrAdmin = myRole === 'owner' || myRole === 'admin' || Boolean((currentUser as any).isSuperAdmin);
  const myPlayerScore = gameState.scores.find((s) => s.userId === currentUser.id);
  const hasGuessed = myPlayerScore?.hasGuessed || false;

  // Trigger celebration confetti on game over
  useEffect(() => {
    if (gameState.phase === 'game_over') {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  }, [gameState.phase]);

  // Redraw or handle canvas clear when phase changes or word selected
  useEffect(() => {
    if (gameState.phase === 'selecting_word') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        }
      }
    }
  }, [gameState.phase]);

  // Method to draw stroke on canvas locally
  const drawStrokeOnCanvas = useCallback((stroke: DrawStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.size;
    ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;

    ctx.beginPath();
    ctx.moveTo(stroke.prevX, stroke.prevY);
    ctx.lineTo(stroke.x, stroke.y);
    ctx.stroke();
    ctx.restore();
  }, []);

  // Expose clear function for incoming websocket clear event
  useEffect(() => {
    const handleClearEvent = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        }
      }
    };

    window.addEventListener('watchparty:game_clear_canvas', handleClearEvent);
    return () => {
      window.removeEventListener('watchparty:game_clear_canvas', handleClearEvent);
    };
  }, []);

  // Listen to remote stroke events dispatched on window
  useEffect(() => {
    const handleStrokeEvent = (e: any) => {
      if (e.detail) {
        drawStrokeOnCanvas(e.detail);
      }
    };

    window.addEventListener('watchparty:game_stroke', handleStrokeEvent);
    return () => {
      window.removeEventListener('watchparty:game_stroke', handleStrokeEvent);
    };
  }, [drawStrokeOnCanvas]);

  // Coordinate conversion: from screen event client coordinates to virtual 800x500 coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = VIRTUAL_WIDTH / rect.width;
    const scaleY = VIRTUAL_HEIGHT / rect.height;

    const x = Math.max(0, Math.min(VIRTUAL_WIDTH, (clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(VIRTUAL_HEIGHT, (clientY - rect.top) * scaleY));

    return { x, y };
  };

  // Drawing event handlers (only active for the drawer during 'drawing' phase)
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || gameState.phase !== 'drawing') return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    setIsDrawing(true);
    setLastPoint(coords);

    // Draw a single dot
    const stroke: DrawStroke = {
      prevX: coords.x,
      prevY: coords.y,
      x: coords.x + 0.1,
      y: coords.y + 0.1,
      color: selectedColor,
      size: brushSize,
      isEraser,
    };
    drawStrokeOnCanvas(stroke);
    onSendStroke(stroke);
  };

  const handleMoveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer || gameState.phase !== 'drawing' || !lastPoint) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const stroke: DrawStroke = {
      prevX: lastPoint.x,
      prevY: lastPoint.y,
      x: coords.x,
      y: coords.y,
      color: selectedColor,
      size: brushSize,
      isEraser,
    };

    drawStrokeOnCanvas(stroke);
    onSendStroke(stroke);
    setLastPoint(coords);
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const handleClear = () => {
    if (!isDrawer || gameState.phase !== 'drawing') return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      }
    }
    onClearCanvas();
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || isDrawer || hasGuessed) return;
    onGuess(guessInput.trim());
    setGuessInput('');
  };

  // Color selection
  const handleColorPick = (color: string) => {
    setSelectedColor(color);
    setIsEraser(false);
  };

  const handleToggleEraser = () => {
    setIsEraser((prev) => !prev);
  };

  // Calculate timer color & percentage
  const maxPhaseTime = gameState.phase === 'selecting_word' ? 15 : gameState.phase === 'drawing' ? 70 : 10;
  const timePercent = Math.max(0, Math.min(100, (gameState.timeLeft / maxPhaseTime) * 100));
  const timerBadgeColor =
    gameState.timeLeft <= 10
      ? 'bg-rose-500 text-white animate-pulse'
      : gameState.timeLeft <= 25
      ? 'bg-amber-500 text-white'
      : 'bg-emerald-500 text-white';

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e24] text-white rounded-xl overflow-hidden border border-zinc-700/80 shadow-2xl relative select-none">
      {/* 1. Header Control Bar */}
      <div className="bg-zinc-900/95 backdrop-blur-xs border-b border-zinc-800 px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 bg-zinc-800/90 text-amber-400 font-bold px-2.5 py-1 rounded-lg text-xs sm:text-sm border border-zinc-700/60 shadow-xs shrink-0">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>รอบ {gameState.round}/{gameState.maxRounds}</span>
          </div>

          {/* Drawer / Guesser Status Badge */}
          <div className="truncate text-xs sm:text-sm font-medium">
            {isDrawer ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Paintbrush className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">ตาคุณวาดรูป!</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span className="truncate">
                  คนวาด: <strong className="text-white font-semibold">{gameState.currentDrawerName}</strong>
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Word Clue Banner in Middle */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700/50">
          {isDrawer ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400">คำของคุณ:</span>
              <span className="text-emerald-400 font-bold text-sm tracking-wide">
                {gameState.currentWord || 'กำลังเลือก...'}
              </span>
              <span className="text-[11px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800/50">
                หมวด{gameState.wordCategory}
              </span>
            </div>
          ) : hasGuessed ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ทายถูกแล้ว! คำตอบคือ &ldquo;{gameState.currentWord}&rdquo;</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400">คำใบ้:</span>
              <span className="font-mono text-base font-bold tracking-widest text-amber-300">
                {gameState.wordHint || '...'}
              </span>
              {gameState.wordCategory && (
                <span className="text-[11px] bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
                  หมวด{gameState.wordCategory} ({gameState.wordLength} ตัวอักษร)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Controls: Timer & Stop button */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-1 font-bold text-xs sm:text-sm px-2.5 py-1 rounded-lg transition-colors shadow-xs ${timerBadgeColor}`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>{gameState.timeLeft}s</span>
          </div>

          {isOwnerOrAdmin && (
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการยุติเกมวาดรูปสำหรับทุกคนใช่หรือไม่?')) {
                  onStopGame();
                }
              }}
              className="flex items-center gap-1 text-[11px] sm:text-xs text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 px-2 py-1 rounded-lg transition-colors"
              title="ยุติเกม (เฉพาะโฮสต์/แอดมิน)"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ยุติเกม</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Word Clue Strip (Visible on mobile/tablet) */}
      <div className="md:hidden bg-zinc-900/90 border-b border-zinc-800/80 px-3 py-1 flex items-center justify-between text-xs z-10">
        {isDrawer ? (
          <div className="flex items-center gap-1.5 w-full justify-between">
            <span className="text-zinc-400">คำที่คุณต้องวาด:</span>
            <span className="text-emerald-400 font-bold text-sm tracking-wide">
              {gameState.currentWord || 'กำลังเลือก...'}
            </span>
            <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800/50">
              หมวด{gameState.wordCategory}
            </span>
          </div>
        ) : hasGuessed ? (
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold w-full justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>คุณทายถูกแล้ว! คำตอบคือ &ldquo;{gameState.currentWord}&rdquo;</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full justify-between">
            <span className="text-zinc-400">คำใบ้:</span>
            <span className="font-mono text-sm font-bold tracking-widest text-amber-300">
              {gameState.wordHint || '...'}
            </span>
            {gameState.wordCategory && (
              <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded-full border border-zinc-700">
                หมวด{gameState.wordCategory} ({gameState.wordLength} ตัว)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar under header */}
      <div className="w-full h-1 bg-zinc-800 shrink-0">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            gameState.timeLeft <= 10
              ? 'bg-rose-500'
              : gameState.timeLeft <= 25
              ? 'bg-amber-400'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${timePercent}%` }}
        />
      </div>

      {/* 2. Main Stage Body: Canvas Area + Live Leaderboard */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative bg-zinc-950">
        {/* Canvas Stage Box */}
        <div className="flex-1 min-h-0 relative flex items-center justify-center p-1 sm:p-2 overflow-hidden bg-zinc-950">
          <div className="relative w-full h-full max-w-[800px] max-h-[500px] aspect-[16/10] bg-white rounded-lg shadow-inner overflow-hidden border border-zinc-800 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={VIRTUAL_WIDTH}
              height={VIRTUAL_HEIGHT}
              onMouseDown={handleStartDraw}
              onMouseMove={handleMoveDraw}
              onMouseUp={handleEndDraw}
              onMouseLeave={handleEndDraw}
              onTouchStart={handleStartDraw}
              onTouchMove={handleMoveDraw}
              onTouchEnd={handleEndDraw}
              className={`w-full h-full block bg-white touch-none ${
                isDrawer && gameState.phase === 'drawing'
                  ? 'cursor-crosshair'
                  : 'cursor-default pointer-events-none'
              }`}
              style={{ touchAction: 'none' }}
            />

            {/* OVERLAY 1: Drawer Selecting Word Modal */}
            {gameState.phase === 'selecting_word' && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
                {isDrawer ? (
                  <div className="max-w-md w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl text-white">
                    <div className="flex items-center justify-center gap-2 text-amber-400 font-bold mb-1">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span className="text-base sm:text-lg">เลือกคำศัพท์ที่คุณต้องการวาด</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-4">
                      คลิกเลือก 1 คำ (ระบบจะสุ่มให้อัตโนมัติหากไม่เลือกใน {gameState.timeLeft} วินาที)
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                      {gameState.wordChoices?.map((item) => (
                        <button
                          key={item.word}
                          onClick={() => onSelectWord(item.word, item.category)}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800 hover:bg-emerald-600/20 border border-zinc-700 hover:border-emerald-500 hover:scale-105 active:scale-95 transition-all text-center group cursor-pointer shadow-md"
                        >
                          <span className="text-base font-bold text-white group-hover:text-emerald-300">
                            {item.word}
                          </span>
                          <span className="text-[11px] text-zinc-400 group-hover:text-emerald-200 mt-1">
                            หมวด{item.category}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.2 rounded-full mt-1.5 font-medium ${
                              item.difficulty === 'easy'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : item.difficulty === 'medium'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {item.difficulty === 'easy' ? 'ง่าย' : item.difficulty === 'medium' ? 'ปานกลาง' : 'ท้าทาย'}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                      <Timer className="w-3.5 h-3.5" />
                      <span>เหลือเวลาเลือกอีก {gameState.timeLeft} วินาที</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-2xl p-6 text-center max-w-sm shadow-2xl">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 animate-bounce">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">
                      กำลังรอให้ {gameState.currentDrawerName} เลือกคำ...
                    </h3>
                    <p className="text-xs text-zinc-400">
                      เตรียมตัวพิมพ์ทายคำตอบให้ไวที่สุด! (เหลือเวลา {gameState.timeLeft}s)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* OVERLAY 2: Round End Word Reveal */}
            {gameState.phase === 'round_end' && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
                <div className="bg-zinc-900/95 border border-zinc-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-white">
                  <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    หมดเวลาในรอบนี้!
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
                    คำตอบคือ &ldquo;<span className="text-emerald-400">{gameState.currentWord}</span>&rdquo;
                  </h3>
                  <p className="text-xs text-zinc-400 mb-4">
                    หมวด{gameState.wordCategory}
                  </p>

                  <div className="text-xs text-zinc-400 flex items-center justify-center gap-1.5 bg-zinc-800/80 py-2 rounded-xl border border-zinc-700">
                    <Timer className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>กำลังเริ่มเทิร์นถัดไปใน {gameState.timeLeft} วินาที...</span>
                  </div>
                </div>
              </div>
            )}

            {/* OVERLAY 3: Game Over Podium Celebration */}
            {gameState.phase === 'game_over' && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
                <div className="bg-zinc-900/95 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.2)] text-white">
                  <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Crown className="w-7 h-7 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-black text-amber-400 mb-1">
                    จบเกมการแข่งขัน!
                  </h2>
                  <p className="text-xs text-zinc-400 mb-4">
                    ขอแสดงความยินดีกับผู้เล่นทุกคนที่ร่วมสนุกในปาร์ตี้
                  </p>

                  {/* Winner Spotlight */}
                  {gameState.winner && (
                    <div className="bg-gradient-to-r from-amber-950/60 via-zinc-800 to-amber-950/60 border border-amber-500/40 rounded-xl p-3.5 mb-4 flex items-center justify-between shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={gameState.winner.avatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                            alt={gameState.winner.userName}
                            className="w-11 h-11 rounded-full border-2 border-amber-400 object-cover bg-zinc-800"
                          />
                          <Crown className="w-4 h-4 text-amber-400 absolute -top-1.5 -right-1" />
                        </div>
                        <div className="text-left">
                          <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                            อันดับ 1 (แชมเปียน)
                          </div>
                          <div className="font-bold text-white text-base truncate max-w-[150px]">
                            {gameState.winner.userName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-amber-300">
                          {gameState.winner.score}
                        </div>
                        <div className="text-[10px] text-zinc-400">คะแนน</div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-zinc-400">
                    กำลังปิดโหมดเกมและกลับสู่เพลงใน {gameState.timeLeft} วินาที...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Scoreboard Sidebar (Desktop: right side, Mobile/Tablet: compact bottom bar) */}
        <div className="w-full lg:w-64 bg-zinc-900 border-t lg:border-t-0 lg:border-l border-zinc-800 p-2.5 sm:p-3 flex flex-col shrink-0">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-xs text-zinc-400 font-semibold">
            <span className="flex items-center gap-1.5 text-zinc-200">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>กระดานคะแนน</span>
            </span>
            <span>{gameState.scores.length} ผู้เล่น</span>
          </div>

          {/* Scores list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-36 sm:max-h-44 lg:max-h-none pr-1">
            {[...gameState.scores]
              .sort((a, b) => b.score - a.score)
              .map((player, index) => {
                const isCurrentDrawer = player.userId === gameState.currentDrawerId;
                const hasPlayerGuessed = player.hasGuessed;

                return (
                  <div
                    key={player.userId}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
                      player.userId === currentUser.id
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 text-center font-bold text-[11px] text-zinc-400">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </span>
                      <img
                        src={player.avatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                        alt={player.userName}
                        className="w-6 h-6 rounded-full border border-zinc-600 object-cover bg-zinc-700 shrink-0"
                      />
                      <span className="truncate max-w-[90px] font-medium">
                        {player.userName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCurrentDrawer ? (
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 font-medium">
                          <Paintbrush className="w-2.5 h-2.5" />
                          <span>วาด</span>
                        </span>
                      ) : hasPlayerGuessed ? (
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 font-medium">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          <span>ถูก</span>
                        </span>
                      ) : null}

                      <span className="font-bold text-amber-400 min-w-8 text-right">
                        {player.score}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Quick Guess Input Box for non-drawers */}
          {!isDrawer && gameState.phase === 'drawing' && (
            <form onSubmit={handleGuessSubmit} className="mt-2.5 pt-2 border-t border-zinc-800 shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder={hasGuessed ? 'คุณทายถูกต้องแล้ว 🎉' : 'พิมพ์คำตอบที่นี่...'}
                  disabled={hasGuessed}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!guessInput.trim() || hasGuessed}
                  className="absolute right-1 text-zinc-400 hover:text-amber-400 disabled:opacity-30 p-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 3. Drawing Toolbar (Only visible to the Drawer during 'drawing' phase) */}
      {isDrawer && gameState.phase === 'drawing' && (
        <div className="bg-zinc-900 border-t border-zinc-800 p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 z-10">
          {/* Colors */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5">
            {COLOR_PALETTE.map((color) => {
              const isSelected = selectedColor === color && !isEraser;
              return (
                <button
                  key={color}
                  onClick={() => handleColorPick(color)}
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-transform border ${
                    isSelected
                      ? 'scale-125 border-white ring-2 ring-amber-400 shadow-md'
                      : 'border-zinc-600 hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              );
            })}
          </div>

          {/* Brush Sizes & Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Brush Size Selector */}
            <div className="flex items-center bg-zinc-800 rounded-xl p-0.5 border border-zinc-700">
              {BRUSH_SIZES.map((item) => (
                <button
                  key={item.size}
                  onClick={() => setBrushSize(item.size)}
                  className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                    brushSize === item.size && !isEraser
                      ? 'bg-amber-500 text-black font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Eraser */}
            <button
              onClick={handleToggleEraser}
              className={`p-1.5 sm:p-2 rounded-xl border text-xs flex items-center gap-1 transition-colors ${
                isEraser
                  ? 'bg-amber-500 text-black font-bold border-amber-400'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
              }`}
              title="ยางลบ"
            >
              <Eraser className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">ยางลบ</span>
            </button>

            {/* Clear Canvas */}
            <button
              onClick={handleClear}
              className="p-1.5 sm:p-2 rounded-xl border border-rose-800/60 bg-rose-950/60 text-rose-300 hover:bg-rose-900 hover:text-white text-xs flex items-center gap-1 transition-colors"
              title="ล้างกระดาน"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">ล้าง</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
