import React, { useState } from 'react';
import { GitBranch, ShieldAlert, ArrowRight, Server, Activity, ChevronRight } from 'lucide-react';
import { Incident } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { RiskScoreGauge } from '../common/RiskScoreGauge';
import { DirectoryFooter } from '../layout/DirectoryFooter';

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
    <div className="bg-canvas min-h-full flex flex-col justify-between">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="pb-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-clay" />
            <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight text-ink">
              Attack Chain Reconstruction Engine
            </h2>
          </div>
          <p className="font-serif text-sm text-text-muted mt-1">
            Causal sequence mapping across MITRE ATT&CK kill chain based on evidence-backed telemetry.
          </p>
        </div>

        {/* Incident Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {incidents.map((inc) => (
            <button
              key={inc.id}
              onClick={() => setSelectedIncidentId(inc.id)}
              className={`p-4 border text-left transition-colors flex flex-col justify-between ${
                selectedIncidentId === inc.id
                  ? 'bg-surface border-ink shadow-sm'
                  : 'bg-surface/60 border-hairline hover:border-ink/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-semibold text-ink bg-oat/40 px-2 py-0.5 border border-hairline">
                    {inc.id}
                  </span>
                  <SeverityBadge severity={inc.severity} size="sm" />
                </div>
                <h4 className="font-display text-sm font-semibold text-ink truncate mt-2">{inc.title}</h4>
                <span className="text-xs text-text-muted font-mono block mt-1">
                  Target: {inc.primary_asset}
                </span>
              </div>

              <div className="mt-4 pt-2.5 border-t border-hairline flex items-center justify-between text-xs font-mono">
                <span className="text-text-muted">{inc.attack_chain.length} Stages</span>
                <RiskScoreGauge score={inc.risk_score} size="sm" />
              </div>
            </button>
          ))}
        </div>

        {/* Active Incident Attack Chain Visualizer */}
        {activeIncident && (
          <div className="editorial-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-4 flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-ink bg-oat/50 px-2 py-0.5 border border-hairline">
                    {activeIncident.id}
                  </span>
                  <SeverityBadge severity={activeIncident.severity} />
                  <span className="text-xs font-mono text-text-muted">
                    {activeIncident.primary_asset} ({activeIncident.primary_asset_criticality})
                  </span>
                </div>
                <h3 className="font-display text-xl md:text-2xl font-medium tracking-tight text-ink mt-2">
                  {activeIncident.title}
                </h3>
              </div>

              <button
                onClick={() => onSelectIncident(activeIncident.id)}
                className="px-4 py-2 bg-clay text-ink hover:bg-clay/90 font-display font-medium text-xs uppercase tracking-wider flex items-center gap-2 border border-clay transition-colors"
              >
                <span>Investigate Incident</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sequential Kill-Chain Pipeline */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-bold block">
                Sequential Attack Execution Pipeline:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeIncident.attack_chain.map((step, idx) => (
                  <div
                    key={step.stage}
                    className="p-5 bg-canvas border border-hairline flex flex-col justify-between space-y-3 hover:border-ink/40 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="w-5 h-5 bg-oat border border-hairline text-ink font-mono text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-mono text-text-muted">
                          {step.timestamp.slice(11, 19)}
                        </span>
                      </div>

                      <h4 className="font-display text-sm font-semibold text-ink">
                        {step.stage}
                      </h4>
                      <div className="text-xs font-mono text-clay-deep bg-manilla/50 px-2 py-0.5 border border-hairline inline-block">
                        {step.technique_id} &bull; {step.technique_name}
                      </div>
                    </div>

                    <div className="font-serif text-xs text-ink/80 border-t border-hairline pt-2.5 leading-relaxed">
                      {step.evidence}
                    </div>

                    <div className="pt-2 border-t border-hairline flex items-center justify-between text-xs font-mono text-text-muted">
                      <span>Source: {step.source}</span>
                      <span className="text-ink font-semibold">
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

      <DirectoryFooter />
    </div>
  );
};
