import React from 'react';

interface RiskScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = false,
}) => {
  const normalized = Math.min(100, Math.max(0, score));

  // Determine color category
  let colorClass = 'text-blue-400 bg-blue-950/40 border-blue-800/80';
  let barColor = 'bg-blue-500';
  if (normalized >= 85) {
    colorClass = 'text-red-400 bg-red-950/40 border-red-800/80';
    barColor = 'bg-red-500';
  } else if (normalized >= 70) {
    colorClass = 'text-orange-400 bg-orange-950/40 border-orange-800/80';
    barColor = 'bg-orange-500';
  } else if (normalized >= 50) {
    colorClass = 'text-amber-400 bg-amber-950/40 border-amber-800/80';
    barColor = 'bg-amber-500';
  }

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`font-mono font-semibold px-1.5 py-0.5 rounded border text-xs ${colorClass}`}
        >
          {score.toFixed(1)}
        </span>
        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${barColor}`} style={{ width: `${normalized}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`font-mono font-bold px-2.5 py-1 rounded border text-sm flex items-center justify-center shrink-0 ${colorClass}`}
      >
        {score.toFixed(1)}
      </div>
      <div className="flex flex-col gap-1 w-24">
        {showLabel && (
          <span className="text-[10px] uppercase font-mono text-slate-400 leading-none">
            Risk Score
          </span>
        )}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${barColor}`} style={{ width: `${normalized}%` }} />
        </div>
      </div>
    </div>
  );
};
