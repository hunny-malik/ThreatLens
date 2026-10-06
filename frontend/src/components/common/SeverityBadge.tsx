import React from 'react';
import { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const sev = (severity || 'LOW').toUpperCase();
  
  const styles: Record<string, string> = {
    CRITICAL: 'bg-red-950/60 text-red-400 border-red-800/80',
    HIGH: 'bg-orange-950/60 text-orange-400 border-orange-800/80',
    MEDIUM: 'bg-amber-950/60 text-amber-400 border-amber-800/80',
    LOW: 'bg-blue-950/60 text-blue-400 border-blue-800/80',
  };

  const currentStyle = styles[sev] || styles.LOW;
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded border tracking-wider uppercase ${padding} ${currentStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 bg-current opacity-80" />
      {sev}
    </span>
  );
};
