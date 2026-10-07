import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  Clock,
  Server,
  Crosshair,
  GitBranch,
  CheckCircle2,
  XCircle,
  X,
  Edit3,
  Sliders,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  History,
  Sparkles,
  Info,
} from 'lucide-react';
import { Incident, NormalizedAlert } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { AssetCriticalityBadge } from '../common/AssetCriticalityBadge';
import { RiskScoreGauge } from '../common/RiskScoreGauge';
import { DirectoryFooter } from '../layout/DirectoryFooter';
import { api } from '../../services/api';

interface IncidentDetailViewProps {
  incidentId: string;
  onBack: () => void;
  onIncidentUpdated: () => void;
  currentRole: string;
}

export const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incidentId,
  onBack,
  onIncidentUpdated,
  currentRole,
}) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [alerts, setAlerts] = useState<NormalizedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnderlyingAlerts, setShowUnderlyingAlerts] = useState(false);
  const [selectedAlertForInspection, setSelectedAlertForInspection] = useState<NormalizedAlert | null>(null);

  // Human-in-the-loop state
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummaryText, setEditedSummaryText] = useState('');
  const [analystNotes, setAnalystNotes] = useState('');
  const [riskOverrideScore, setRiskOverrideScore] = useState<number>(0);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [triageAlertMessage, setTriageAlertMessage] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidentById(incidentId);
      setIncident(data);
      setRiskOverrideScore(data.risk_score);
      setEditedSummaryText(data.ai_summary.what_happened);

      const alertList = await api.getIncidentAlerts(incidentId);
      setAlerts(alertList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [incidentId]);

  if (loading || !incident) {
    return (
      <div className="p-16 text-center font-mono text-xs text-text-muted">
        Loading deep investigation telemetry for {incidentId}...
      </div>
    );
  }

  // Action handlers
  const handleStatusChange = async (newStatus: string) => {
    try {
      setIncident((prev) => (prev ? { ...prev, status: newStatus as any } : prev));
      setTriageAlertMessage(`Incident ${incident.id} marked as "${newStatus}". Feedback learning and immutable audit log updated.`);
      setTimeout(() => setTriageAlertMessage(null), 4500);

      await api.updateIncidentStatus(incident.id, newStatus, analystNotes, `Analyst (${currentRole})`);
      onIncidentUpdated();
      fetchDetails();
    } catch (e: any) {
      console.error(e);
      setTriageAlertMessage(`Failed to update status: ${e.message || 'Error'}`);
    }
  };

  const handleSaveEditedSummary = async () => {
    try {
      await api.overrideIncident(incident.id, {
        ai_summary_status: 'Modified',
        edited_summary: editedSummaryText,
        notes: analystNotes,
      });
      setIsEditingSummary(false);
      onIncidentUpdated();
      fetchDetails();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptSummary = async () => {
    try {
      await api.overrideIncident(incident.id, {
        ai_summary_status: 'Accepted',
        notes: 'Analyst verified factual alignment',
      });
      onIncidentUpdated();
      fetchDetails();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyRiskOverride = async () => {
    try {
      await api.overrideIncident(incident.id, {
        risk_score: riskOverrideScore,
        notes: analystNotes || 'Analyst manual risk score adjustment',
      });
      setShowRiskModal(false);
      onIncidentUpdated();
      fetchDetails();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveMitre = async (techId: string) => {
    try {
      await api.toggleMitreTechnique(incident.id, techId, 'REMOVE');
      onIncidentUpdated();
      fetchDetails();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-canvas min-h-full flex flex-col justify-between">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Triage Alert Feedback Banner */}
        {triageAlertMessage && (
          <div className="p-3 bg-sage/30 border border-sage text-ink flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-ink" />
              <span>{triageAlertMessage}</span>
            </div>
            <button onClick={() => setTriageAlertMessage(null)} className="text-ink/60 hover:text-ink">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Navigation & Status Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-hairline">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Incident Index</span>
          </button>

          {/* Human-in-the-loop Quick Status Classifier */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-text-muted mr-1">Triage Classification:</span>
            <button
              onClick={() => handleStatusChange('True Positive')}
              className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors border ${
                incident.status === 'True Positive'
                  ? 'bg-clay text-ink font-semibold border-clay shadow-sm'
                  : 'bg-surface text-ink/80 border-hairline hover:bg-oat/50'
              }`}
            >
              True Positive
            </button>
            <button
              onClick={() => handleStatusChange('False Positive')}
              className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors border ${
                incident.status === 'False Positive'
                  ? 'bg-manilla text-ink font-semibold border-hairline shadow-sm'
                  : 'bg-surface text-ink/80 border-hairline hover:bg-oat/50'
              }`}
            >
              False Positive
            </button>
            <button
              onClick={() => handleStatusChange('Benign')}
              className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors border ${
                incident.status === 'Benign'
                  ? 'bg-sage text-ink font-semibold border-hairline shadow-sm'
                  : 'bg-surface text-ink/80 border-hairline hover:bg-oat/50'
              }`}
            >
              Benign
            </button>
            <button
              onClick={() => handleStatusChange('Escalated')}
              className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors border ${
                incident.status === 'Escalated'
                  ? 'bg-clay-deep text-canvas font-semibold border-clay-deep shadow-sm'
                  : 'bg-surface text-ink/80 border-hairline hover:bg-oat/50'
              }`}
            >
              Escalate (Tier-2)
            </button>
          </div>
        </div>

        {/* Main Incident Header Banner */}
        <div className="editorial-card p-6 space-y-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-sm font-semibold text-ink bg-oat/50 px-2 py-0.5 border border-hairline">
                  {incident.id}
                </span>
                <SeverityBadge severity={incident.severity} />
                <span className="text-[11px] font-mono px-2 py-0.5 bg-canvas border border-hairline text-ink">
                  {incident.threat_classification}
                </span>
                {incident.campaign_name && (
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-manilla/60 border border-hairline text-ink font-medium">
                    Campaign: {incident.campaign_name}
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-ink">
                {incident.title}
              </h1>
            </div>

            {/* Right Risk & Actions */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <RiskScoreGauge score={incident.risk_score} size="md" showLabel={true} />
                <button
                  onClick={() => setShowRiskModal(true)}
                  className="text-[11px] font-mono text-clay-deep hover:underline mt-1 flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Override Score</span>
                </button>
              </div>
            </div>
          </div>

          {/* Metadata Strip */}
          <div className="pt-4 border-t border-hairline grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-mono">
            <div>
              <span className="text-text-muted block text-[10px] uppercase tracking-wider mb-1">
                Primary Asset
              </span>
              <AssetCriticalityBadge
                criticality={incident.primary_asset_criticality}
                assetType={incident.primary_asset_type}
              />
              <span className="text-ink block text-xs mt-1 font-sans font-medium truncate">
                {incident.primary_asset}
              </span>
            </div>

            <div>
              <span className="text-text-muted block text-[10px] uppercase tracking-wider mb-1">
                Telemetry Evidence
              </span>
              <span className="text-ink font-semibold">{incident.total_alerts} Total Alerts</span>
              <span className="text-text-muted block text-[11px] mt-0.5 truncate">
                {incident.collapsed_summary}
              </span>
            </div>

            <div>
              <span className="text-text-muted block text-[10px] uppercase tracking-wider mb-1">
                Progression Stage
              </span>
              <span className="text-ink font-semibold">
                {incident.attack_chain.length > 0
                  ? incident.attack_chain[incident.attack_chain.length - 1].stage
                  : 'Execution'}
              </span>
              <span className="text-text-muted block text-[11px] mt-0.5">
                {incident.duration_minutes}m duration
              </span>
            </div>

            <div>
              <span className="text-text-muted block text-[10px] uppercase tracking-wider mb-1">
                Model Confidence
              </span>
              <span className="text-ink font-semibold">{Math.round(incident.confidence * 100)}%</span>
              <span className="text-text-muted block text-[11px] mt-0.5">Validated Telemetry</span>
            </div>

            <div>
              <span className="text-text-muted block text-[10px] uppercase tracking-wider mb-1">
                Pattern Baseline
              </span>
              <span className="font-semibold text-ink">
                {incident.historical_fp_rate_for_pattern}% FP Rate
              </span>
              <span className="text-text-muted block text-[11px] mt-0.5">
                {incident.historical_fp_rate_for_pattern > 50 ? 'Frequently benign noise' : 'High fidelity pattern'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Two-Column Investigation Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: AI Brief, Attack Chain Timeline, Evidence, Underlying Alerts */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Grounded Incident Brief Card (Requirement 12) */}
            <div className="editorial-card overflow-hidden">
              <div className="px-5 py-3.5 bg-surface border-b border-hairline flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-clay-deep" />
                  <h3 className="font-display text-sm font-medium tracking-tight text-ink">
                    Grounded Incident Brief &mdash; Shift Handover
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-text-muted text-[11px]">Status:</span>
                  <span className="text-ink bg-oat/40 px-2 py-0.5 border border-hairline">
                    {incident.ai_summary.analyst_status}
                  </span>
                  <button
                    onClick={handleAcceptSummary}
                    className="px-2.5 py-1 bg-clay text-ink hover:bg-clay/90 font-display font-medium border border-clay transition-colors"
                  >
                    Accept Brief
                  </button>
                  <button
                    onClick={() => setIsEditingSummary(!isEditingSummary)}
                    className="px-2.5 py-1 bg-surface hover:bg-oat/50 text-ink border border-hairline transition-colors flex items-center gap-1 font-display"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Structured Format: WHAT HAPPENED, WHY IT MATTERS, AFFECTED ASSETS, ATTACK STAGE */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-bold block mb-1.5">
                    What Happened
                  </span>
                  {isEditingSummary ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedSummaryText}
                        onChange={(e) => setEditedSummaryText(e.target.value)}
                        className="w-full h-24 p-3 bg-canvas border border-hairline text-ink text-sm font-serif focus:outline-none focus:border-ink"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsEditingSummary(false)}
                          className="px-3 py-1 bg-surface border border-hairline text-ink text-xs font-display"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEditedSummary}
                          className="px-3 py-1 bg-clay text-ink font-display font-medium text-xs border border-clay"
                        >
                          Save Brief
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-serif text-ink text-base leading-relaxed">
                      {incident.ai_summary.analyst_edited_summary || incident.ai_summary.what_happened}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-hairline">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-bold block mb-1.5">
                    Why It Matters
                  </span>
                  <p className="font-serif text-ink/90 text-sm leading-relaxed">
                    {incident.ai_summary.why_it_matters}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-hairline">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-bold block mb-1.5">
                      Affected Assets
                    </span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                      {incident.affected_assets.map((ast) => (
                        <span
                          key={ast}
                          className="bg-canvas text-ink px-2 py-0.5 border border-hairline"
                        >
                          {ast}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-bold block mb-1.5">
                      Verified Attack Stage &amp; Tactic
                    </span>
                    <span className="font-mono text-xs text-ink font-semibold">
                      {incident.ai_summary.attack_stage}
                    </span>
                  </div>
                </div>

                {/* Evidence Highlights */}
                <div className="pt-3 border-t border-hairline">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-bold block mb-2">
                    Telemetry Evidence Highlights
                  </span>
                  <ul className="space-y-1.5 font-mono text-xs text-ink/80">
                    {incident.ai_summary.evidence_highlights.map((ev, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-clay-deep shrink-0">&bull;</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Attack Chain Reconstruction Graph & Timeline (Requirement 7) */}
            <div className="editorial-card overflow-hidden">
              <div className="px-5 py-3.5 bg-surface border-b border-hairline flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-ink" />
                  <h3 className="font-display text-sm font-medium tracking-tight text-ink">
                    Attack Chain Reconstruction &bull; Verified Kill-Chain Progression
                  </h3>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  {incident.attack_chain.length} Stage(s)
                </span>
              </div>

              <div className="p-6 space-y-4">
                {incident.attack_chain.length === 0 ? (
                  <div className="py-6 text-center text-xs font-mono text-text-muted">
                    No multi-stage progression detected; isolated event telemetry.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incident.attack_chain.map((step, idx) => (
                      <div
                        key={step.stage}
                        className="p-4 bg-canvas border border-hairline space-y-2 hover:border-ink/40 transition-colors"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 bg-oat text-ink border border-hairline flex items-center justify-center font-mono text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-display text-sm font-semibold text-ink">
                              {step.stage}
                            </span>
                            <span className="font-mono text-xs text-clay-deep bg-manilla/40 px-2 py-0.5 border border-hairline">
                              {step.technique_id} &bull; {step.technique_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 font-mono text-xs text-text-muted">
                            <span>{step.source}</span>
                            <span>{step.timestamp.slice(11, 19)}</span>
                            <span className="text-ink font-semibold">
                              {Math.round(step.confidence * 100)}% Conf
                            </span>
                          </div>
                        </div>

                        <p className="font-serif italic text-xs text-ink/80 pl-4 border-l-2 border-hairline">
                          {step.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Deduplication & Collapsed Alerts Inspector (Requirement 5) */}
            <div className="editorial-card overflow-hidden">
              <div
                onClick={() => setShowUnderlyingAlerts(!showUnderlyingAlerts)}
                className="px-5 py-3.5 bg-surface border-b border-hairline flex items-center justify-between cursor-pointer hover:bg-oat/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-ink" />
                  <h3 className="font-display text-sm font-medium tracking-tight text-ink">
                    Deduplication Inspector ({incident.total_alerts} Total &bull; {incident.collapsed_summary})
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                  <span>{showUnderlyingAlerts ? 'Collapse' : 'Expand & Inspect Telemetry'}</span>
                  {showUnderlyingAlerts ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>

              {showUnderlyingAlerts && (
                <div className="p-5 space-y-4">
                  <div className="p-3 bg-oat/30 border border-hairline text-xs font-mono text-ink flex items-center justify-between flex-wrap gap-2">
                    <span>
                      Workload Saved: {Math.round((incident.total_alerts - incident.deduplicated_alerts_count) * 2.5)} minutes of manual triage fatigue eliminated.
                    </span>
                    <span className="font-semibold text-ink">
                      {Math.round(((incident.total_alerts - incident.deduplicated_alerts_count) / incident.total_alerts) * 100)}% Alert Reduction
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-72 overflow-y-auto border border-hairline">
                    <table className="w-full text-left editorial-table text-xs">
                      <thead>
                        <tr>
                          <th>Alert ID</th>
                          <th>Source</th>
                          <th>Rule / Type</th>
                          <th>Host</th>
                          <th>Process / Indicator</th>
                          <th>Timestamp</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.map((a) => (
                          <tr key={a.id}>
                            <td className="font-mono text-xs font-semibold text-ink">{a.id}</td>
                            <td className="font-mono text-xs">{a.source}</td>
                            <td className="max-w-xs truncate font-medium">{a.alert_type}</td>
                            <td className="font-mono text-xs">{a.host}</td>
                            <td className="font-mono text-xs truncate max-w-[140px] text-text-muted">
                              {a.process || a.file_hash || a.domain || 'N/A'}
                            </td>
                            <td className="font-mono text-[11px] text-text-muted">
                              {a.timestamp.slice(11, 19)}
                            </td>
                            <td>
                              <button
                                onClick={() => setSelectedAlertForInspection(a)}
                                className="text-clay-deep hover:underline text-xs font-mono"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Col: Dynamic Risk Breakdown, AI Next Steps, MITRE Management */}
          <div className="space-y-6">
            {/* AI Recommended Investigation Steps (Requirement 13) */}
            <div className="editorial-card p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-hairline">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-ink" />
                  <h4 className="font-display text-sm font-medium tracking-tight text-ink">
                    AI Recommended Next Steps
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  Prioritized Playbook
                </span>
              </div>

              <p className="text-xs text-text-muted">
                Evidence-based tactical actions recommended for the duty analyst:
              </p>

              <div className="space-y-2.5">
                {incident.recommended_actions.map((step) => (
                  <div
                    key={step.priority}
                    className="p-3 bg-canvas border border-hairline space-y-1 hover:border-ink/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 bg-oat text-ink border border-hairline text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                        #{step.priority}
                      </span>
                      <span className="font-display text-xs font-semibold text-ink">{step.action}</span>
                    </div>
                    <p className="font-serif text-xs text-ink/80 pl-6 leading-relaxed">{step.rationale}</p>
                    <div className="text-[11px] font-mono text-clay-deep pl-6 pt-0.5">
                      Target: {step.evidence_pointer}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Risk Score Explanation (Requirement 9) */}
            <div className="editorial-card p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-hairline">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-ink" />
                  <h4 className="font-display text-sm font-medium tracking-tight text-ink">
                    Dynamic Risk Calculation
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-ink">
                  {incident.risk_score.toFixed(1)} / 100
                </span>
              </div>

              <p className="font-serif text-xs text-ink/90 leading-relaxed bg-canvas p-3 border border-hairline">
                {incident.risk_explanation.explanation}
              </p>

              {/* Factor Breakdown */}
              <div className="space-y-1.5 text-xs font-mono pt-1">
                <div className="flex justify-between text-ink/80">
                  <span className="text-text-muted">Base Severity:</span>
                  <span>{incident.risk_explanation.base_severity_score} pts</span>
                </div>
                <div className="flex justify-between text-ink/80">
                  <span className="text-text-muted">Asset Criticality Multiplier:</span>
                  <span className="font-semibold text-ink">{incident.risk_explanation.asset_criticality_multiplier}x</span>
                </div>
                <div className="flex justify-between text-ink/80">
                  <span className="text-text-muted">Kill-Chain Stage Multiplier:</span>
                  <span className="font-semibold text-ink">{incident.risk_explanation.attack_stage_multiplier}x</span>
                </div>
                <div className="flex justify-between text-ink/80">
                  <span className="text-text-muted">Telemetry Confidence Factor:</span>
                  <span>{incident.risk_explanation.confidence_weight}x</span>
                </div>
                {incident.risk_explanation.behavioral_anomaly_boost > 0 && (
                  <div className="flex justify-between text-clay-deep font-semibold">
                    <span>Behavioral Anomaly Boost:</span>
                    <span>+{incident.risk_explanation.behavioral_anomaly_boost} pts</span>
                  </div>
                )}
              </div>
            </div>

            {/* MITRE ATT&CK Mapping & Management (Requirement 8 & 15) */}
            <div className="editorial-card p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-hairline">
                <h4 className="font-display text-sm font-medium tracking-tight text-ink">
                  MITRE ATT&CK Mapping
                </h4>
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  Analyst Verified
                </span>
              </div>

              <div className="space-y-2">
                {incident.mitre_techniques.map((tech) => (
                  <div
                    key={tech.technique_id}
                    className="p-2.5 bg-canvas border border-hairline flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-ink block">{tech.technique_id}</span>
                      <span className="text-ink/80 text-xs font-sans block">{tech.technique_name}</span>
                      <span className="text-text-muted text-[10px]">{tech.tactic}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveMitre(tech.technique_id)}
                      className="text-text-muted hover:text-clay-deep p-1 transition-colors"
                      title="Remove incorrect technique"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyst Investigation Notes */}
            <div className="editorial-card p-5 space-y-3">
              <h4 className="font-display text-sm font-medium tracking-tight text-ink">
                Analyst Investigation Notes
              </h4>
              <textarea
                value={analystNotes}
                onChange={(e) => setAnalystNotes(e.target.value)}
                placeholder="Record forensic findings, containment timestamps, or rationale for overrides..."
                className="w-full h-24 p-3 bg-canvas border border-hairline text-xs text-ink focus:outline-none focus:border-ink font-sans"
              />
              <button
                onClick={() => handleStatusChange(incident.status)}
                className="w-full py-2 bg-surface hover:bg-oat/50 text-ink border border-hairline text-xs font-display font-medium uppercase tracking-wider transition-colors"
              >
                Save Notes to Immutable Audit Trail
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Footer */}
      <DirectoryFooter />

      {/* Raw Alert Inspection Modal */}
      {selectedAlertForInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-hairline w-full max-w-xl shadow-2xl p-6 space-y-4 font-mono text-xs text-ink">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <span className="font-bold text-ink">ALERT TELEMETRY: {selectedAlertForInspection.id}</span>
              <button
                onClick={() => setSelectedAlertForInspection(null)}
                className="text-text-muted hover:text-ink text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-canvas p-4 border border-hairline max-h-80 overflow-y-auto text-xs text-ink">
              <pre>{JSON.stringify(selectedAlertForInspection, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Risk Override Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-hairline w-full max-w-md shadow-2xl p-6 space-y-4 text-ink">
            <h3 className="font-display text-base font-semibold uppercase tracking-wider text-ink">
              Manual Risk Score Override
            </h3>
            <p className="text-xs text-text-muted font-sans">
              Human-in-the-loop control: adjust calculated score based on operational context.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-text-muted">New Score:</span>
                <span className="font-bold text-ink">{riskOverrideScore.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="5"
                max="99"
                step="0.5"
                value={riskOverrideScore}
                onChange={(e) => setRiskOverrideScore(parseFloat(e.target.value))}
                className="w-full accent-ink"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-hairline">
              <button
                onClick={() => setShowRiskModal(false)}
                className="px-3 py-1.5 bg-canvas border border-hairline text-ink text-xs font-display"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyRiskOverride}
                className="px-4 py-1.5 bg-clay text-ink font-display font-medium border border-clay text-xs hover:bg-clay/90 transition-colors"
              >
                Apply &amp; Log Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
