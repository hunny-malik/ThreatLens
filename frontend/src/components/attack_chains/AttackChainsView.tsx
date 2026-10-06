import React, { useState } from 'react';
import { GitBranch, ShieldAlert, ArrowRight, Server, Activity, ChevronRight } from 'lucide-react';
import { Incident } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { RiskScoreGauge } from '../common/RiskScoreGauge';

interface AttackChainsViewProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
}

export const AttackChainsView: React.FC<AttackChainsViewProps> = ({
  incidents,
  onSelectIncident,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    incidents[0]?.id || ''
  );

  const activeIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
            Attack Chain Reconstruction Engine
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Causal sequence mapping across MITRE ATT&CK kill chain based on evidence-backed telemetry.
        </p>
      </div>

      {/* Incident Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {incidents.map((inc) => (
          <button
            key={inc.id}
            onClick={() => setSelectedIncidentId(inc.id)}
            className={`p-3 rounded border text-left transition-colors flex flex-col justify-between ${
              selectedIncidentId === inc.id
                ? 'bg-slate-800/90 border-cyan-500/80 shadow-md'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-cyan-400">{inc.id}</span>
                <SeverityBadge severity={inc.severity} size="sm" />
              </div>
              <h4 className="text-xs font-medium text-slate-100 truncate">{inc.title}</h4>
              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                Target: {inc.primary_asset}
              </span>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">{inc.attack_chain.length} Kill-Chain Stages</span>
              <RiskScoreGauge score={inc.risk_score} size="sm" />
            </div>
          </button>
        ))}
      </div>

      {/* Active Incident Attack Chain Visualizer */}
      {activeIncident && (
        <div className="soc-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-cyan-400">
                  {activeIncident.id}
                </span>
                <SeverityBadge severity={activeIncident.severity} />
                <span className="text-xs font-mono text-slate-300">
                  {activeIncident.primary_asset} ({activeIncident.primary_asset_criticality})
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-1">
                {activeIncident.title}
              </h3>
            </div>

            <button
              onClick={() => onSelectIncident(activeIncident.id)}
              className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
            >
              <span>Investigate Incident</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Kill-Chain Horizontal Flow */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Sequential Attack Execution Pipeline:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeIncident.attack_chain.map((step, idx) => (
                <div
                  key={step.stage}
                  className="soc-card-elevated p-4 relative flex flex-col justify-between space-y-3 border-slate-700"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {step.timestamp.slice(11, 19)}
                      </span>
                    </div>

                    <h4 className="font-mono text-xs font-bold text-slate-100 uppercase">
                      {step.stage}
                    </h4>
                    <div className="text-[11px] font-mono text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 inline-block">
                      {step.technique_id} &bull; {step.technique_name}
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 font-sans border-t border-slate-800 pt-2 leading-relaxed">
                    {step.evidence}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Source: {step.source}</span>
                    <span className="text-slate-200 font-bold">
                      {Math.round(step.confidence * 100)}% Conf
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
