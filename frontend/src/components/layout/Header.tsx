import React, { useState } from 'react';
import { Search, Activity, Play, ChevronDown, CheckCircle2, Database, Shield } from 'lucide-react';
import { api } from '../../services/api';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenDatasets: () => void;
  currentRole: string;
  onRoleChange: (role: string) => void;
  isStreaming?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
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
    <header className="h-16 border-b border-hairline bg-canvas/95 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-20 font-sans">
      {/* Left: Global Search Input trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onOpenSearch}
          className="flex items-center justify-between w-full max-w-md px-3.5 py-2 bg-surface border border-hairline hover:border-ink/40 text-text-muted hover:text-ink rounded-lg text-xs transition-colors group text-left shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-text-muted group-hover:text-ink transition-colors" />
            <span className="font-sans">Search incidents, entities, IP, hash, technique...</span>
          </div>
          <kbd className="hidden sm:inline-block font-mono text-[10px] bg-oat text-ink px-1.5 py-0.5 rounded border border-hairline">
            ⌘K
          </kbd>
        </button>

        {/* Enclave / Env Indicator */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-text-muted bg-surface px-2.5 py-1.5 rounded-lg border border-hairline">
          <span className="w-2 h-2 rounded-full bg-clay" />
          <span className="text-ink font-semibold uppercase tracking-wider">SOC ENCLAVE</span>
          <span className="text-text-muted">US-EAST</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Datasets & Ingestion Hub Button (The Signature Clay Action) */}
        <button
          onClick={onOpenDatasets}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-clay hover:bg-[#cf6f4f] text-ink font-sans text-xs font-semibold transition-all shadow-xs"
          title="Manage, Ingest & Correlate Datasets (3,000 to 100,000+ Logs)"
        >
          <Database className="w-3.5 h-3.5 fill-ink" />
          <span>Dataset Hub &amp; Ingest</span>
        </button>

        {/* Pipeline Stream Status */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-text-muted bg-surface px-3 py-1.5 rounded-lg border border-hairline">
          <Activity className="w-3.5 h-3.5 text-clay" />
          <span className="font-medium text-ink">STREAM ONLINE</span>
        </div>

        {/* Analyst Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 bg-surface hover:bg-oat border border-hairline px-3 py-1.5 rounded-lg text-xs text-ink transition-colors shadow-xs"
          >
            <div className="w-5 h-5 rounded-md bg-oat border border-hairline flex items-center justify-center text-ink font-mono text-[10px] font-bold">
              JM
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs font-medium text-ink">J. Mercer</span>
              <span className="text-[10px] font-mono text-text-muted">{currentRole}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted ml-0.5" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-surface border border-hairline rounded-xl shadow-lg py-1.5 z-50">
              <div className="px-3.5 py-1 text-[10px] font-mono uppercase text-text-muted border-b border-hairline">
                Operational Authority
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => handleSelectRole(r)}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-oat transition-colors ${
                    currentRole === r ? 'text-clay-deep font-semibold bg-oat/60' : 'text-ink'
                  }`}
                >
                  <span className="font-sans">{r}</span>
                  {currentRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-clay-deep" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
