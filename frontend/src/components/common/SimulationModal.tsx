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

    // Visual step progression and streaming counter animation
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-charcoal-900 border border-slate-700 w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-charcoal-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide font-mono">
                ThreatLens Real-Time Stream &amp; Pipeline Engine
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate real-time stream ingestion on the active uploaded dataset or generate test storms
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono uppercase text-slate-400">Stream Source:</span>
            <div className="flex gap-2">
              <button
                disabled={isRunning}
                onClick={() => setStreamSource('CURRENT')}
                className={`px-3 py-1 rounded text-xs font-mono border transition-colors flex items-center gap-1.5 ${
                  streamSource === 'CURRENT'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-semibold'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3 h-3 text-cyan-400" />
                <span>ACTIVE DATASET (3,000 LOGS)</span>
              </button>

              <button
                disabled={isRunning}
                onClick={() => setStreamSource('SYNTHETIC')}
                className={`px-3 py-1 rounded text-xs font-mono border transition-colors flex items-center gap-1.5 ${
                  streamSource === 'SYNTHETIC'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-semibold'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>SYNTHETIC STORM</span>
              </button>
            </div>

            {streamSource === 'SYNTHETIC' && (
              <div className="flex gap-1.5 ml-2">
                {[1000, 3000, 10000].map((v) => (
                  <button
                    key={v}
                    disabled={isRunning}
                    onClick={() => setVolume(v)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                      volume === v
                        ? 'bg-cyan-900 text-cyan-200 border-cyan-600 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
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
            className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 text-xs font-bold font-mono transition-colors shadow-lg shadow-cyan-950/50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>STREAMING LOGS...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>START STREAM</span>
              </>
            )}
          </button>
        </div>

        {/* Live Streaming Progress Meter */}
        {isRunning && (
          <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-400">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Kafka Ingestion Stream:</span>
              <strong className="text-slate-100 font-bold">
                {streamProgressCount.toLocaleString()} / {(streamSource === 'CURRENT' ? 3000 : volume).toLocaleString()} alerts
              </strong>
            </div>
            <span className="text-[11px] text-slate-400">
              Hashing across 8 Kafka partitions &bull; 1,640 eps
            </span>
          </div>
        )}

        {/* Simulation Execution Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Summary Banner after completion */}
          {summary && (
            <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pipeline Execution Complete &bull; Real-time Overview Updated</span>
                </div>
                <span className="text-xs font-mono text-emerald-300">
                  {summary.mttt_reduction_pct}% FASTER TRIAGE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-900/60 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">INGESTED TELEMETRY</span>
                  <span className="text-slate-100 font-bold">{summary.alerts_ingested.toLocaleString()} ALERTS</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">NOISE COLLAPSED</span>
                  <span className="text-emerald-400 font-bold">
                    {summary.collapsed_duplicates.toLocaleString()} ({summary.deduplication_ratio_pct}%)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">INCIDENTS CREATED</span>
                  <span className={`font-bold ${summary.incidents_created > 0 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                    {summary.incidents_created > 0
                      ? `${summary.incidents_created} ACTIONABLE`
                      : '0 (CLEAN BASELINE)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ASSISTED MTTT</span>
                  <span className="text-amber-400 font-bold">
                    {summary.mttt_assisted_minutes} min (vs {summary.mttt_baseline_minutes}m)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 15 Steps List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Pipeline Execution Sequence (15 Stages)
            </h3>

            <div className="space-y-1.5">
              {simulationStepsTemplate.map((step, index) => {
                const isStepActive = isRunning && currentStepIndex === index;
                const isStepDone = currentStepIndex > index || (summary && !isRunning);

                return (
                  <div
                    key={step.step}
                    className={`p-2.5 rounded border transition-colors flex items-center justify-between text-xs font-mono ${
                      isStepActive
                        ? 'bg-cyan-950/60 border-cyan-700 text-cyan-200'
                        : isStepDone
                        ? 'bg-slate-900/40 border-slate-800 text-slate-300'
                        : 'bg-slate-950/40 border-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 text-center">
                        {isStepDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isStepActive ? (
                          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        ) : (
                          <span className="text-slate-400 text-[11px]">{step.step}</span>
                        )}
                      </div>

                      <div>
                        <div className="font-semibold text-slate-200">{step.name}</div>
                        <div className="text-[11px] text-slate-400 font-sans">{step.desc}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isStepDone
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isStepActive
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {isStepDone ? 'COMPLETE' : isStepActive ? 'EXECUTING' : 'PENDING'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-charcoal-950 flex justify-between items-center text-xs font-mono text-slate-400">
          <span>Real-time WebSocket &bull; /ws/stream active &bull; Dynamic UI Sync</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
