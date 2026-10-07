import React, { useState, useEffect } from 'react';
import { Server, Search, ShieldAlert, Cpu } from 'lucide-react';
import { api } from '../../services/api';
import { Asset } from '../../types';
import { AssetCriticalityBadge } from '../common/AssetCriticalityBadge';
import { RiskScoreGauge } from '../common/RiskScoreGauge';
import { DirectoryFooter } from '../layout/DirectoryFooter';

export const AssetsView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const data = await api.getAssets();
        setAssets(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const filtered = assets.filter((a) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.ip_address.includes(q) ||
        a.owner.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
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
              Enterprise Asset Inventory &amp; Criticality
            </h2>
          </div>
          <p className="font-serif text-sm text-text-muted mt-1">
            Asset criticality influences dynamic risk scoring: Domain Controllers (1.45x) outrank test machines (0.52x).
          </p>
        </div>

        <div className="editorial-card p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search asset name, IP, type, owner..."
              className="w-full bg-canvas border border-hairline pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-text-muted focus:outline-none focus:border-ink font-sans"
            />
          </div>

          <span className="text-xs font-mono text-text-muted">
            Total Assets Monitored: <strong className="text-ink font-bold">{assets.length}</strong>
          </span>
        </div>

        <div className="editorial-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left editorial-table text-xs">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Criticality &amp; Type</th>
                  <th>IP Address</th>
                  <th>Operating System</th>
                  <th>Owner / Group</th>
                  <th>Active Incidents</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted font-mono text-xs">
                      Loading asset catalog...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted font-mono text-xs">
                      No matching assets found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((ast) => (
                    <tr key={ast.id}>
                      <td className="font-mono text-ink font-semibold text-xs">{ast.name}</td>
                      <td>
                        <AssetCriticalityBadge criticality={ast.criticality} assetType={ast.type} />
                      </td>
                      <td className="font-mono text-text-muted text-xs">{ast.ip_address}</td>
                      <td className="text-ink font-sans text-xs">{ast.os}</td>
                      <td className="font-mono text-text-muted text-xs">{ast.owner}</td>
                      <td className="font-mono text-xs">
                        {ast.active_incidents_count > 0 ? (
                          <span className="text-clay-deep font-bold">
                            {ast.active_incidents_count} Active
                          </span>
                        ) : (
                          <span className="text-text-muted">0 Clear</span>
                        )}
                      </td>
                      <td>
                        <RiskScoreGauge score={ast.risk_score} size="sm" />
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
    </div>
  );
};
