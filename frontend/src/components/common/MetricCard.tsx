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
  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        highlight
          ? 'bg-oat/50 border-hairline shadow-xs'
          : 'bg-surface border-hairline shadow-xs hover:border-ink/20'
      }`}
    >
      <div className="flex items-center justify-between text-text-muted mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
          {title}
        </span>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-sans font-bold text-ink tracking-tight">
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-text-muted font-serif italic">{subValue}</span>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-hairline flex items-center justify-between text-xs">
          <span
            className={`font-mono text-[11px] font-medium ${
              trendDirection === 'down'
                ? 'text-clay-deep'
                : trendDirection === 'up'
                ? 'text-ink font-semibold'
                : 'text-text-muted'
            }`}
          >
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};
