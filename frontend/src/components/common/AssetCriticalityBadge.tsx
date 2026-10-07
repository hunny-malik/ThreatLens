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
    CRITICAL: 'bg-clay-deep text-surface border-clay-deep',
    HIGH: 'bg-clay text-ink border-[#c46849]',
    MEDIUM: 'bg-oat text-ink border-hairline',
    LOW: 'bg-surface text-text-muted border-hairline',
  };

  const currentStyle = styles[crit] || styles.MEDIUM;

  return (
    <div className="inline-flex items-center gap-2 font-mono text-[11px]">
      <span className={`px-2 py-0.5 rounded-full border uppercase font-medium ${currentStyle}`}>
        {crit}
      </span>
      {!compact && assetType && (
        <span className="text-text-muted text-xs truncate font-sans">{assetType}</span>
      )}
    </div>
  );
};
