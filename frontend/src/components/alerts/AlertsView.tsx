import React, { useState, useEffect } from 'react';
import { Bell, Search, Filter, Layers, ExternalLink, RefreshCw, X } from 'lucide-react';
import { api } from '../../services/api';
import { NormalizedAlert } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { AssetCriticalityBadge } from '../common/AssetCriticalityBadge';
import { DirectoryFooter } from '../layout/DirectoryFooter';

export const AlertsView: React.FC = () => {
  const [alerts, setAlerts] = useState<NormalizedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState<NormalizedAlert | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents();
      const all: NormalizedAlert[] = [];
      data.forEach((inc) => {
        if (inc.sample_alerts) all.push(...inc.sample_alerts);
      });
      setAlerts(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filtered = alerts.filter((a) => {
    if (sourceFilter !== 'ALL' && a.source !== sourceFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        a.id.toLowerCase().includes(q) ||
        a.alert_type.toLowerCase().includes(q) ||
        a.host.toLowerCase().includes(q) ||
        a.source_ip.toLowerCase().includes(q) ||
        a.raw_message.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="bg-canvas min-h-full flex flex-col justify-between">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-hairline">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-clay" />
              <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight text-ink">
                Raw Telemetry &amp; Alert Stream
              </h2>
            </div>
            <p className="font-serif text-sm text-text-muted mt-1">
              Heterogeneous security telemetry normalized to canonical enterprise schema.
            </p>
          </div>

          <button
            onClick={fetchAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-oat/50 text-ink border border-hairline text-xs font-display transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="editorial-card p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[240px] flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search raw alert messages, hosts, IPs, hashes..."
                className="w-full bg-canvas border border-hairline pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-text-muted focus:outline-none focus:border-ink font-sans"
              />
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-canvas border border-hairline text-ink text-xs px-3 py-1.5 font-mono focus:outline-none"
            >
              <option value="ALL">All Sources</option>
              <option value="EDR">EDR</option>
              <option value="Firewall">Firewall</option>
              <option value="Windows Event Logs">Windows Event Logs</option>
              <option value="Linux Logs">Linux Logs</option>
              <option value="Authentication Systems">Authentication Systems</option>
              <option value="Network Monitoring">Network Monitoring (Zeek)</option>
              <option value="Application Logs">Application Logs</option>
            </select>
          </div>

          <div className="text-xs font-mono text-text-muted">
            Showing <span className="font-bold text-ink">{filtered.length}</span> normalized events
          </div>
        </div>

        {/* Telemetry Table */}
        <div className="editorial-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left editorial-table text-xs">
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Source</th>
                  <th>Severity</th>
                  <th>Detection Rule / Type</th>
                  <th>Host &amp; Asset</th>
                  <th>Source &rarr; Dest IP</th>
                  <th>Process / Indicator</th>
                  <th>MITRE</th>
                  <th>Confidence</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-text-muted font-mono text-xs">
                      Loading telemetry stream...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-text-muted font-mono text-xs">
                      No alerts match current search filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id}>
                      <td className="font-mono text-xs font-semibold text-ink">{a.id}</td>
                      <td className="font-mono text-xs text-text-muted">{a.source}</td>
                      <td>
                        <SeverityBadge severity={a.severity} size="sm" />
                      </td>
                      <td className="max-w-xs truncate font-medium text-ink">{a.alert_type}</td>
                      <td className="font-mono text-xs">
                        <span className="font-medium text-ink block">{a.host}</span>
                        <span className="text-text-muted text-[10px]">{a.asset_criticality}</span>
                      </td>
                      <td className="font-mono text-xs text-text-muted">
                        <span>{a.source_ip}</span> &rarr; <span>{a.destination_ip}</span>
                      </td>
                      <td className="font-mono text-xs truncate max-w-[120px] text-text-muted">
                        {a.process || a.file_hash || a.domain || 'N/A'}
                      </td>
                      <td className="font-mono text-xs text-clay-deep">
                        {a.mitre_technique_id || 'N/A'}
                      </td>
                      <td className="font-mono text-xs font-semibold text-ink">
                        {Math.round(a.confidence * 100)}%
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedAlert(a)}
                          className="text-clay-deep hover:underline font-mono text-xs"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DirectoryFooter />

      {/* Alert JSON Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-hairline w-full max-w-2xl shadow-2xl p-6 space-y-4 font-mono text-xs text-ink">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <span className="font-bold text-ink">NORMALIZED TELEMETRY: {selectedAlert.id}</span>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-text-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-canvas p-4 border border-hairline max-h-96 overflow-y-auto text-xs text-ink">
              <pre>{JSON.stringify(selectedAlert, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
