import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Bell,
  GitBranch,
  Crosshair,
  Grid,
  Server,
  Cpu,
  BarChart3,
  History,
  SlidersHorizontal,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export type NavView =
  | 'overview'
  | 'incidents'
  | 'alerts'
  | 'attack_chains'
  | 'campaigns'
  | 'mitre'
  | 'assets'
  | 'pipeline'
  | 'benchmarks'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  activeIncidentsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  activeIncidentsCount = 0,
}) => {
  const navItems: Array<{ id: NavView; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: activeIncidentsCount,
    },
    { id: 'alerts', label: 'Alert Telemetry', icon: <Bell className="w-4 h-4" /> },
    { id: 'attack_chains', label: 'Attack Chains', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'campaigns', label: 'Campaigns', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'mitre', label: 'MITRE ATT&CK', icon: <Grid className="w-4 h-4" /> },
    { id: 'assets', label: 'Assets', icon: <Server className="w-4 h-4" /> },
    { id: 'pipeline', label: 'Data Pipeline', icon: <Cpu className="w-4 h-4" /> },
    { id: 'benchmarks', label: 'Benchmarks & MTTT', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Trail', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Policy', icon: <SlidersHorizontal className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-hairline flex flex-col justify-between shrink-0 select-none z-10 font-sans">
      <div>
        {/* Top Logo */}
        <div className="h-16 px-5 flex items-center border-b border-hairline bg-surface">
          <BrandLogo size="md" />
        </div>

        {/* Section Heading */}
        <div className="px-5 pt-5 pb-2 text-[11px] font-mono uppercase tracking-wider text-text-muted">
          Operational Views
        </div>

        {/* Navigation items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-colors font-medium text-left ${
                  isActive
                    ? 'bg-oat text-ink font-semibold border border-hairline'
                    : 'text-ink-soft hover:text-ink hover:bg-oat/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-clay-deep' : 'text-text-muted'}>
                    {item.icon}
                  </span>
                  <span className="font-sans">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-clay text-ink font-bold border-[#c26547]'
                        : 'bg-oat text-ink border-hairline'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-hairline text-[11px] font-mono text-text-muted bg-canvas/60">
        <div className="flex items-center justify-between text-text-muted mb-1.5">
          <span>PIPELINE ENGINE</span>
          <span className="text-ink font-medium">SPARK + KAFKA</span>
        </div>
        <div className="flex items-center justify-between text-text-muted">
          <span>THREATLENS</span>
          <span>v2.4.0-PROD</span>
        </div>
      </div>
    </aside>
  );
};
