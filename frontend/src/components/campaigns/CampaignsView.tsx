import React, { useState, useEffect } from 'react';
import { Crosshair, ShieldAlert, Server, Globe, Hash, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { ThreatCampaign } from '../../types';
import { RiskScoreGauge } from '../common/RiskScoreGauge';
import { DirectoryFooter } from '../layout/DirectoryFooter';

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
      <div className="p-12 text-center text-text-muted font-mono text-xs">
        Loading campaign intelligence...
      </div>
    );
  }

  return (
    <div className="bg-canvas min-h-full flex flex-col justify-between">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="pb-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-clay" />
            <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight text-ink">
              Threat Actor Campaign Intelligence
            </h2>
          </div>
          <p className="font-serif text-sm text-text-muted mt-1">
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
                className={`w-full text-left p-5 border transition-colors ${
                  selectedCampaign?.id === camp.id
                    ? 'bg-surface border-ink shadow-sm'
                    : 'bg-surface/60 border-hairline hover:border-ink/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold text-ink bg-oat/40 px-2 py-0.5 border border-hairline">
                    {camp.id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-manilla/70 text-ink border border-hairline font-semibold">
                    {camp.threat_actor_alias}
                  </span>
                </div>
                <h3 className="font-display text-sm font-semibold text-ink">{camp.name}</h3>
                <p className="font-serif text-xs text-ink/80 mt-1 line-clamp-2 leading-relaxed">
                  {camp.description}
                </p>

                <div className="mt-4 pt-2.5 border-t border-hairline flex items-center justify-between text-xs font-mono">
                  <span className="text-text-muted">
                    {camp.incidents_count} Correlated Incidents
                  </span>
                  <RiskScoreGauge score={camp.risk_score} size="sm" />
                </div>
              </button>
            ))}
          </div>

          {/* Campaign Intelligence Detail Panel */}
          {selectedCampaign && (
            <div className="lg:col-span-2 editorial-card p-6 md:p-8 space-y-6">
              <div className="border-b border-hairline pb-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-ink bg-oat/50 px-2 py-0.5 border border-hairline">
                      {selectedCampaign.id}
                    </span>
                    <span className="text-xs font-mono text-ink bg-canvas px-2 py-0.5 border border-hairline">
                      Alias: {selectedCampaign.threat_actor_alias}
                    </span>
                  </div>
                  <RiskScoreGauge score={selectedCampaign.risk_score} size="md" showLabel={true} />
                </div>
                <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight text-ink mt-2">
                  {selectedCampaign.name}
                </h2>
                <p className="font-serif text-sm text-ink/80 leading-relaxed">
                  {selectedCampaign.description}
                </p>
              </div>

              {/* Common Threat Indicators (IOCs) */}
              <div className="space-y-3">
                <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-ink">
                  Common Campaign Indicators (Infrastructure &amp; Signatures)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 bg-canvas border border-hairline space-y-1.5">
                    <div className="flex items-center gap-1.5 text-text-muted mb-2">
                      <Globe className="w-3.5 h-3.5 text-ink" />
                      <span className="font-display text-xs uppercase tracking-wider font-semibold text-ink">Command &amp; Control IPs</span>
                    </div>
                    {selectedCampaign.common_indicators.ips.map((ip) => (
                      <div key={ip} className="text-ink">
                        &bull; {ip}
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-canvas border border-hairline space-y-1.5">
                    <div className="flex items-center gap-1.5 text-text-muted mb-2">
                      <Globe className="w-3.5 h-3.5 text-ink" />
                      <span className="font-display text-xs uppercase tracking-wider font-semibold text-ink">Malicious Domains</span>
                    </div>
                    {selectedCampaign.common_indicators.domains.map((d) => (
                      <div key={d} className="text-ink">
                        &bull; {d}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Associated Incidents */}
              <div className="space-y-3">
                <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-ink">
                  Correlated Incidents Belonging to this Campaign ({selectedCampaign.incident_ids.length})
                </h4>
                <div className="space-y-2">
                  {selectedCampaign.incident_ids.map((incId) => (
                    <div
                      key={incId}
                      className="p-3 bg-canvas border border-hairline flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-ink">{incId}</span>
                        <span className="text-text-muted">Targeting {selectedCampaign.affected_assets.join(', ')}</span>
                      </div>
                      <button
                        onClick={() => onSelectIncident(incId)}
                        className="text-clay-deep hover:underline flex items-center gap-1 font-display font-medium text-xs"
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

      <DirectoryFooter />
    </div>
  );
};
