import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  highlight?: boolean;
  alertColor?: 'red' | 'orange' | 'amber' | 'blue' | 'emerald';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  trend,
  trendDirection = 'neutral',
  icon,
  highlight = false,
  alertColor,
}) => {
  const borderHighlight =
    alertColor === 'red'
      ? 'border-red-500/40'
      : alertColor === 'orange'
      ? 'border-orange-500/40'
      : alertColor === 'amber'
      ? 'border-amber-500/40'
      : alertColor === 'emerald'
      ? 'border-emerald-500/40'
      : 'border-slate-800';

  return (
    <div
      className={`soc-card p-4 flex flex-col justify-between transition-colors hover:border-slate-700 ${
        highlight ? 'bg-slate-900/90' : 'bg-slate-900/50'
      } ${borderHighlight}`}
    >
      <div className="flex items-center justify-between text-slate-400 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider font-mono text-slate-400">
          {title}
        </span>
        {icon && <div className="text-slate-400 opacity-80">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-slate-400 font-mono">{subValue}</span>
        )}
      </div>

      {trend && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-xs">
          <span
            className={`font-mono font-medium ${
              trendDirection === 'down'
                ? 'text-emerald-400'
                : trendDirection === 'up'
                ? 'text-cyan-400'
                : 'text-slate-400'
            }`}
          >
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};
