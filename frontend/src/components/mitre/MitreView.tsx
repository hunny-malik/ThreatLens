import React, { useState, useEffect } from 'react';
import { Grid, ShieldAlert, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { api } from '../../services/api';
import { DirectoryFooter } from '../layout/DirectoryFooter';

interface MitreViewProps {
  onSelectIncident: (id: string) => void;
}

export const MitreView: React.FC<MitreViewProps> = ({ onSelectIncident }) => {
  const [coverageData, setCoverageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTechnique, setSelectedTechnique] = useState<any>(null);

  useEffect(() => {
    const fetchMitre = async () => {
      setLoading(true);
      try {
        const data = await api.getMitreCoverage();
        setCoverageData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMitre();
  }, []);

  if (loading || !coverageData) {
    return (
      <div className="p-12 text-center text-text-muted font-mono text-xs">
        Loading MITRE ATT&CK enterprise matrix...
      </div>
    );
  }

  return (
    <div className="bg-canvas min-h-full flex flex-col justify-between">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-hairline">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-clay" />
              <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight text-ink">
                MITRE ATT&CK Matrix &amp; Enterprise Coverage
              </h2>
            </div>
            <p className="font-serif text-sm text-text-muted mt-1">
              Active techniques detected across current enterprise telemetry with evidence links.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-surface px-3 py-1.5 border border-hairline">
              <span className="text-text-muted">Active Techniques: </span>
              <span className="text-ink font-bold">{coverageData.total_active_techniques}</span>
            </div>
            <div className="bg-surface px-3 py-1.5 border border-hairline">
              <span className="text-text-muted">Monitored Tactics: </span>
              <span className="text-ink font-bold">{coverageData.total_tactics_monitored}</span>
            </div>
          </div>
        </div>

        {/* MITRE Matrix Columns Visualization */}
        <div className="editorial-card p-5 overflow-x-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 min-w-[960px]">
            {coverageData.tactics_coverage.map((col: any) => (
              <div key={col.tactic} className="space-y-2">
                <div className="p-2.5 bg-canvas border border-hairline text-center">
                  <span className="text-xs font-display font-semibold text-ink block truncate">
                    {col.tactic}
                  </span>
                  <span className="text-[10px] font-mono text-clay-deep">
                    {col.detected_count} Detected
                  </span>
                </div>

                <div className="space-y-1.5">
                  {col.techniques.length === 0 ? (
                    <div className="p-2 text-center text-[10px] font-mono text-text-muted border border-dashed border-hairline">
                      No detections
                    </div>
                  ) : (
                    col.techniques.map((tech: any) => (
                      <button
                        key={tech.technique_id}
                        onClick={() => setSelectedTechnique(tech)}
                        className="w-full text-left p-2.5 bg-canvas hover:bg-oat/40 border border-hairline hover:border-ink/40 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-ink">
                            {tech.technique_id}
                          </span>
                          <span className="text-[10px] font-mono bg-oat px-1.5 py-0.5 border border-hairline text-ink">
                            {tech.incident_count}
                          </span>
                        </div>
                        <span className="text-xs text-ink/80 block truncate font-sans mt-1">
                          {tech.technique_name}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DirectoryFooter />

      {/* Technique Inspection Detail Modal */}
      {selectedTechnique && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-hairline w-full max-w-xl shadow-2xl p-6 space-y-4 text-ink">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <span className="font-display text-base font-semibold text-ink">
                  {selectedTechnique.technique_id} &bull; {selectedTechnique.technique_name}
                </span>
                <span className="text-text-muted block text-xs mt-0.5 font-mono">
                  Tactic: {selectedTechnique.tactic}
                </span>
              </div>
              <button
                onClick={() => setSelectedTechnique(null)}
                className="text-text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-canvas border border-hairline font-mono text-xs space-y-1.5">
                <div className="text-text-muted">
                  Detection Confidence: <span className="text-ink font-bold">{Math.round(selectedTechnique.confidence * 100)}%</span>
                </div>
                <div className="text-text-muted">
                  Telemetry Sources:{' '}
                  <span className="text-ink">{selectedTechnique.evidence_sources.join(', ')}</span>
                </div>
              </div>

              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted block mb-2 font-semibold">
                  Correlated Incidents ({selectedTechnique.incident_ids.length}):
                </span>
                <div className="space-y-2 font-mono">
                  {selectedTechnique.incident_ids.map((incId: string) => (
                    <div
                      key={incId}
                      className="p-3 bg-canvas border border-hairline flex items-center justify-between"
                    >
                      <span className="font-semibold text-ink">{incId}</span>
                      <button
                        onClick={() => {
                          setSelectedTechnique(null);
                          onSelectIncident(incId);
                        }}
                        className="text-clay-deep hover:underline flex items-center gap-1 text-xs font-display font-medium"
                      >
                        <span>Investigate Incident</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
