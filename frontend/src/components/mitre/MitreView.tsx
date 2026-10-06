import React, { useState, useEffect } from 'react';
import { Grid, ShieldAlert, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { api } from '../../services/api';

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
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Loading MITRE ATT&CK enterprise matrix...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
              MITRE ATT&CK Matrix &amp; Enterprise Coverage
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Active techniques detected across current enterprise telemetry with evidence links.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400">Active Techniques: </span>
            <span className="text-cyan-400 font-bold">{coverageData.total_active_techniques}</span>
          </div>
          <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-400">Monitored Tactics: </span>
            <span className="text-emerald-400 font-bold">{coverageData.total_tactics_monitored}</span>
          </div>
        </div>
      </div>

      {/* MITRE Matrix Columns Visualization */}
      <div className="soc-card p-4 overflow-x-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 min-w-[960px]">
          {coverageData.tactics_coverage.map((col: any) => (
            <div key={col.tactic} className="space-y-2">
              <div className="p-2 bg-charcoal-950 rounded border border-slate-800 text-center">
                <span className="text-[11px] font-mono font-bold text-slate-200 block truncate">
                  {col.tactic}
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {col.detected_count} Detected
                </span>
              </div>

              <div className="space-y-1.5">
                {col.techniques.length === 0 ? (
                  <div className="p-2 text-center text-[10px] font-mono text-slate-400 border border-slate-900 rounded">
                    No detections
                  </div>
                ) : (
                  col.techniques.map((tech: any) => (
                    <button
                      key={tech.technique_id}
                      onClick={() => setSelectedTechnique(tech)}
                      className="w-full text-left p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-600/80 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-cyan-400">
                          {tech.technique_id}
                        </span>
                        <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 px-1 rounded">
                          {tech.incident_count}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-300 block truncate font-sans mt-0.5">
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

      {/* Technique Inspection Detail Modal */}
      {selectedTechnique && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-lg shadow-2xl p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="text-cyan-400 font-bold text-sm">
                  {selectedTechnique.technique_id} &bull; {selectedTechnique.technique_name}
                </span>
                <span className="text-slate-400 block text-[11px] mt-0.5">
                  Tactic: {selectedTechnique.tactic}
                </span>
              </div>
              <button
                onClick={() => setSelectedTechnique(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-slate-400">
                  Detection Confidence: <span className="text-emerald-400 font-bold">{Math.round(selectedTechnique.confidence * 100)}%</span>
                </div>
                <div className="text-slate-400">
                  Telemetry Sources:{' '}
                  <span className="text-slate-200">{selectedTechnique.evidence_sources.join(', ')}</span>
                </div>
              </div>

              <div>
                <span className="font-mono text-[11px] uppercase text-slate-400 block mb-1">
                  Correlated Incidents ({selectedTechnique.incident_ids.length}):
                </span>
                <div className="space-y-1.5 font-mono">
                  {selectedTechnique.incident_ids.map((incId: string) => (
                    <div
                      key={incId}
                      className="p-2 bg-slate-800/60 rounded border border-slate-700 flex items-center justify-between"
                    >
                      <span className="text-cyan-400 font-semibold">{incId}</span>
                      <button
                        onClick={() => {
                          setSelectedTechnique(null);
                          onSelectIncident(incId);
                        }}
                        className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px]"
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
