import React, { useState, useEffect } from 'react';
import { Bell, Search, Filter, Layers, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { NormalizedAlert } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { AssetCriticalityBadge } from '../common/AssetCriticalityBadge';

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
      // Gather all sample alerts
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
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
              Raw Telemetry &amp; Alert Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Heterogeneous security telemetry normalized to canonical enterprise schema.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="soc-card p-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search raw alert messages, hosts, IPs, hashes..."
              className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none"
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

        <div className="text-xs font-mono text-slate-400">
          Showing <span className="text-cyan-400 font-bold">{filtered.length}</span> normalized events
        </div>
      </div>

      {/* Telemetry Table */}
      <div className="soc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left soc-table text-xs">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Source</th>
                <th>Severity</th>
                <th>Detection Rule / Alert Type</th>
                <th>Host &amp; Asset</th>
                <th>Source IP &rarr; Dest IP</th>
                <th>Process / Indicator</th>
                <th>MITRE</th>
                <th>Confidence</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-mono text-xs">
                    Loading telemetry stream...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-mono text-xs">
                    No alerts match current search filter.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40">
                    <td className="font-mono text-cyan-400 text-[11px] font-medium">{a.id}</td>
                    <td className="font-mono text-[11px] text-slate-300">{a.source}</td>
                    <td>
                      <SeverityBadge severity={a.severity} size="sm" />
                    </td>
                    <td className="max-w-xs truncate text-slate-200">{a.alert_type}</td>
                    <td className="font-mono text-[11px]">
                      <span className="text-slate-100 font-medium block">{a.host}</span>
                      <span className="text-slate-400 text-[10px]">{a.asset_criticality}</span>
                    </td>
                    <td className="font-mono text-[11px] text-slate-400">
                      <span>{a.source_ip}</span> &rarr; <span>{a.destination_ip}</span>
                    </td>
                    <td className="font-mono text-[11px] truncate max-w-[120px] text-slate-400">
                      {a.process || a.file_hash || a.domain || 'N/A'}
                    </td>
                    <td className="font-mono text-[11px] text-cyan-400">
                      {a.mitre_technique_id || 'N/A'}
                    </td>
                    <td className="font-mono text-[11px] text-slate-300">
                      {Math.round(a.confidence * 100)}%
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedAlert(a)}
                        className="text-cyan-400 hover:underline font-mono text-[11px]"
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

      {/* Alert JSON Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-lg shadow-2xl p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-cyan-400 font-bold">NORMALIZED TELEMETRY: {selectedAlert.id}</span>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="bg-charcoal-950 p-3 rounded border border-slate-800 max-h-96 overflow-y-auto text-[11px] text-slate-300">
              <pre>{JSON.stringify(selectedAlert, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
