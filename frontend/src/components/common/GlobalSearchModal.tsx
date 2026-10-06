import React, { useState, useEffect } from 'react';
import { Search, X, ShieldAlert, Bell, Crosshair, Server, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { SeverityBadge } from './SeverityBadge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIncident: (incidentId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectIncident,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await api.search(query);
          setResults(res);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults(null);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-3 bg-charcoal-950">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Incident ID, IP, Domain, Hash, Host, MITRE technique..."
            className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-slate-200 rounded text-xs font-mono"
          >
            ESC
          </button>
        </div>

        {/* Content / Results */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-6 text-center text-xs font-mono text-slate-400">
              Querying distributed index...
            </div>
          )}

          {!loading && !results && query.length < 2 && (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              Type at least 2 characters to search across 3,000+ alerts, incidents, and assets.
              <div className="flex justify-center gap-2 mt-3">
                <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-400">
                  Try: CORP-DC-01
                </span>
                <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-400">
                  Try: 198.51.100.22
                </span>
                <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-400">
                  Try: T1003
                </span>
              </div>
            </div>
          )}

          {!loading && results && results.total_results === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              No matching records found for "{query}".
            </div>
          )}

          {/* Incidents Matches */}
          {results && results.incidents && results.incidents.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-red-400" />
                <span>Correlated Incidents ({results.incidents.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.incidents.map((item: any) => (
                  <button
                    key={item.incident.id}
                    onClick={() => {
                      onSelectIncident(item.incident.id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-cyan-400">
                          {item.incident.id}
                        </span>
                        <SeverityBadge severity={item.incident.severity} size="sm" />
                        <span className="text-xs text-slate-200 font-medium">
                          {item.incident.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Asset: {item.incident.primary_asset}</span>
                        <span>•</span>
                        <span className="text-cyan-300">
                          Match: {item.match_reasons.join(', ')}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alerts Matches */}
          {results && results.alerts && results.alerts.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                <Bell className="w-3 h-3 text-amber-400" />
                <span>Raw Alert Telemetry ({results.alerts.length})</span>
              </div>
              <div className="space-y-1">
                {results.alerts.slice(0, 4).map((a: any) => (
                  <div
                    key={a.id}
                    className="p-2 rounded bg-slate-950/60 border border-slate-800 text-xs font-mono flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{a.source}</span>
                      <span className="text-slate-300 truncate max-w-sm">{a.raw_message}</span>
                    </div>
                    <SeverityBadge severity={a.severity} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaigns */}
          {results && results.campaigns && results.campaigns.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                <Crosshair className="w-3 h-3 text-cyan-400" />
                <span>Threat Campaigns ({results.campaigns.length})</span>
              </div>
              <div className="space-y-1">
                {results.campaigns.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-2 rounded bg-slate-800/40 border border-slate-700 text-xs flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-200">{c.name}</span>
                    <span className="font-mono text-cyan-400 text-[11px]">{c.threat_actor_alias}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
