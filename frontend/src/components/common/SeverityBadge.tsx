import React from 'react';
import { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const sev = (severity || 'LOW').toUpperCase();

  const styles: Record<string, string> = {
    CRITICAL: 'bg-clay-deep text-surface border-clay-deep',
    HIGH: 'bg-clay text-ink border-[#c76b4d]',
    MEDIUM: 'bg-oat text-ink border-hairline',
    LOW: 'bg-surface text-text-muted border-hairline',
    CLEAN: 'bg-sage text-ink border-sage',
  };

  const currentStyle = styles[sev] || styles.LOW;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-full border tracking-wide uppercase ${padding} ${currentStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 bg-current opacity-70" />
      {sev}
    </span>
  );
};
