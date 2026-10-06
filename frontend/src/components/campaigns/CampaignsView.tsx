import React, { useState, useEffect } from 'react';
import { Crosshair, ShieldAlert, Server, Globe, Hash, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { ThreatCampaign } from '../../types';
import { RiskScoreGauge } from '../common/RiskScoreGauge';

interface CampaignsViewProps {
  onSelectIncident: (id: string) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({ onSelectIncident }) => {
  const [campaigns, setCampaigns] = useState<ThreatCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<ThreatCampaign | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const data = await api.getCampaigns();
        setCampaigns(data);
        if (data.length > 0) setSelectedCampaign(data[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Loading campaign intelligence...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-rose-400" />
          <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
            Threat Actor Campaign Intelligence
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Clustering correlated incidents into adversary operations via shared infrastructure, C2, and MITRE TTPs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign List Cards */}
        <div className="space-y-3">
          {campaigns.map((camp) => (
            <button
              key={camp.id}
              onClick={() => setSelectedCampaign(camp)}
              className={`w-full text-left p-4 rounded border transition-colors ${
                selectedCampaign?.id === camp.id
                  ? 'bg-slate-800/90 border-rose-500/80 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-rose-400">{camp.id}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                  {camp.threat_actor_alias}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{camp.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                {camp.description}
              </p>

              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-medium">
                  {camp.incidents_count} Correlated Incidents
                </span>
                <RiskScoreGauge score={camp.risk_score} size="sm" />
              </div>
            </button>
          ))}
        </div>

        {/* Campaign Intelligence Detail Panel */}
        {selectedCampaign && (
          <div className="lg:col-span-2 soc-card p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-rose-400">
                    {selectedCampaign.id}
                  </span>
                  <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    Alias: {selectedCampaign.threat_actor_alias}
                  </span>
                </div>
                <RiskScoreGauge score={selectedCampaign.risk_score} size="md" showLabel={true} />
              </div>
              <h2 className="text-lg font-bold text-slate-100">{selectedCampaign.name}</h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {selectedCampaign.description}
              </p>
            </div>

            {/* Common Threat Indicators (IOCs) */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                Common Campaign Indicators (Infrastructure &amp; Signatures)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Command &amp; Control IPs</span>
                  </div>
                  {selectedCampaign.common_indicators.ips.map((ip) => (
                    <div key={ip} className="text-slate-200">
                      &bull; {ip}
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>Malicious Domains</span>
                  </div>
                  {selectedCampaign.common_indicators.domains.map((d) => (
                    <div key={d} className="text-slate-200">
                      &bull; {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Associated Incidents */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                Correlated Incidents Belonging to this Campaign ({selectedCampaign.incident_ids.length})
              </h4>
              <div className="space-y-2">
                {selectedCampaign.incident_ids.map((incId) => (
                  <div
                    key={incId}
                    className="p-3 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span className="text-cyan-400 font-bold">{incId}</span>
                      <span className="text-slate-300">Targeting {selectedCampaign.affected_assets.join(', ')}</span>
                    </div>
                    <button
                      onClick={() => onSelectIncident(incId)}
                      className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Investigate</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
