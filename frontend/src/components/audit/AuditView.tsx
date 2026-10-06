import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLogEntry } from '../../types';

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
            Immutable SOC Audit Trail &amp; Human-in-the-Loop Log
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Verifiable audit record of all triage classifications, severity overrides, and human-in-the-loop decisions.
        </p>
      </div>

      <div className="soc-card p-3 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, analyst name, incident ID..."
            className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <span className="text-xs font-mono text-slate-400">
          Total Logged Actions: <strong className="text-cyan-400">{logs.length}</strong>
        </span>
      </div>

      <div className="soc-card overflow-hidden">
        <table className="w-full text-left soc-table text-xs">
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
                <td colSpan={8} className="py-8 text-center text-slate-400 font-mono text-xs">
                  Loading immutable audit records...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-mono text-xs">
                  No audit actions recorded yet. Perform a triage action on an incident to record logs.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.id}>
                  <td className="font-mono text-cyan-400 text-[11px]">{entry.id}</td>
                  <td className="font-mono text-slate-400 text-[11px]">
                    {entry.timestamp.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="font-mono">
                    <span className="text-slate-200 font-medium block">{entry.analyst_name}</span>
                    <span className="text-slate-400 text-[10px]">{entry.analyst_role}</span>
                  </td>
                  <td className="font-mono text-cyan-400">{entry.incident_id || 'N/A'}</td>
                  <td className="text-slate-100 font-semibold">{entry.action}</td>
                  <td className="font-mono text-slate-400">{entry.previous_value || 'None'}</td>
                  <td className="font-mono text-emerald-400 font-bold">{entry.new_value || 'N/A'}</td>
                  <td className="text-slate-300 font-sans truncate max-w-xs">{entry.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
