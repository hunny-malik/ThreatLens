import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ChevronRight,
  Database,
} from 'lucide-react';
import { Incident, Severity, IncidentStatus } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { AssetCriticalityBadge } from '../common/AssetCriticalityBadge';
import { RiskScoreGauge } from '../common/RiskScoreGauge';
import { DirectoryFooter } from '../layout/DirectoryFooter';
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
    <div className="w-full font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header Title & Summary */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-hairline pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-clay" />
              <h2 className="text-xl font-bold text-ink uppercase tracking-tight font-sans">
                Enterprise Incident Triage Queue
              </h2>
            </div>
            <p className="font-serif text-sm text-text-muted mt-1">
              Disentangled attack campaigns prioritized by asset criticality and MITRE kill-chain progression.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-text-muted">Total in Queue:</span>
            <span className="font-bold text-ink bg-oat px-2.5 py-1 rounded-md border border-hairline">
              {incidents.length} INCIDENTS
            </span>
            <span className="text-text-muted">({filtered.length} matching)</span>
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="bg-surface border border-hairline rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4 shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by Incident ID, Title, Asset, User, Campaign..."
                className="w-full bg-canvas border border-hairline rounded-lg pl-9 pr-3 py-2 text-xs text-ink placeholder-text-muted focus:outline-none focus:border-ink transition-colors"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-canvas border border-hairline text-ink text-xs rounded-lg px-3 py-2 font-mono focus:outline-none"
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
              className="bg-canvas border border-hairline text-ink text-xs rounded-lg px-3 py-2 font-mono focus:outline-none"
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
              className="bg-canvas border border-hairline text-ink text-xs rounded-lg px-3 py-2 font-mono focus:outline-none"
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
            <span className="text-[11px] font-mono text-text-muted">Sort by:</span>
            <div className="flex border border-hairline rounded-lg overflow-hidden bg-canvas text-xs font-mono">
              <button
                onClick={() => setSortBy('risk')}
                className={`px-3 py-1.5 transition-colors ${
                  sortBy === 'risk' ? 'bg-oat text-ink font-bold' : 'text-text-muted hover:text-ink'
                }`}
              >
                Risk Score
              </button>
              <button
                onClick={() => setSortBy('alerts')}
                className={`px-3 py-1.5 border-l border-hairline transition-colors ${
                  sortBy === 'alerts' ? 'bg-oat text-ink font-bold' : 'text-text-muted hover:text-ink'
                }`}
              >
                Alerts
              </button>
              <button
                onClick={() => setSortBy('duration')}
                className={`px-3 py-1.5 border-l border-hairline transition-colors ${
                  sortBy === 'duration' ? 'bg-oat text-ink font-bold' : 'text-text-muted hover:text-ink'
                }`}
              >
                Duration
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Feedback Banner */}
        {bulkFeedback && (
          <div className="p-3.5 bg-oat border border-hairline rounded-xl flex items-center justify-between text-xs font-mono text-ink">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-clay" />
              <span>{bulkFeedback}</span>
            </div>
            <button onClick={() => setBulkFeedback(null)} className="text-text-muted hover:text-ink">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bulk Action Bar (when items selected) */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-oat border border-hairline rounded-xl flex items-center justify-between text-xs font-mono flex-wrap gap-2">
            <span className="text-ink font-semibold">
              {selectedIds.length} incident(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1 bg-surface text-ink hover:bg-canvas rounded border border-hairline"
              >
                Clear Selection
              </button>
              <button
                onClick={() => handleBulkStatusChange('False Positive')}
                disabled={bulkProcessing}
                className="px-3 py-1 bg-surface hover:bg-canvas text-ink border border-hairline rounded transition-colors font-medium"
              >
                Mark False Positive
              </button>
              <button
                onClick={() => handleBulkStatusChange('True Positive')}
                disabled={bulkProcessing}
                className="px-3 py-1 bg-clay hover:bg-[#cf6f4f] text-ink rounded transition-colors font-semibold shadow-xs"
              >
                Mark True Positive
              </button>
              <button
                onClick={() => handleBulkStatusChange('Escalated')}
                disabled={bulkProcessing}
                className="px-3 py-1 bg-clay-deep text-surface hover:bg-[#8f3e27] rounded transition-colors font-medium shadow-xs"
              >
                Escalate to Tier-2
              </button>
            </div>
          </div>
        )}

        {/* Enterprise Incident Table */}
        <div className="bg-surface border border-hairline rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input
                      type="checkbox"
                      checked={sorted.length > 0 && selectedIds.length === sorted.length}
                      onChange={toggleSelectAll}
                      className="rounded bg-canvas border-hairline text-clay focus:ring-0"
                    />
                  </th>
                  <th>Priority &amp; ID</th>
                  <th>Risk Score</th>
                  <th>Severity</th>
                  <th>Incident Title</th>
                  <th>Target Asset</th>
                  <th>MITRE Tactics</th>
                  <th>Collapsed</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Assigned</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-text-muted font-serif text-sm">
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
                          isChecked ? 'bg-oat/60' : ''
                        }`}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => toggleSelect(inc.id, e as any)}
                            className="rounded bg-canvas border-hairline text-clay focus:ring-0"
                          />
                        </td>

                        <td className="font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-text-muted font-bold w-4">#{index + 1}</span>
                            <span className="text-ink font-semibold">{inc.id}</span>
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
                            <span className="font-medium text-ink block truncate font-sans text-xs">
                              {inc.title}
                            </span>
                            {inc.campaign_name && (
                              <span className="text-[10px] font-mono text-clay-deep bg-oat px-2 py-0.5 rounded-full border border-hairline inline-block mt-0.5">
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
                                className="text-[10px] font-mono bg-canvas text-ink px-1.5 py-0.5 rounded border border-hairline"
                              >
                                {s.stage}
                              </span>
                            ))}
                            {inc.attack_chain.length > 2 && (
                              <span className="text-[10px] font-mono text-text-muted">
                                +{inc.attack_chain.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="font-mono text-xs">
                          <span className="text-clay-deep font-semibold">
                            {inc.collapsed_summary.split(' ')[0]}
                          </span>
                          <span className="text-text-muted text-[10px] block font-serif">collapsed</span>
                        </td>

                        <td className="font-mono text-[11px] text-text-muted">
                          {inc.duration_minutes}m active
                        </td>

                        <td>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border bg-canvas text-ink border-hairline">
                            {inc.status}
                          </span>
                        </td>

                        <td className="text-xs text-text-muted font-mono">
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

      <DirectoryFooter />
    </div>
  );
};
