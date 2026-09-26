import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface ProgressBarProps {
  percent: number; // 0 - 100
  title: string;
  stepDescription?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  title,
  stepDescription,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-2.5 backdrop-blur-md">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          <span className="font-semibold text-white font-['Prompt']">{title}</span>
        </div>
        <span className="font-mono font-bold text-emerald-400 text-xs tabular-nums">
          {Math.round(percent)}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-sm"
          style={{ width: `${Math.max(4, Math.min(100, percent))}%` }}
        />
      </div>

      {stepDescription && (
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">{stepDescription}</span>
          <span className="text-[10px] text-emerald-400/90 shrink-0 font-mono">
            5-Step Pipeline
          </span>
        </div>
      )}
    </div>
  );
};
