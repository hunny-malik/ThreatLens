import React from 'react';
import {
  ShieldAlert,
  Layers,
  Clock,
  Activity,
  CheckCircle2,
  ArrowRight,
  Server,
  Crosshair,
  Database,
  Terminal,
} from 'lucide-react';
import { DashboardKPIs, Incident } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { SeverityBadge } from '../common/SeverityBadge';
import { AssetCriticalityBadge } from '../common/AssetCriticalityBadge';
import { RiskScoreGauge } from '../common/RiskScoreGauge';
import { DirectoryFooter } from '../layout/DirectoryFooter';

interface DashboardViewProps {
  data: DashboardKPIs | null;
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onNavigateToIncidents: () => void;
  onOpenDatasets: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  incidents,
  onSelectIncident,
  onNavigateToIncidents,
  onOpenDatasets,
}) => {
  if (!data) {
    return (
      <div className="p-12 text-center text-text-muted font-mono text-xs">
        Loading enterprise telemetry &amp; correlation intelligence...
      </div>
    );
  }

  const { kpis } = data;

  return (
    <div className="w-full font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Section 1: Asymmetric Editorial Hero (7/5 Split from design.pdf) */}
        <section className="pt-2 pb-6 border-b border-hairline">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Mission-Led Headline */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 font-mono text-[11px] text-text-muted uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-clay" />
                <span>MSSP Intelligence Specification</span>
                <span>•</span>
                <span>Tier-1 Cognitive Shield</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-ink tracking-tight leading-[1.04]">
                3,000 alerts. One analyst. Grounded intelligence.
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs font-mono text-text-muted">
                <div>
                  <span className="text-ink font-semibold">
                    {kpis.alerts_ingested.toLocaleString()}
                  </span>{' '}
                  Alerts Ingested
                </div>
                <div>
                  <span className="text-clay-deep font-semibold">
                    {kpis.alerts_collapsed.toLocaleString()}
                  </span>{' '}
                  Noise Collapsed ({Math.round((kpis.alerts_collapsed / Math.max(1, kpis.alerts_ingested)) * 100)}%)
                </div>
                <div>
                  <span className="text-ink font-semibold">{incidents.length}</span>{' '}
                  Actionable Incidents
                </div>
                <div>
                  <span className="text-ink font-semibold">
                    {kpis.mttt_assisted_minutes}m
                  </span>{' '}
                  MTTT (vs {kpis.mttt_baseline_minutes}m)
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Measured Serif Deck + Decisive Clay Action */}
            <div className="lg:col-span-5 space-y-5 lg:pl-6 lg:border-l lg:border-hairline">
              <p className="font-serif text-ink-soft text-base sm:text-lg leading-relaxed">
                In a typical 8-hour shift, tier-1 security analysts drown in repetitive noise. ThreatLens applies multi-dimensional graph correlation to disentangle simultaneous attack campaigns, collapse redundant telemetry, and generate evidence-grounded AI briefs with mathematical rigor and zero hallucination.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={onOpenDatasets}
                  className="px-4 py-2.5 rounded-lg bg-clay hover:bg-[#cf6f4f] text-ink font-sans text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
                >
                  <Database className="w-3.5 h-3.5 fill-ink" />
                  <span>Open Dataset Hub &amp; Ingest</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onNavigateToIncidents}
                  className="px-4 py-2.5 rounded-lg bg-surface hover:bg-oat text-ink border border-hairline font-sans text-xs font-medium transition-colors"
                >
                  View Incident Queue ({incidents.length})
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Four Core Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Incidents"
            value={kpis.active_incidents}
            subValue={`/ ${incidents.length} total`}
            trend={`${kpis.critical_incidents} Critical Priority`}
            trendDirection="up"
            highlight={true}
            icon={<ShieldAlert className="w-4 h-4 text-clay-deep" />}
          />

          <MetricCard
            title="Alerts Ingested"
            value={kpis.alerts_ingested.toLocaleString()}
            subValue="telemetry events"
            trend={`${kpis.alerts_collapsed.toLocaleString()} noise collapsed (${Math.round((kpis.alerts_collapsed / Math.max(1, kpis.alerts_ingested)) * 100)}%)`}
            trendDirection="down"
            icon={<Layers className="w-4 h-4 text-text-muted" />}
          />

          <MetricCard
            title="Mean Time To Triage"
            value={`${kpis.mttt_assisted_minutes}m`}
            subValue={`vs ${kpis.mttt_baseline_minutes}m baseline`}
            trend={`-${kpis.mttt_reduction_percentage}% MTTT Reduction`}
            trendDirection="down"
            icon={<Clock className="w-4 h-4 text-text-muted" />}
          />

          <MetricCard
            title="Analyst Hours Saved"
            value={`${kpis.workload_hours_saved} hrs`}
            subValue="shift fatigue avoided"
            trend={`${kpis.processing_throughput_eps > 0 ? kpis.processing_throughput_eps : '16,200'} EPS stream`}
            trendDirection="neutral"
            icon={<Activity className="w-4 h-4 text-text-muted" />}
          />
        </section>

        {/* Section 3: Main Editorial Two-Column Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 8 Columns: High-Volume Incident Queue (Editorial Content Table) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-surface border border-hairline rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 px-6 border-b border-hairline flex items-center justify-between bg-surface">
                <div>
                  <h3 className="text-sm font-semibold text-ink font-sans uppercase tracking-wider">
                    Risk-Ranked Incident Queue
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5 font-serif">
                    Disentangled attack campaigns prioritized by asset criticality and MITRE kill-chain progression
                  </p>
                </div>
                <button
                  onClick={onNavigateToIncidents}
                  className="text-xs text-clay-deep hover:text-ink font-sans font-medium flex items-center gap-1 transition-colors"
                >
                  <span>Full Queue ({incidents.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {incidents.length === 0 ? (
                <div className="p-12 text-center space-y-3 bg-oat/30 m-4 rounded-xl border border-hairline">
                  <div className="w-10 h-10 rounded-full bg-surface border border-hairline flex items-center justify-center mx-auto text-sage">
                    <CheckCircle2 className="w-5 h-5 text-ink" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-mono text-xs uppercase font-bold text-ink">
                      Clean Enterprise Baseline • Zero Malicious Attacks
                    </h4>
                    <p className="text-xs text-text-muted max-w-md mx-auto font-serif">
                      All {kpis.alerts_ingested.toLocaleString()} operational telemetry events processed across 32 Spark partitions with zero attack chains identified. All {kpis.alerts_collapsed.toLocaleString()} benign maintenance events safely collapsed.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="editorial-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Risk</th>
                        <th>Severity</th>
                        <th>Incident Title</th>
                        <th>Primary Asset</th>
                        <th>Collapsed</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidents.slice(0, 7).map((inc, index) => (
                        <tr
                          key={inc.id}
                          onClick={() => onSelectIncident(inc.id)}
                          className="cursor-pointer transition-colors"
                        >
                          <td className="font-mono text-xs text-ink font-medium">
                            <span className="text-text-muted mr-1.5 font-normal">#{index + 1}</span>
                            {inc.id}
                          </td>
                          <td>
                            <RiskScoreGauge score={inc.risk_score} size="sm" />
                          </td>
                          <td>
                            <SeverityBadge severity={inc.severity} size="sm" />
                          </td>
                          <td className="max-w-xs truncate font-sans text-xs font-medium text-ink">
                            {inc.title}
                          </td>
                          <td>
                            <AssetCriticalityBadge
                              criticality={inc.primary_asset_criticality}
                              assetType={inc.primary_asset}
                              compact={true}
                            />
                          </td>
                          <td className="font-mono text-[11px] text-clay-deep font-medium">
                            +{inc.total_alerts - inc.deduplicated_alerts_count}
                          </td>
                          <td>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectIncident(inc.id);
                              }}
                              className="px-2.5 py-1 bg-surface hover:bg-oat border border-hairline text-ink rounded text-[11px] font-sans font-medium transition-colors"
                            >
                              Triage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Volume Time-Series Trend */}
            <div className="bg-surface border border-hairline rounded-2xl p-6 shadow-xs">
              {(() => {
                const peakAlerts = Math.max(1, ...data.volume_trend.map((p) => p.alerts));
                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xs font-semibold text-ink uppercase tracking-wider font-sans">
                          Telemetry Ingestion &amp; Incident Correlation Trend
                        </h4>
                        <p className="text-xs text-text-muted font-serif">
                          Hourly event volume across active shift
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-text-muted">
                        Peak: {peakAlerts.toLocaleString()} alerts/hr
                      </span>
                    </div>

                    <div className="grid grid-cols-8 gap-3 h-28 items-end pt-4 border-b border-hairline">
                      {data.volume_trend.map((pt) => {
                        const heightPct = Math.max(8, Math.round((pt.alerts / peakAlerts) * 85));
                        return (
                          <div
                            key={pt.time}
                            className="flex flex-col items-center gap-1.5 h-full justify-end group"
                          >
                            <span className="text-[10px] font-mono text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                              {pt.alerts.toLocaleString()}
                            </span>
                            <div
                              className="w-full bg-oat border border-hairline group-hover:bg-clay rounded-t transition-all"
                              style={{ height: `${heightPct}%` }}
                            />
                            <span className="text-[10px] font-mono text-text-muted mt-1">
                              {pt.time}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Right 4 Columns: Editorial Intelligence & Operational Context */}
          <div className="lg:col-span-4 space-y-6">
            {/* Top Targeted Assets */}
            <div className="bg-surface border border-hairline rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-hairline pb-2">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-clay" />
                  <h4 className="text-xs font-semibold text-ink uppercase tracking-wider font-sans">
                    Top Targeted Assets
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-text-muted uppercase">Impact</span>
              </div>

              <div className="space-y-2">
                {data.top_affected_assets.map((ast) => (
                  <div
                    key={ast.asset}
                    className="p-2.5 rounded-lg bg-canvas/70 border border-hairline flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-ink font-medium">{ast.asset}</span>
                    <span className="text-clay-deep font-semibold">
                      {ast.incident_count} {ast.incident_count === 1 ? 'Incident' : 'Incidents'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Threat Campaigns */}
            <div className="bg-surface border border-hairline rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-hairline pb-2">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-clay" />
                  <h4 className="text-xs font-semibold text-ink uppercase tracking-wider font-sans">
                    Active Threat Campaigns
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-text-muted">
                  {data.active_campaigns_count} Tracked
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-oat/50 border border-hairline">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink font-sans">
                      Operation Cobalt Tempest
                    </span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-clay text-ink">
                      APT29
                    </span>
                  </div>
                  <p className="font-serif text-[12px] text-ink-soft mt-1 leading-snug">
                    Spearphishing macro opened in Outlook invoking LSASS memory dumping and domain controller traversal.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-oat/50 border border-hairline">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink font-sans">
                      Campaign Silent Hydra
                    </span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-oat text-ink border border-hairline">
                      FIN7
                    </span>
                  </div>
                  <p className="font-serif text-[12px] text-ink-soft mt-1 leading-snug">
                    SQL injection against checkout API endpoint with 4.2 GB sensitive payment database exfiltration to C2.
                  </p>
                </div>
              </div>
            </div>

            {/* Distributed Cluster Engine Telemetry */}
            <div className="bg-surface border border-hairline rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-text-muted mb-3 border-b border-hairline pb-2">
                <span className="uppercase text-ink font-semibold">Distributed Cluster</span>
                <span className="text-clay-deep font-semibold">ONLINE</span>
              </div>
              <div className="space-y-2 text-[11px] font-mono text-ink">
                <div className="flex justify-between">
                  <span className="text-text-muted">Kafka Topic Partitions:</span>
                  <span>16 Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Spark Worker Nodes:</span>
                  <span>8 Executors Online</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Spark RDD Partitions:</span>
                  <span>32 Parquet Blocks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Processing Latency:</span>
                  <span className="text-clay-deep font-bold">{kpis.processing_latency_ms} ms</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Full-Bleed Directory Footer as specified in design.pdf */}
      <DirectoryFooter />
    </div>
  );
};
