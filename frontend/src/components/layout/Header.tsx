import React, { useState } from 'react';
import { Search, Activity, ShieldAlert, User, Play, ChevronDown, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSimulation: () => void;
  onOpenDatasets: () => void;
  currentRole: string;
  onRoleChange: (role: string) => void;
  isStreaming?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSimulation,
  onOpenDatasets,
  currentRole,
  onRoleChange,
  isStreaming = false,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles = ['Tier-1 Analyst', 'Senior Analyst', 'SOC Lead / Admin'];

  const handleSelectRole = async (r: string) => {
    onRoleChange(r);
    setRoleDropdownOpen(false);
    try {
      await api.switchRole(r);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-charcoal-900/90 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Global Search Input trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onOpenSearch}
          className="flex items-center justify-between w-full max-w-md px-3 py-1.5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-400 rounded text-xs transition-colors group text-left"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <span>Search Incident, Alert, IP, Domain, Hash, User, Host...</span>
          </div>
          <kbd className="hidden sm:inline-block font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            Ctrl+K
          </kbd>
        </button>

        {/* Enclave / Env Indicator */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-300 font-semibold">MSSP ENCLAVE</span>
          <span className="text-slate-400">US-EAST</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Datasets & Upload Button */}
        <button
          onClick={onOpenDatasets}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono font-medium transition-colors"
          title="Load 6 threat datasets or upload custom telemetry file"
        >
          <span className="text-cyan-400 font-bold">&#9670;</span>
          <span>DATASETS &amp; UPLOAD</span>
        </button>

        {/* Run SOC Simulation Trigger Button */}
        <button
          onClick={onOpenSimulation}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/50 text-xs font-mono font-medium transition-colors"
          title="Run 3,000 alerts simulation pipeline"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>RUN SIMULATION</span>
          <span className="bg-cyan-950 text-cyan-300 text-[10px] px-1 rounded border border-cyan-700/50">
            3,000 ALERTS
          </span>
        </button>

        {/* System Health Status */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400 font-medium">STREAM ONLINE</span>
        </div>

        {/* Analyst Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 px-2.5 py-1.5 rounded text-xs text-slate-300 transition-colors"
          >
            <div className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-mono text-[10px] font-bold">
              42
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-xs font-medium text-slate-200">J. Mercer</span>
              <span className="text-[10px] font-mono text-cyan-400 mt-0.5">{currentRole}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded shadow-xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                Switch Operational Role
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => handleSelectRole(r)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    currentRole === r ? 'text-cyan-400 font-medium bg-slate-800/50' : 'text-slate-300'
                  }`}
                >
                  <span>{r}</span>
                  {currentRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
