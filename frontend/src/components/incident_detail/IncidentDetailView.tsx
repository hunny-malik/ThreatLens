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
      <div className="p-12 text-center font-mono text-xs text-slate-400">
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Triage Alert Feedback Banner */}
      {triageAlertMessage && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded flex items-center justify-between text-xs font-mono text-emerald-300 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{triageAlertMessage}</span>
          </div>
          <button onClick={() => setTriageAlertMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO INCIDENT QUEUE</span>
        </button>

        {/* Human-in-the-loop Quick Status Classifier */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 mr-1">Triage Classification:</span>
          <button
            onClick={() => handleStatusChange('True Positive')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
              incident.status === 'True Positive'
                ? 'bg-red-950 text-red-300 border-red-700 font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-750 hover:bg-slate-800'
            }`}
          >
            True Positive
          </button>
          <button
            onClick={() => handleStatusChange('False Positive')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
              incident.status === 'False Positive'
                ? 'bg-amber-950 text-amber-300 border-amber-700 font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-750 hover:bg-slate-800'
            }`}
          >
            False Positive
          </button>
          <button
            onClick={() => handleStatusChange('Benign')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
              incident.status === 'Benign'
                ? 'bg-slate-800 text-slate-200 border-slate-600 font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-750 hover:bg-slate-800'
            }`}
          >
            Benign
          </button>
          <button
            onClick={() => handleStatusChange('Escalated')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
              incident.status === 'Escalated'
                ? 'bg-rose-950 text-rose-300 border-rose-700 font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-750 hover:bg-slate-800'
            }`}
          >
            Escalate (Tier-2)
          </button>
        </div>
      </div>

      {/* Main Incident Header Banner */}
      <div className="soc-card p-5 bg-charcoal-850 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-base font-bold text-cyan-400">{incident.id}</span>
              <SeverityBadge severity={incident.severity} />
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                {incident.threat_classification}
              </span>
              {incident.campaign_name && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800">
                  Campaign: {incident.campaign_name}
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">{incident.title}</h1>
          </div>

          {/* Right Risk & Actions */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <RiskScoreGauge score={incident.risk_score} size="md" showLabel={true} />
              <button
                onClick={() => setShowRiskModal(true)}
                className="text-[10px] font-mono text-cyan-400 hover:underline mt-1 flex items-center gap-1"
              >
                <Sliders className="w-3 h-3" />
                <span>Override Score</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Primary Asset:</span>
            <AssetCriticalityBadge
              criticality={incident.primary_asset_criticality}
              assetType={incident.primary_asset_type}
            />
            <span className="text-slate-300 block text-[11px] mt-0.5 font-sans font-medium">
              {incident.primary_asset}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Telemetry Evidence:</span>
            <span className="text-slate-200 font-bold">{incident.total_alerts} Total Alerts</span>
            <span className="text-emerald-400 block text-[11px]">
              {incident.collapsed_summary}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Attack Progression:</span>
            <span className="text-cyan-400 font-bold">
              {incident.attack_chain.length > 0
                ? incident.attack_chain[incident.attack_chain.length - 1].stage
                : 'Execution'}
            </span>
            <span className="text-slate-400 block text-[11px]">
              {incident.duration_minutes}m duration
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Model Confidence:</span>
            <span className="text-slate-200 font-bold">{Math.round(incident.confidence * 100)}%</span>
            <span className="text-slate-400 block text-[11px]">Validated Telemetry</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Historical Pattern FP:</span>
            <span
              className={`font-bold ${
                incident.historical_fp_rate_for_pattern > 50 ? 'text-amber-400' : 'text-slate-200'
              }`}
            >
              {incident.historical_fp_rate_for_pattern}% FP Rate
            </span>
            <span className="text-slate-400 block text-[11px]">
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
          <div className="soc-card overflow-hidden border-cyan-900/60">
            <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  Grounded AI Incident Brief &bull; Zero Hallucination Handover
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400 text-[11px]">Status:</span>
                <span className="text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {incident.ai_summary.analyst_status}
                </span>
                <button
                  onClick={handleAcceptSummary}
                  className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded transition-colors"
                >
                  Accept Brief
                </button>
                <button
                  onClick={() => setIsEditingSummary(!isEditingSummary)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              {/* Structured Format as required: WHAT HAPPENED, WHY IT MATTERS, AFFECTED ASSETS, ATTACK STAGE */}
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                  WHAT HAPPENED:
                </span>
                {isEditingSummary ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedSummaryText}
                      onChange={(e) => setEditedSummaryText(e.target.value)}
                      className="w-full h-20 p-2 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded font-sans focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingSummary(false)}
                        className="px-2 py-1 bg-slate-800 text-slate-300 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEditedSummary}
                        className="px-2.5 py-1 bg-cyan-700 text-white rounded font-mono font-semibold"
                      >
                        Save Edited Brief
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-200 leading-relaxed font-sans text-xs">
                    {incident.ai_summary.analyst_edited_summary || incident.ai_summary.what_happened}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                  WHY IT MATTERS:
                </span>
                <p className="text-slate-300 leading-relaxed font-sans text-xs">
                  {incident.ai_summary.why_it_matters}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    AFFECTED ASSETS:
                  </span>
                  <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                    {incident.affected_assets.map((ast) => (
                      <span
                        key={ast}
                        className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700"
                      >
                        {ast}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    VERIFIED ATTACK STAGE &amp; TACTIC:
                  </span>
                  <span className="font-mono text-cyan-400 font-semibold">
                    {incident.ai_summary.attack_stage}
                  </span>
                </div>
              </div>

              {/* Evidence Highlights */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                  TELEMETRY EVIDENCE HIGHLIGHTS:
                </span>
                <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                  {incident.ai_summary.evidence_highlights.map((ev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400 shrink-0">&bull;</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Attack Chain Reconstruction Graph & Timeline (Requirement 7) */}
          <div className="soc-card overflow-hidden">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  Attack Chain Reconstruction &bull; Verified Kill-Chain Progression
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {incident.attack_chain.length} Verified Stage(s)
              </span>
            </div>

            <div className="p-4 space-y-4">
              {incident.attack_chain.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-slate-400">
                  No multi-stage progression detected; isolated event telemetry.
                </div>
              ) : (
                <div className="space-y-3">
                  {incident.attack_chain.map((step, idx) => (
                    <div
                      key={step.stage}
                      className="p-3 rounded bg-slate-900/60 border border-slate-800 relative hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center font-mono text-[10px] font-bold text-cyan-400">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-100">
                            {step.stage}
                          </span>
                          <span className="font-mono text-[11px] text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                            {step.technique_id} &bull; {step.technique_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                          <span>{step.source}</span>
                          <span>{step.timestamp.slice(11, 19)}</span>
                          <span className="text-slate-300 font-semibold">
                            {Math.round(step.confidence * 100)}% Conf
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-slate-300 font-sans pl-7 border-l-2 border-slate-800">
                        {step.evidence}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Deduplication & Collapsed Alerts Inspector (Requirement 5) */}
          <div className="soc-card overflow-hidden">
            <div
              onClick={() => setShowUnderlyingAlerts(!showUnderlyingAlerts)}
              className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  Deduplication Inspector ({incident.total_alerts} Total &bull; {incident.collapsed_summary})
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>{showUnderlyingAlerts ? 'Collapse' : 'Expand & Inspect Telemetry'}</span>
                {showUnderlyingAlerts ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>

            {showUnderlyingAlerts && (
              <div className="p-4 space-y-3">
                <div className="p-3 bg-slate-900/80 rounded border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
                  <span>
                    Workload Saved: {Math.round((incident.total_alerts - incident.deduplicated_alerts_count) * 2.5)} minutes of manual triage fatigue eliminated.
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    {Math.round(((incident.total_alerts - incident.deduplicated_alerts_count) / incident.total_alerts) * 100)}% Alert Reduction
                  </span>
                </div>

                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left soc-table text-xs">
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
                          <td className="font-mono text-cyan-400 text-[11px]">{a.id}</td>
                          <td className="font-mono text-[11px]">{a.source}</td>
                          <td className="max-w-xs truncate">{a.alert_type}</td>
                          <td className="font-mono text-[11px]">{a.host}</td>
                          <td className="font-mono text-[11px] truncate max-w-[140px] text-slate-400">
                            {a.process || a.file_hash || a.domain || 'N/A'}
                          </td>
                          <td className="font-mono text-[10px] text-slate-400">
                            {a.timestamp.slice(11, 19)}
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedAlertForInspection(a)}
                              className="text-cyan-400 hover:underline text-[11px] font-mono"
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
          <div className="soc-card p-4 space-y-3 border-amber-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  AI Recommended Next Steps
                </h4>
              </div>
              <span className="text-[10px] font-mono text-amber-400">PRIORITIZED PLAYBOOK</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Evidence-based tactical actions recommended for the duty analyst:
            </p>

            <div className="space-y-2">
              {incident.recommended_actions.map((step) => (
                <div
                  key={step.priority}
                  className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-amber-950/80 text-amber-400 border border-amber-800 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                      #{step.priority}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{step.action}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-6 leading-tight">{step.rationale}</p>
                  <div className="text-[10px] font-mono text-cyan-400 pl-6 pt-0.5">
                    Target: {step.evidence_pointer}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Risk Score Explanation (Requirement 9) */}
          <div className="soc-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  Dynamic Risk Calculation
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-300 font-bold">
                {incident.risk_score.toFixed(1)} / 100
              </span>
            </div>

            <p className="text-[11px] text-slate-300 font-sans leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800">
              {incident.risk_explanation.explanation}
            </p>

            {/* Factor Breakdown */}
            <div className="space-y-1.5 text-xs font-mono pt-1">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Base Severity:</span>
                <span>{incident.risk_explanation.base_severity_score} pts</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Asset Criticality Multiplier:</span>
                <span className="text-cyan-400">{incident.risk_explanation.asset_criticality_multiplier}x</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Kill-Chain Stage Multiplier:</span>
                <span className="text-cyan-400">{incident.risk_explanation.attack_stage_multiplier}x</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Telemetry Confidence Factor:</span>
                <span>{incident.risk_explanation.confidence_weight}x</span>
              </div>
              {incident.risk_explanation.behavioral_anomaly_boost > 0 && (
                <div className="flex justify-between text-amber-300">
                  <span>Behavioral Anomaly Boost:</span>
                  <span>+{incident.risk_explanation.behavioral_anomaly_boost} pts</span>
                </div>
              )}
            </div>
          </div>

          {/* MITRE ATT&CK Mapping & Management (Requirement 8 & 15) */}
          <div className="soc-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                MITRE ATT&CK Mapping
              </h4>
              <span className="text-[10px] font-mono text-slate-400">ANALYST VERIFIED</span>
            </div>

            <div className="space-y-1.5">
              {incident.mitre_techniques.map((tech) => (
                <div
                  key={tech.technique_id}
                  className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="text-cyan-400 font-bold block">{tech.technique_id}</span>
                    <span className="text-slate-300 text-[11px] font-sans block">{tech.technique_name}</span>
                    <span className="text-slate-400 text-[10px]">{tech.tactic}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveMitre(tech.technique_id)}
                    className="text-slate-400 hover:text-red-400 p-1"
                    title="Remove incorrect technique"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Analyst Investigation Notes */}
          <div className="soc-card p-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
              Analyst Investigation Notes
            </h4>
            <textarea
              value={analystNotes}
              onChange={(e) => setAnalystNotes(e.target.value)}
              placeholder="Record forensic findings, containment timestamps, or rationale for overrides..."
              className="w-full h-20 p-2 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none focus:border-cyan-500 font-sans"
            />
            <button
              onClick={() => handleStatusChange(incident.status)}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono font-medium transition-colors"
            >
              Save Notes to Immutable Audit Trail
            </button>
          </div>
        </div>
      </div>

      {/* Raw Alert Inspection Modal */}
      {selectedAlertForInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-lg shadow-2xl p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-cyan-400 font-bold">ALERT TELEMETRY: {selectedAlertForInspection.id}</span>
              <button
                onClick={() => setSelectedAlertForInspection(null)}
                className="text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="bg-charcoal-950 p-3 rounded border border-slate-800 max-h-80 overflow-y-auto text-[11px] text-slate-300">
              <pre>{JSON.stringify(selectedAlertForInspection, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Risk Override Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-lg shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 font-mono uppercase">
              Manual Risk Score Override
            </h3>
            <p className="text-xs text-slate-400">
              Human-in-the-loop control: adjust calculated score based on operational context.
            </p>
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">New Score:</span>
                <span className="text-cyan-400 font-bold">{riskOverrideScore.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="5"
                max="99"
                step="0.5"
                value={riskOverrideScore}
                onChange={(e) => setRiskOverrideScore(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowRiskModal(false)}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyRiskOverride}
                className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs font-mono font-semibold"
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
