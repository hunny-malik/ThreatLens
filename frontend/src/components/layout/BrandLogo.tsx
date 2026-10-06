import React from 'react';

interface BrandLogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ collapsed = false, size = 'md' }) => {
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 32 : 24;

  return (
    <div className="flex items-center gap-2.5 tracking-tight select-none">
      {/* Original geometric ThreatLens aperture/correlation symbol */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-cyan-500"
        >
          {/* Outer faceted geometric lens */}
          <polygon
            points="14,2 24,7.5 24,20.5 14,26 4,20.5 4,7.5"
            stroke="#38BDF8"
            strokeWidth="1.75"
            strokeLinejoin="round"
            className="opacity-90"
          />
          {/* Central correlated focal crosshair */}
          <circle cx="14" cy="14" r="3.5" fill="#38BDF8" className="opacity-90" />
          <line x1="14" y1="5.5" x2="14" y2="8.5" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="14" y1="19.5" x2="14" y2="22.5" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="6" y1="14" x2="9" y2="14" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="19" y1="14" x2="22" y2="14" stroke="#38BDF8" strokeWidth="1.5" />
          {/* Subtle correlation vectors */}
          <circle cx="9" cy="9" r="1.2" fill="#F43F5E" />
          <circle cx="19" cy="9" r="1.2" fill="#F59E0B" />
          <circle cx="14" cy="21" r="1.2" fill="#10B981" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-semibold text-slate-100 tracking-wider text-base">
              THREAT<span className="text-cyan-400 font-bold">LENS</span>
            </span>
            <span className="text-[10px] font-mono uppercase bg-slate-800 text-cyan-400 px-1 py-0.5 rounded border border-slate-700">
              MSSP
            </span>
          </div>
          <span className="text-[10px] text-slate-400 tracking-wider font-mono uppercase mt-0.5">
            Alert Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
