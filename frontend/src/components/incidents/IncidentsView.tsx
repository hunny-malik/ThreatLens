import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  UserCheck,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Incident, Severity, IncidentStatus } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { AssetCriticalityBadge } from '../common/AssetCriticalityBadge';
import { RiskScoreGauge } from '../common/RiskScoreGauge';
import { api } from '../../services/api';

interface IncidentsViewProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onRefresh: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onSelectIncident,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'risk' | 'alerts' | 'duration'>('risk');

  // Filter incidents
  const filtered = incidents.filter((inc) => {
    if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
    if (criticalityFilter !== 'ALL' && inc.primary_asset_criticality !== criticalityFilter)
      return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        inc.id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.primary_asset.toLowerCase().includes(q) ||
        inc.users_involved.some((u) => u.toLowerCase().includes(q)) ||
        (inc.campaign_name && inc.campaign_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Sort incidents
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'risk') return b.risk_score - a.risk_score;
    if (sortBy === 'alerts') return b.total_alerts - a.total_alerts;
    if (sortBy === 'duration') return b.duration_minutes - a.duration_minutes;
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === sorted.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sorted.map((i) => i.id));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          api.updateIncidentStatus(id, newStatus, 'Bulk analyst classification action', 'Tier-1 Analyst')
        )
      );
      setBulkFeedback(`Successfully updated ${selectedIds.length} incident(s) to "${newStatus}".`);
      setTimeout(() => setBulkFeedback(null), 4000);
      setSelectedIds([]);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header Title & Summary */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
              Enterprise Incident Triage Queue
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic risk-ranked security incidents correlated across enterprise perimeter telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Total in Queue:</span>
          <span className="font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {incidents.length} INCIDENTS
          </span>
          <span className="text-slate-400">({filtered.length} matching)</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="soc-card p-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by Incident ID, Title, Asset, User, Campaign..."
              className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Asset Criticality Filter */}
          <select
            value={criticalityFilter}
            onChange={(e) => setCriticalityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none"
          >
            <option value="ALL">All Asset Criticalities</option>
            <option value="CRITICAL">Tier-0 Critical (DC/Prod)</option>
            <option value="HIGH">High Criticality</option>
            <option value="MEDIUM">Medium Criticality</option>
            <option value="LOW">Low (Test/Dev)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Needs Investigation">Needs Investigation</option>
            <option value="In Progress">In Progress</option>
            <option value="True Positive">True Positive</option>
            <option value="False Positive">False Positive</option>
            <option value="Benign">Benign</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Sort by:</span>
          <div className="flex border border-slate-800 rounded bg-slate-900 text-xs font-mono">
            <button
              onClick={() => setSortBy('risk')}
              className={`px-2.5 py-1 rounded-l transition-colors ${
                sortBy === 'risk' ? 'bg-cyan-950 text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              Risk Score
            </button>
            <button
              onClick={() => setSortBy('alerts')}
              className={`px-2.5 py-1 transition-colors ${
                sortBy === 'alerts' ? 'bg-cyan-950 text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              Alerts
            </button>
            <button
              onClick={() => setSortBy('duration')}
              className={`px-2.5 py-1 rounded-r transition-colors ${
                sortBy === 'duration' ? 'bg-cyan-950 text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              Duration
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Feedback Banner */}
      {bulkFeedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded flex items-center justify-between text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{bulkFeedback}</span>
          </div>
          <button onClick={() => setBulkFeedback(null)} className="text-slate-400 hover:text-white">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bulk Action Bar (when items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-2.5 bg-slate-900/90 border border-cyan-800/80 rounded flex items-center justify-between text-xs font-mono flex-wrap gap-2">
          <span className="text-cyan-400 font-semibold">
            {selectedIds.length} incident(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-1 bg-slate-800 text-slate-300 hover:text-white rounded"
            >
              Clear Selection
            </button>
            <button
              onClick={() => handleBulkStatusChange('False Positive')}
              disabled={bulkProcessing}
              className="px-2.5 py-1 bg-amber-950 text-amber-300 hover:bg-amber-900 border border-amber-800 rounded transition-colors font-medium"
            >
              Mark False Positive
            </button>
            <button
              onClick={() => handleBulkStatusChange('True Positive')}
              disabled={bulkProcessing}
              className="px-2.5 py-1 bg-red-950 text-red-300 hover:bg-red-900 border border-red-800 rounded transition-colors font-medium"
            >
              Mark True Positive
            </button>
            <button
              onClick={() => handleBulkStatusChange('Escalated')}
              disabled={bulkProcessing}
              className="px-2.5 py-1 bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 rounded transition-colors font-medium"
            >
              Escalate to Tier-2
            </button>
          </div>
        </div>
      )}

      {/* Enterprise Incident Table */}
      <div className="soc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left soc-table">
            <thead>
              <tr>
                <th className="w-8">
                  <input
                    type="checkbox"
                    checked={sorted.length > 0 && selectedIds.length === sorted.length}
                    onChange={toggleSelectAll}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                </th>
                <th>Priority &amp; ID</th>
                <th>Risk Score</th>
                <th>Severity</th>
                <th>Incident Title</th>
                <th>Target Asset</th>
                <th>MITRE Tactics</th>
                <th>Collapsed</th>
                <th>Age / Duration</th>
                <th>Status</th>
                <th>Assigned Analyst</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-mono text-xs">
                    No incidents match current filter criteria.
                  </td>
                </tr>
              ) : (
                sorted.map((inc, index) => {
                  const isChecked = selectedIds.includes(inc.id);
                  return (
                    <tr
                      key={inc.id}
                      onClick={() => onSelectIncident(inc.id)}
                      className={`cursor-pointer transition-colors ${
                        isChecked ? 'bg-slate-800/60' : ''
                      }`}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelect(inc.id, e as any)}
                          className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                        />
                      </td>

                      <td className="font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-bold w-4">#{index + 1}</span>
                          <span className="text-cyan-400 font-semibold">{inc.id}</span>
                        </div>
                      </td>

                      <td>
                        <RiskScoreGauge score={inc.risk_score} size="sm" />
                      </td>

                      <td>
                        <SeverityBadge severity={inc.severity} size="sm" />
                      </td>

                      <td>
                        <div className="max-w-sm">
                          <span className="font-medium text-slate-100 block truncate">
                            {inc.title}
                          </span>
                          {inc.campaign_name && (
                            <span className="text-[10px] font-mono text-rose-400 bg-rose-950/40 px-1.5 py-0.2 rounded border border-rose-900/60 inline-block mt-0.5">
                              {inc.campaign_name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <AssetCriticalityBadge
                          criticality={inc.primary_asset_criticality}
                          assetType={inc.primary_asset}
                        />
                      </td>

                      <td>
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {inc.attack_chain.slice(0, 2).map((s) => (
                            <span
                              key={s.stage}
                              className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1 py-0.2 rounded border border-slate-700"
                            >
                              {s.stage}
                            </span>
                          ))}
                          {inc.attack_chain.length > 2 && (
                            <span className="text-[10px] font-mono text-slate-400">
                              +{inc.attack_chain.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="font-mono text-xs">
                        <span className="text-emerald-400 font-medium">
                          {inc.collapsed_summary.split(' ')[0]}
                        </span>
                        <span className="text-slate-400 text-[10px] block">collapsed</span>
                      </td>

                      <td className="font-mono text-[11px] text-slate-400">
                        {inc.duration_minutes}m active
                      </td>

                      <td>
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                            inc.status === 'Needs Investigation'
                              ? 'bg-amber-950/50 text-amber-300 border-amber-800/80'
                              : inc.status === 'In Progress'
                              ? 'bg-cyan-950/50 text-cyan-300 border-cyan-800/80'
                              : inc.status === 'Escalated'
                              ? 'bg-rose-950/50 text-rose-300 border-rose-800/80'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>

                      <td className="text-xs text-slate-300 font-mono">
                        {inc.assigned_analyst || 'Unassigned'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
