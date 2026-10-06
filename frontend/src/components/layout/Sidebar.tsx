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
    <aside className="w-60 bg-charcoal-950 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none z-10">
      <div>
        {/* Top Logo */}
        <div className="h-14 px-4 flex items-center border-b border-slate-800">
          <BrandLogo size="md" />
        </div>

        {/* Section Heading */}
        <div className="px-4 pt-4 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Security Operations
        </div>

        {/* Navigation items */}
        <nav className="px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-colors font-medium ${
                  isActive
                    ? 'bg-slate-800/90 text-cyan-400 border border-slate-700/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                      isActive
                        ? 'bg-red-950/80 text-red-400 border-red-800/80'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
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
      <div className="p-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 bg-slate-900/40">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span>PIPELINE ENGINE</span>
          <span className="text-cyan-400">SPARK + KAFKA</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>THREATLENS</span>
          <span>v2.4.0-PROD</span>
        </div>
      </div>
    </aside>
  );
};
