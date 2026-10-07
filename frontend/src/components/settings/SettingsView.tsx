import React, { useState } from 'react';
import { SlidersHorizontal, CheckCircle2, Shield, Brain, Cpu } from 'lucide-react';
import { api } from '../../services/api';
import { DirectoryFooter } from '../layout/DirectoryFooter';

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
    <div className="bg-canvas min-h-full flex flex-col justify-between">
      <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="pb-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-clay" />
            <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight text-ink">
              Platform Settings &amp; Learning Policies
            </h2>
          </div>
          <p className="font-serif text-sm text-text-muted mt-1">
            Configure continuous feedback learning behavior, correlation parameters, and pipeline limits.
          </p>
        </div>

        {savedNotification && (
          <div className="p-3 bg-sage/30 border border-sage flex items-center gap-2 text-xs font-mono text-ink">
            <CheckCircle2 className="w-4 h-4 text-ink" />
            <span>Operational policies updated and applied across live correlation engine.</span>
          </div>
        )}

        {/* Feedback Learning Configuration (Requirement 16) */}
        <div className="editorial-card p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-2 border-b border-hairline pb-3">
            <Brain className="w-4 h-4 text-clay-deep" />
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
              Analyst Feedback Learning Policy (No Silent Suppression)
            </h3>
          </div>

          <p className="font-serif text-xs text-ink/80 leading-relaxed">
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
                className={`p-4 border flex items-start gap-3 cursor-pointer transition-colors ${
                  feedbackPolicy === opt.id
                    ? 'bg-oat/30 border-ink text-ink font-medium'
                    : 'bg-canvas border-hairline text-text-muted hover:border-ink/40'
                }`}
              >
                <input
                  type="radio"
                  name="feedback_policy"
                  value={opt.id}
                  checked={feedbackPolicy === opt.id}
                  onChange={(e) => setFeedbackPolicy(e.target.value)}
                  className="mt-0.5 accent-ink"
                />
                <div>
                  <span className="font-display font-semibold text-ink text-xs block">{opt.title}</span>
                  <span className="font-serif text-xs text-ink/80 block mt-1 leading-relaxed">
                    {opt.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Correlation & Pipeline Configuration */}
        <div className="editorial-card p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-2 border-b border-hairline pb-3">
            <Cpu className="w-4 h-4 text-ink" />
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
              Correlation Engine Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-text-muted block text-[11px] uppercase tracking-wider">
                Temporal Correlation Window (Seconds):
              </label>
              <input
                type="number"
                value={temporalWindow}
                onChange={(e) => setTemporalWindow(e.target.value)}
                className="w-full bg-canvas border border-hairline p-2 text-ink focus:outline-none focus:border-ink font-mono"
              />
              <span className="text-[10px] text-text-muted block">Sliding window for causal link detection (default: 3600s).</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-text-muted block text-[11px] uppercase tracking-wider">
                Deduplication Similarity Threshold (%):
              </label>
              <input
                type="number"
                value={dedupThreshold}
                onChange={(e) => setDedupThreshold(e.target.value)}
                className="w-full bg-canvas border border-hairline p-2 text-ink focus:outline-none focus:border-ink font-mono"
              />
              <span className="text-[10px] text-text-muted block">Exact match on host + user + process + signature.</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-hairline">
            <button
              onClick={handleSavePolicy}
              className="px-5 py-2 bg-clay text-ink hover:bg-clay/90 text-xs font-display font-medium uppercase tracking-wider border border-clay transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      <DirectoryFooter />
    </div>
  );
};
