import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLogEntry } from '../../types';
import { DirectoryFooter } from '../layout/DirectoryFooter';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true);
      try {
        const data = await api.getAuditLogs();
        setLogs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, []);

  const filtered = logs.filter((l) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        l.analyst_name.toLowerCase().includes(q) ||
        (l.incident_id && l.incident_id.toLowerCase().includes(q)) ||
        (l.notes && l.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="bg-canvas min-h-full flex flex-col justify-between">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="pb-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-clay" />
            <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight text-ink">
              Immutable SOC Audit Trail &amp; Human-in-the-Loop Log
            </h2>
          </div>
          <p className="font-serif text-sm text-text-muted mt-1">
            Verifiable audit record of all triage classifications, severity overrides, and human-in-the-loop decisions.
          </p>
        </div>

        <div className="editorial-card p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search action, analyst name, incident ID..."
              className="w-full bg-canvas border border-hairline pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-text-muted focus:outline-none focus:border-ink font-sans"
            />
          </div>

          <span className="text-xs font-mono text-text-muted">
            Total Logged Actions: <strong className="text-ink font-bold">{logs.length}</strong>
          </span>
        </div>

        <div className="editorial-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left editorial-table text-xs">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Timestamp</th>
                  <th>Analyst &amp; Role</th>
                  <th>Target Incident</th>
                  <th>Security Action</th>
                  <th>Previous Value</th>
                  <th>New Value</th>
                  <th>Forensic Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-muted font-mono text-xs">
                      Loading immutable audit records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-muted font-mono text-xs">
                      No audit actions recorded yet. Perform a triage action on an incident to record logs.
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry) => (
                    <tr key={entry.id}>
                      <td className="font-mono text-xs font-semibold text-ink">{entry.id}</td>
                      <td className="font-mono text-text-muted text-xs">
                        {entry.timestamp.slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="font-mono text-xs">
                        <span className="text-ink font-medium block">{entry.analyst_name}</span>
                        <span className="text-text-muted text-[10px]">{entry.analyst_role}</span>
                      </td>
                      <td className="font-mono text-xs text-ink">{entry.incident_id || 'N/A'}</td>
                      <td className="text-ink font-semibold">{entry.action}</td>
                      <td className="font-mono text-text-muted text-xs">{entry.previous_value || 'None'}</td>
                      <td className="font-mono text-ink font-bold text-xs">{entry.new_value || 'N/A'}</td>
                      <td className="font-serif text-ink/80 truncate max-w-xs text-xs">{entry.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DirectoryFooter />
    </div>
  );
};
