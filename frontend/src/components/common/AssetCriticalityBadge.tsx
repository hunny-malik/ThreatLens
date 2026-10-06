import React from 'react';
import { AssetCriticality, AssetType } from '../../types';

interface AssetCriticalityBadgeProps {
  criticality: AssetCriticality | string;
  assetType?: AssetType | string;
  compact?: boolean;
}

export const AssetCriticalityBadge: React.FC<AssetCriticalityBadgeProps> = ({
  criticality,
  assetType,
  compact = false,
}) => {
  const crit = (criticality || 'MEDIUM').toUpperCase();

  const styles: Record<string, string> = {
    CRITICAL: 'bg-rose-950/40 text-rose-300 border-rose-800/60',
    HIGH: 'bg-amber-950/40 text-amber-300 border-amber-800/60',
    MEDIUM: 'bg-slate-800/80 text-slate-300 border-slate-700',
    LOW: 'bg-slate-900 text-slate-400 border-slate-800',
  };

  const currentStyle = styles[crit] || styles.MEDIUM;

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
      <span className={`px-1.5 py-0.5 rounded border uppercase font-medium ${currentStyle}`}>
        {crit}
      </span>
      {!compact && assetType && (
        <span className="text-slate-400 text-xs truncate font-sans">{assetType}</span>
      )}
    </div>
  );
};
