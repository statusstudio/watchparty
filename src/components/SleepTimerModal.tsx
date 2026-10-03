import React from 'react';
import { X, Moon, Clock, Check, StopCircle, Plus } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  secondsLeft: number | null;
  stopAtEndOfTrack: boolean;
  onSetTimerMinutes: (minutes: number) => void;
  onSetStopAtEnd: (enable: boolean) => void;
  onCancelTimer: () => void;
  onAddMinutes: (minutes: number) => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  secondsLeft,
  stopAtEndOfTrack,
  onSetTimerMinutes,
  onSetStopAtEnd,
  onCancelTimer,
  onAddMinutes,
}) => {
  if (!isOpen) return null;

  const presets = [15, 30, 45, 60, 90];

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimerActive = (secondsLeft !== null && secondsLeft > 0) || stopAtEndOfTrack;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                ตัวตั้งเวลาปิดเพลง (Sleep Timer)
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                หยุดเล่นเพลงอัตโนมัติเมื่อครบเวลา
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Countdown Card */}
        {isTimerActive && (
          <div className="my-4 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 text-center">
            {stopAtEndOfTrack ? (
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> โหมดหยุดเมื่อจบเพลงปัจจุบัน
                </span>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  เพลงจะหยุดทันทีเมื่อคลิปนี้เล่นจบ
                </span>
              </div>
            ) : (
              <div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  เวลาที่เหลือก่อนเพลงจะหยุด
                </span>
                <div className="text-3xl font-black font-mono tracking-wider text-indigo-600 dark:text-indigo-400 my-1 animate-pulse">
                  {secondsLeft ? formatCountdown(secondsLeft) : '00:00'}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button
                    onClick={() => onAddMinutes(15)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3 h-3" /> 15 นาที
                  </button>
                  <button
                    onClick={onCancelTimer}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <StopCircle className="w-3 h-3" /> ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Presets List */}
        <div className="space-y-2 mt-4">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">เลือกเวลา:</span>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((min) => (
              <button
                key={min}
                onClick={() => {
                  onSetTimerMinutes(min);
                  onClose();
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  secondsLeft !== null && Math.ceil(secondsLeft / 60) === min
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:border-indigo-300'
                }`}
              >
                <span>{min} นาที</span>
                <Clock className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}

            <button
              onClick={() => {
                onSetStopAtEnd(true);
                onClose();
              }}
              className={`col-span-2 flex items-center justify-between p-2.5 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                stopAtEndOfTrack
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:border-indigo-300'
              }`}
            >
              <span>เมื่อจบเพลงปัจจุบัน (End of Track)</span>
              {stopAtEndOfTrack ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Moon className="w-4 h-4 opacity-60" />
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        {isTimerActive && (
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              onClick={() => {
                onCancelTimer();
                onClose();
              }}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
            >
              ยกเลิกตัวตั้งเวลา
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
