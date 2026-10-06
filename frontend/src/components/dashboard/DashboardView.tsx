import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Layers,
  Clock,
  Activity,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  Server,
  Crosshair,
  Filter,
} from 'lucide-react';
import { DashboardKPIs, Incident } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { SeverityBadge } from '../common/SeverityBadge';
import { AssetCriticalityBadge } from '../common/AssetCriticalityBadge';
import { RiskScoreGauge } from '../common/RiskScoreGauge';

interface DashboardViewProps {
  data: DashboardKPIs | null;
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onNavigateToIncidents: () => void;
  onOpenSimulation: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  incidents,
  onSelectIncident,
  onNavigateToIncidents,
  onOpenSimulation,
}) => {
  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Loading enterprise telemetry & intelligence...
      </div>
    );
  }

  const { kpis } = data;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Problem Statement Resolution */}
      <div className="p-4 rounded-lg bg-charcoal-800 border border-slate-700/80 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-cyan-400 font-semibold uppercase tracking-wider">
              SOLVING &ldquo;3,000 ALERTS, ONE ANALYST&rdquo;
            </span>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
              TIER-1 INTELLIGENCE
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Ingested <strong className="text-slate-100 font-mono">{kpis.alerts_ingested.toLocaleString()}</strong> raw telemetry events.
            Intelligent deduplication collapsed <strong className="text-emerald-400 font-mono">{kpis.alerts_collapsed.toLocaleString()}</strong> repetitive alerts into{' '}
            <strong className="text-cyan-400 font-mono">{incidents.length} actionable correlated incidents</strong>.
            Mean Time To Triage (MTTT) reduced from {kpis.mttt_baseline_minutes}m to {kpis.mttt_assisted_minutes}m.
          </p>
        </div>

        <button
          onClick={onOpenSimulation}
          className="flex items-center gap-2 px-3.5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold transition-colors shadow-md"
        >
          <span>SIMULATE STREAM</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Incidents"
          value={kpis.active_incidents}
          subValue={`/ ${incidents.length} total`}
          trend={`${kpis.critical_incidents} Critical Priority`}
          trendDirection="up"
          highlight={true}
          alertColor={kpis.critical_incidents > 0 ? 'red' : 'blue'}
          icon={<ShieldAlert className="w-4 h-4 text-red-400" />}
        />

        <MetricCard
          title="Alerts Ingested"
          value={kpis.alerts_ingested.toLocaleString()}
          subValue="telemetry events"
          trend={`${kpis.alerts_collapsed.toLocaleString()} collapsed (${Math.round((kpis.alerts_collapsed / kpis.alerts_ingested) * 100)}%)`}
          trendDirection="down"
          alertColor="emerald"
          icon={<Layers className="w-4 h-4 text-cyan-400" />}
        />

        <MetricCard
          title="Mean Time To Triage"
          value={`${kpis.mttt_assisted_minutes}m`}
          subValue={`vs ${kpis.mttt_baseline_minutes}m baseline`}
          trend={`-${kpis.mttt_reduction_percentage}% MTTT Reduction`}
          trendDirection="down"
          alertColor="emerald"
          icon={<Clock className="w-4 h-4 text-emerald-400" />}
        />

        <MetricCard
          title="Analyst Hours Saved"
          value={`${kpis.workload_hours_saved} hrs`}
          subValue="shift fatigue avoided"
          trend={`${kpis.processing_throughput_eps > 0 ? kpis.processing_throughput_eps : '1,420'} eps stream`}
          trendDirection="neutral"
          alertColor="amber"
          icon={<Activity className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Risk-Ranked Incident Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="soc-card overflow-hidden">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  Risk-Ranked Incident Queue (Top Priority)
                </h3>
              </div>
              <button
                onClick={onNavigateToIncidents}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 transition-colors"
              >
                <span>View Full Queue ({incidents.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              {incidents.length === 0 ? (
                <div className="p-8 text-center space-y-3 bg-emerald-950/20 border border-emerald-900/40 rounded m-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-mono text-xs uppercase font-bold text-emerald-400">
                      Clean Enterprise Baseline &bull; Zero Threats Detected
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      All {kpis.alerts_ingested.toLocaleString()} telemetry events processed across 16 partitions with 0 malicious attack chains identified. All {kpis.alerts_collapsed.toLocaleString()} benign maintenance events safely collapsed.
                    </p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-left soc-table">
                  <thead>
                    <tr>
                      <th>Priority &amp; ID</th>
                      <th>Risk</th>
                      <th>Severity</th>
                      <th>Incident Title</th>
                      <th>Primary Asset</th>
                      <th>Collapsed</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.slice(0, 5).map((inc, index) => (
                      <tr
                        key={inc.id}
                        onClick={() => onSelectIncident(inc.id)}
                        className="cursor-pointer transition-colors"
                      >
                        <td className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-4 text-slate-400 text-center font-bold">
                              #{index + 1}
                            </span>
                            <span className="text-cyan-400 font-medium">{inc.id}</span>
                          </div>
                        </td>
                        <td>
                          <RiskScoreGauge score={inc.risk_score} size="sm" />
                        </td>
                        <td>
                          <SeverityBadge severity={inc.severity} size="sm" />
                        </td>
                        <td className="max-w-xs truncate font-medium text-slate-200">
                          {inc.title}
                        </td>
                        <td>
                          <AssetCriticalityBadge
                            criticality={inc.primary_asset_criticality}
                            assetType={inc.primary_asset}
                            compact={true}
                          />
                        </td>
                        <td className="font-mono text-[11px] text-emerald-400">
                          +{inc.total_alerts - inc.deduplicated_alerts_count}
                        </td>
                        <td>
                          <span className="text-[11px] font-mono text-slate-300 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                            {inc.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectIncident(inc.id);
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono transition-colors"
                          >
                            Triage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Volume Time-Series Trend */}
          <div className="soc-card p-4">
            {(() => {
              const peakAlerts = Math.max(1, ...data.volume_trend.map((p) => p.alerts));
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                        Telemetry Ingestion &amp; Incident Correlation Trend (Hourly)
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Peak: {peakAlerts.toLocaleString()} alerts/hr
                    </span>
                  </div>

                  <div className="grid grid-cols-8 gap-2 h-28 items-end pt-4 border-b border-slate-800">
                    {data.volume_trend.map((pt) => {
                      const heightPct = Math.max(6, Math.round((pt.alerts / peakAlerts) * 85));
                      return (
                        <div key={pt.time} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                          <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {pt.alerts}
                          </span>
                          <div
                            className="w-full bg-cyan-950 border border-cyan-800 hover:border-cyan-500 rounded-t transition-all"
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-[10px] font-mono text-slate-400 mt-1">{pt.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Right 1 Col: Intelligence Summaries */}
        <div className="space-y-4">
          {/* Top Affected Assets */}
          <div className="soc-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  Top Targeted Assets
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Impact Level</span>
            </div>

            <div className="space-y-2">
              {data.top_affected_assets.map((ast) => (
                <div
                  key={ast.asset}
                  className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-200 font-medium">{ast.asset}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-red-400 font-bold">{ast.incident_count} Incidents</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Threat Campaigns */}
          <div className="soc-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  Active Threat Campaigns
                </h4>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">{data.active_campaigns_count} Tracked</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Operation Cobalt Tempest
                  </span>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 border border-rose-800/80 px-1.5 py-0.5 rounded">
                    APT29
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Multi-stage credential theft targeting Domain Controller via spearphishing attachment &amp; token theft.
                </p>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Campaign Silent Hydra
                  </span>
                  <span className="text-[10px] font-mono text-orange-400 bg-orange-950/60 border border-orange-800/80 px-1.5 py-0.5 rounded">
                    FIN7 Variant
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  SQL injection against checkout API with lateral propagation to primary production database.
                </p>
              </div>
            </div>
          </div>

          {/* System Health / Pipeline Stat */}
          <div className="soc-card p-4 bg-slate-900/40">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="uppercase">Distributed Cluster Health</span>
              <span className="text-emerald-400 font-bold">100% HEALTHY</span>
            </div>
            <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Kafka Broker Partitions:</span>
                <span>8 Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spark Worker Cores:</span>
                <span>32 Cores Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average Processing Latency:</span>
                <span className="text-cyan-400">{kpis.processing_latency_ms} ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
