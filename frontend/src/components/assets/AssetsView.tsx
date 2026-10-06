import React, { useState, useEffect } from 'react';
import { Server, Search, ShieldAlert, Cpu } from 'lucide-react';
import { api } from '../../services/api';
import { Asset } from '../../types';
import { AssetCriticalityBadge } from '../common/AssetCriticalityBadge';
import { RiskScoreGauge } from '../common/RiskScoreGauge';

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
            Enterprise Asset Inventory &amp; Criticality
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Asset criticality influences dynamic risk scoring: Domain Controllers (1.45x) outrank test machines (0.52x).
        </p>
      </div>

      <div className="soc-card p-3 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search asset name, IP, type, owner..."
            className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <span className="text-xs font-mono text-slate-400">
          Total Assets Monitored: <strong className="text-cyan-400">{assets.length}</strong>
        </span>
      </div>

      <div className="soc-card overflow-hidden">
        <table className="w-full text-left soc-table text-xs">
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
                <td colSpan={7} className="py-8 text-center text-slate-400 font-mono text-xs">
                  Loading asset catalog...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-mono text-xs">
                  No matching assets found.
                </td>
              </tr>
            ) : (
              filtered.map((ast) => (
                <tr key={ast.id}>
                  <td className="font-mono text-slate-100 font-semibold">{ast.name}</td>
                  <td>
                    <AssetCriticalityBadge criticality={ast.criticality} assetType={ast.type} />
                  </td>
                  <td className="font-mono text-slate-400">{ast.ip_address}</td>
                  <td className="text-slate-300 font-sans">{ast.os}</td>
                  <td className="font-mono text-slate-400">{ast.owner}</td>
                  <td className="font-mono">
                    {ast.active_incidents_count > 0 ? (
                      <span className="text-rose-400 font-bold">
                        {ast.active_incidents_count} Active
                      </span>
                    ) : (
                      <span className="text-slate-400">0 Clear</span>
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
  );
};
