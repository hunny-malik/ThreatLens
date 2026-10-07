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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-ink/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-hairline w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-ink">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-hairline flex items-center gap-3 bg-canvas">
          <Search className="w-5 h-5 text-ink shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Incident ID, IP, Domain, Hash, Host, MITRE technique..."
            className="w-full bg-transparent border-none text-ink placeholder:text-text-muted text-sm focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-text-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-0.5 bg-surface border border-hairline text-text-muted hover:text-ink text-xs font-mono"
          >
            ESC
          </button>
        </div>

        {/* Content / Results */}
        <div className="max-h-96 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="py-6 text-center text-xs font-mono text-text-muted">
              Querying distributed index...
            </div>
          )}

          {!loading && !results && query.length < 2 && (
            <div className="py-8 text-center text-xs text-text-muted font-mono space-y-3">
              <p>Type at least 2 characters to search across 3,000+ alerts, incidents, and assets.</p>
              <div className="flex justify-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-canvas border border-hairline text-ink">
                  Try: CORP-DC-01
                </span>
                <span className="px-2 py-0.5 bg-canvas border border-hairline text-ink">
                  Try: 198.51.100.22
                </span>
                <span className="px-2 py-0.5 bg-canvas border border-hairline text-ink">
                  Try: T1003
                </span>
              </div>
            </div>
          )}

          {!loading && results && results.total_results === 0 && (
            <div className="py-8 text-center text-xs text-text-muted font-mono">
              No matching records found for "{query}".
            </div>
          )}

          {/* Incidents Matches */}
          {results && results.incidents && results.incidents.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-ink" />
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
                    className="w-full text-left p-3 bg-canvas hover:bg-oat/40 border border-hairline flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-ink">
                          {item.incident.id}
                        </span>
                        <SeverityBadge severity={item.incident.severity} size="sm" />
                        <span className="text-xs text-ink font-medium">
                          {item.incident.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-muted mt-1 flex items-center gap-2 font-mono">
                        <span>Asset: {item.incident.primary_asset}</span>
                        <span>&bull;</span>
                        <span className="text-clay-deep">
                          Match: {item.match_reasons.join(', ')}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-ink transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alerts Matches */}
          {results && results.alerts && results.alerts.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-ink" />
                <span>Raw Alert Telemetry ({results.alerts.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.alerts.slice(0, 4).map((a: any) => (
                  <div
                    key={a.id}
                    className="p-2.5 bg-canvas border border-hairline text-xs font-mono flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted">{a.source}</span>
                      <span className="text-ink truncate max-w-sm">{a.raw_message}</span>
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
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-ink" />
                <span>Threat Campaigns ({results.campaigns.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.campaigns.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-2.5 bg-canvas border border-hairline text-xs flex items-center justify-between"
                  >
                    <span className="font-medium text-ink">{c.name}</span>
                    <span className="font-mono text-clay-deep text-xs">{c.threat_actor_alias}</span>
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
