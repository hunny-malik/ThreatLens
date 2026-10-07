import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  Loader2,
  ArrowRight,
  X,
  Cpu,
  Activity,
  BarChart2,
  Layers,
  Radio,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulationCompleted: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onSimulationCompleted,
}) => {
  const [streamSource, setStreamSource] = useState<'CURRENT' | 'SYNTHETIC'>('CURRENT');
  const [volume, setVolume] = useState(3000);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [streamProgressCount, setStreamProgressCount] = useState(0);
  const [steps, setSteps] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const simulationStepsTemplate = [
    { step: 1, name: 'Raw Telemetry Ingestion', desc: 'Simulating multi-source stream: EDR, Firewall, WinEvents, Zeek' },
    { step: 2, name: 'Kafka Partition Routing', desc: 'Publishing across 8 Kafka partitions with hash routing' },
    { step: 3, name: 'Schema Normalization', desc: 'Converting heterogeneous logs to canonical NormalizedAlert schema' },
    { step: 4, name: 'Intelligent Deduplication', desc: 'Clustering repetitive noise (collapsing ~90%+ redundant alerts)' },
    { step: 5, name: 'Multi-Attack Disentanglement', desc: 'Separating simultaneous independent attack chains' },
    { step: 6, name: 'Cross-Source Graph Correlation', desc: 'Correlating IP, host, user, process ancestry & timing' },
    { step: 7, name: 'Kill-Chain Reconstruction', desc: 'Reconstructing verified phases: Initial Access -> Exfiltration' },
    { step: 8, name: 'MITRE ATT&CK Mapping', desc: 'Tagging detected techniques with confidence & evidence' },
    { step: 9, name: 'Asset Criticality Risk Scoring', desc: 'Weighting Domain Controller (1.45x) vs Test Machine (0.52x)' },
    { step: 10, name: 'Behavioral Anomaly Detection', desc: 'Flagging off-hours activity, rare processes & exfil bursts' },
    { step: 11, name: 'Grounded AI Incident Briefs', desc: 'Synthesizing factual shift-handover summaries without hallucination' },
    { step: 12, name: 'Evidence-Based Next Steps', desc: 'Formulating prioritized tactical investigation actions' },
    { step: 13, name: 'Dynamic Queue Prioritization', desc: 'Ranking actionable incidents for Tier-1 duty analyst' },
    { step: 14, name: 'Human-in-the-Loop Readiness', desc: 'Enabling analyst overrides and feedback learning' },
    { step: 15, name: 'Verifiable MTTT Measurement', desc: 'Calculating Mean Time To Triage reduction in active environment' },
  ];

  const handleStartSimulation = async () => {
    setIsRunning(true);
    setSummary(null);
    setCurrentStepIndex(0);
    setStreamProgressCount(0);

    const targetVolume = streamSource === 'CURRENT' ? 3000 : volume;

    const stepDuration = 140;
    const tickerInterval = setInterval(() => {
      setStreamProgressCount((prev) => {
        const next = prev + Math.floor(targetVolume / 18);
        return next > targetVolume ? targetVolume : next;
      });
    }, 110);

    for (let i = 0; i < simulationStepsTemplate.length; i++) {
      setCurrentStepIndex(i);
      await new Promise((r) => setTimeout(r, stepDuration));
    }
    clearInterval(tickerInterval);
    setStreamProgressCount(targetVolume);

    try {
      const res = await api.runSimulation(volume, streamSource === 'CURRENT');
      setSteps(res.simulation_steps || []);
      setSummary(res.simulation_summary);
      setCurrentStepIndex(15);
      onSimulationCompleted();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-hairline w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-canvas">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-oat border border-hairline flex items-center justify-center text-ink">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
                ThreatLens Real-Time Stream &amp; Pipeline Engine
              </h2>
              <p className="text-xs text-text-muted mt-0.5 font-sans">
                Simulate real-time stream ingestion on the active uploaded dataset or generate test storm telemetry
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="px-6 py-3.5 bg-surface border-b border-hairline flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Source:</span>
            <div className="flex gap-2">
              <button
                disabled={isRunning}
                onClick={() => setStreamSource('CURRENT')}
                className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border transition-colors flex items-center gap-1.5 ${
                  streamSource === 'CURRENT'
                    ? 'bg-clay text-ink font-semibold border-clay'
                    : 'bg-canvas text-ink/70 border-hairline hover:bg-oat/50'
                }`}
              >
                <Radio className="w-3 h-3 text-ink" />
                <span>Active Dataset</span>
              </button>

              <button
                disabled={isRunning}
                onClick={() => setStreamSource('SYNTHETIC')}
                className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border transition-colors flex items-center gap-1.5 ${
                  streamSource === 'SYNTHETIC'
                    ? 'bg-clay text-ink font-semibold border-clay'
                    : 'bg-canvas text-ink/70 border-hairline hover:bg-oat/50'
                }`}
              >
                <Layers className="w-3 h-3 text-ink" />
                <span>Synthetic Storm</span>
              </button>
            </div>

            {streamSource === 'SYNTHETIC' && (
              <div className="flex gap-1.5 ml-2">
                {[1000, 3000, 10000].map((v) => (
                  <button
                    key={v}
                    disabled={isRunning}
                    onClick={() => setVolume(v)}
                    className={`px-2.5 py-0.5 text-xs font-mono border transition-colors ${
                      volume === v
                        ? 'bg-oat text-ink border-hairline font-bold'
                        : 'bg-canvas text-text-muted border-hairline hover:text-ink'
                    }`}
                  >
                    {v.toLocaleString()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleStartSimulation}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-clay text-ink hover:bg-clay/90 disabled:opacity-50 text-xs font-display font-medium uppercase tracking-wider border border-clay transition-colors"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-ink" />
                <span>Streaming Logs...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-ink" />
                <span>Start Stream</span>
              </>
            )}
          </button>
        </div>

        {/* Live Streaming Progress Meter */}
        {isRunning && (
          <div className="px-6 py-3 bg-canvas border-b border-hairline flex items-center justify-between text-xs font-mono text-ink">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-clay-deep animate-pulse" />
              <span>Kafka Ingestion Stream:</span>
              <strong className="font-bold">
                {streamProgressCount.toLocaleString()} / {(streamSource === 'CURRENT' ? 3000 : volume).toLocaleString()} alerts
              </strong>
            </div>
            <span className="text-[11px] text-text-muted">
              Hashing across 8 Kafka partitions &bull; ~1,640 eps
            </span>
          </div>
        )}

        {/* Simulation Execution Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Summary Banner after completion */}
          {summary && (
            <div className="p-4 bg-sage/20 border border-sage space-y-3 text-ink">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase">
                  <CheckCircle2 className="w-4 h-4 text-ink" />
                  <span>Pipeline Execution Complete &bull; Real-time Overview Updated</span>
                </div>
                <span className="text-xs font-mono font-semibold">
                  {summary.mttt_reduction_pct}% FASTER TRIAGE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-hairline text-xs font-mono">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase">Ingested Telemetry</span>
                  <span className="font-semibold text-ink">{summary.alerts_ingested.toLocaleString()} Alerts</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase">Noise Collapsed</span>
                  <span className="font-semibold text-ink">
                    {summary.collapsed_duplicates.toLocaleString()} ({summary.deduplication_ratio_pct}%)
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase">Incidents Created</span>
                  <span className="font-semibold text-ink">
                    {summary.incidents_created > 0
                      ? `${summary.incidents_created} Actionable`
                      : '0 (Clean Baseline)'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase">Assisted MTTT</span>
                  <span className="font-semibold text-ink">
                    {summary.mttt_assisted_minutes} min (vs {summary.mttt_baseline_minutes}m)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 15 Steps List */}
          <div className="space-y-2">
            <h3 className="font-display text-xs font-semibold text-ink uppercase tracking-wider">
              Pipeline Execution Sequence (15 Stages)
            </h3>

            <div className="space-y-1.5">
              {simulationStepsTemplate.map((step, index) => {
                const isStepActive = isRunning && currentStepIndex === index;
                const isStepDone = currentStepIndex > index || (summary && !isRunning);

                return (
                  <div
                    key={step.step}
                    className={`p-3 border transition-colors flex items-center justify-between text-xs font-mono ${
                      isStepActive
                        ? 'bg-oat/50 border-hairline text-ink'
                        : isStepDone
                        ? 'bg-surface border-hairline text-ink'
                        : 'bg-canvas border-hairline text-text-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 text-center">
                        {isStepDone ? (
                          <CheckCircle2 className="w-4 h-4 text-ink" />
                        ) : isStepActive ? (
                          <Loader2 className="w-4 h-4 text-clay-deep animate-spin" />
                        ) : (
                          <span className="text-text-muted text-[11px]">{step.step}</span>
                        )}
                      </div>

                      <div>
                        <div className="font-semibold text-ink">{step.name}</div>
                        <div className="text-[11px] text-text-muted font-sans">{step.desc}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 font-mono uppercase tracking-wider border ${
                        isStepDone
                          ? 'bg-sage/40 text-ink border-sage font-medium'
                          : isStepActive
                          ? 'bg-clay text-ink border-clay font-semibold'
                          : 'bg-canvas text-text-muted border-hairline'
                      }`}
                    >
                      {isStepDone ? 'Complete' : isStepActive ? 'Executing' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-hairline bg-canvas flex justify-between items-center text-xs font-mono text-text-muted">
          <span>Real-time WebSocket &bull; /ws/stream active &bull; Dynamic UI Sync</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-surface hover:bg-oat/50 text-ink border border-hairline text-xs font-display"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
