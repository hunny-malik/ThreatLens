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

  let colorClass = 'text-ink bg-surface border-hairline';
  let barColor = 'bg-text-muted';
  if (normalized >= 85) {
    colorClass = 'text-surface bg-clay-deep border-clay-deep';
    barColor = 'bg-clay-deep';
  } else if (normalized >= 70) {
    colorClass = 'text-ink bg-clay border-[#c26547]';
    barColor = 'bg-clay';
  } else if (normalized >= 50) {
    colorClass = 'text-ink bg-oat border-hairline';
    barColor = 'bg-clay';
  }

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`font-mono font-semibold px-2 py-0.5 rounded-md border text-xs ${colorClass}`}
        >
          {score.toFixed(1)}
        </span>
        <div className="w-12 h-1.5 bg-hairline rounded-full overflow-hidden">
          <div className={`h-full ${barColor}`} style={{ width: `${normalized}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`font-mono font-bold px-2.5 py-1 rounded-lg border text-sm flex items-center justify-center shrink-0 ${colorClass}`}
      >
        {score.toFixed(1)}
      </div>
      <div className="flex flex-col gap-1 w-24">
        {showLabel && (
          <span className="text-[10px] uppercase font-mono text-text-muted leading-none">
            Risk Score
          </span>
        )}
        <div className="w-full h-1.5 bg-hairline rounded-full overflow-hidden">
          <div className={`h-full ${barColor}`} style={{ width: `${normalized}%` }} />
        </div>
      </div>
    </div>
  );
};
