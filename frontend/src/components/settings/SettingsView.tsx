import React, { useState } from 'react';
import { SlidersHorizontal, CheckCircle2, Shield, Brain, Cpu } from 'lucide-react';
import { api } from '../../services/api';

export const SettingsView: React.FC = () => {
  const [feedbackPolicy, setFeedbackPolicy] = useState('REDUCE_PRIORITY');
  const [temporalWindow, setTemporalWindow] = useState('3600');
  const [dedupThreshold, setDedupThreshold] = useState('90');
  const [savedNotification, setSavedNotification] = useState(false);

  const handleSavePolicy = async () => {
    try {
      await fetch('/api/feedback/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy: feedbackPolicy }),
      });
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
            Platform Settings &amp; Learning Policies
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure continuous feedback learning behavior, correlation parameters, and pipeline limits.
        </p>
      </div>

      {savedNotification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded flex items-center gap-2 text-xs font-mono text-emerald-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>Operational policies updated and applied across live correlation engine.</span>
        </div>
      )}

      {/* Feedback Learning Configuration (Requirement 16) */}
      <div className="soc-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Brain className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
            Analyst Feedback Learning Policy (No Silent Suppression)
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          When human analysts repeatedly classify a pattern as false positive, configure how the model adapts future priority.
          Alerts are never silently discarded; instead priority is adjusted transparently.
        </p>

        <div className="space-y-3 font-mono text-xs">
          {[
            {
              id: 'REDUCE_PRIORITY',
              title: 'Reduce Incident Priority (Recommended)',
              desc: 'Downgrades calculated risk score by up to 25 pts while keeping the incident visible in queue.',
            },
            {
              id: 'REQUIRE_REVIEW',
              title: 'Require Mandatory Senior Analyst Review',
              desc: 'Flags the incident with a high historical FP tag and assigns to Senior Analyst queue.',
            },
            {
              id: 'INCREASE_PRIORITY',
              title: 'Preserve Static Baseline Priority',
              desc: 'Maintains default rule scoring regardless of past classification history.',
            },
          ].map((opt) => (
            <label
              key={opt.id}
              className={`p-3 rounded border flex items-start gap-3 cursor-pointer transition-colors ${
                feedbackPolicy === opt.id
                  ? 'bg-cyan-950/40 border-cyan-700/80 text-slate-100'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="feedback_policy"
                value={opt.id}
                checked={feedbackPolicy === opt.id}
                onChange={(e) => setFeedbackPolicy(e.target.value)}
                className="mt-0.5 accent-cyan-500"
              />
              <div>
                <span className="font-semibold text-slate-200 block">{opt.title}</span>
                <span className="text-[11px] text-slate-400 font-sans block mt-0.5">
                  {opt.desc}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Correlation & Pipeline Configuration */}
      <div className="soc-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Cpu className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
            Correlation Engine Parameters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-slate-400 block text-[11px] uppercase">
              Temporal Correlation Window (Seconds):
            </label>
            <input
              type="number"
              value={temporalWindow}
              onChange={(e) => setTemporalWindow(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400">Sliding window for causal link detection (default: 3600s).</span>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 block text-[11px] uppercase">
              Deduplication Similarity Threshold (%):
            </label>
            <input
              type="number"
              value={dedupThreshold}
              onChange={(e) => setDedupThreshold(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400">Exact match on host + user + process + signature.</span>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={handleSavePolicy}
            className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs font-mono font-semibold transition-colors shadow-md"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
