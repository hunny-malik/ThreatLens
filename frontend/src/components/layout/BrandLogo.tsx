import React from 'react';

interface BrandLogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'inverse';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  collapsed = false,
  size = 'md',
  theme = 'light',
}) => {
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 32 : 24;
  const isInverse = theme === 'inverse';

  return (
    <div className="flex items-center gap-2.5 tracking-tight select-none font-sans">
      {/* Precision geometric aperture symbol */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer faceted geometric lens */}
          <polygon
            points="14,2 24,7.5 24,20.5 14,26 4,20.5 4,7.5"
            stroke={isInverse ? "#FAF9F5" : "#141413"}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          {/* Central focal aperture with signature Clay mark */}
          <circle cx="14" cy="14" r="3.5" fill="#D97757" />
          <line x1="14" y1="5.5" x2="14" y2="8.5" stroke={isInverse ? "#FAF9F5" : "#141413"} strokeWidth="1.5" />
          <line x1="14" y1="19.5" x2="14" y2="22.5" stroke={isInverse ? "#FAF9F5" : "#141413"} strokeWidth="1.5" />
          <line x1="6" y1="14" x2="9" y2="14" stroke={isInverse ? "#FAF9F5" : "#141413"} strokeWidth="1.5" />
          <line x1="19" y1="14" x2="22" y2="14" stroke={isInverse ? "#FAF9F5" : "#141413"} strokeWidth="1.5" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-sans font-semibold tracking-tight text-base ${
                isInverse ? 'text-surface' : 'text-ink'
              }`}
            >
              THREAT<span className="text-clay font-bold">LENS</span>
            </span>
            <span
              className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                isInverse
                  ? 'bg-neutral-800 text-cloud border-neutral-700'
                  : 'bg-oat text-ink border-hairline'
              }`}
            >
              MSSP
            </span>
          </div>
          <span
            className={`text-[10px] tracking-wider font-mono uppercase mt-0.5 ${
              isInverse ? 'text-cloud' : 'text-text-muted'
            }`}
          >
            Alert Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
