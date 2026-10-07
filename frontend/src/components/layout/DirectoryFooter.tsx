import React from 'react';
import { BrandLogo } from './BrandLogo';

export const DirectoryFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#141413] text-[#FAF9F5] border-t border-[#3D3D3A] pt-16 pb-12 px-8 mt-20 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Top Split: Wordmark & Core Mission */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#3D3D3A]">
          <div className="md:col-span-5 space-y-3">
            <BrandLogo size="lg" theme="inverse" />
            <p className="font-serif text-[#B0AEA5] text-sm leading-relaxed max-w-md pt-2">
              Transforming raw, overwhelming security telemetry into prioritized, verified incident investigations through mathematical correlation, distributed streaming, and evidence-grounded AI briefs.
            </p>
          </div>
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
            <div>
              <span className="font-mono text-[11px] text-[#FAF9F5] uppercase tracking-wider block mb-3 font-semibold">
                Architecture
              </span>
              <ul className="space-y-2 text-[#B0AEA5]">
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">Apache Spark RDDs</li>
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">Kafka Stream Broker</li>
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">Hadoop HDFS Archive</li>
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">FastAPI Core Engine</li>
              </ul>
            </div>
            <div>
              <span className="font-mono text-[11px] text-[#FAF9F5] uppercase tracking-wider block mb-3 font-semibold">
                Detection
              </span>
              <ul className="space-y-2 text-[#B0AEA5]">
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">Disentanglement Graph</li>
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">Kill-Chain Synthesis</li>
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">Asset Risk Scorer</li>
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">Novelty Anomaly Det.</li>
              </ul>
            </div>
            <div>
              <span className="font-mono text-[11px] text-[#FAF9F5] uppercase tracking-wider block mb-3 font-semibold">
                Compliance
              </span>
              <ul className="space-y-2 text-[#B0AEA5]">
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">MITRE ATT&CK v14</li>
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">NIST SP 800-61</li>
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">SOC 2 Type II</li>
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">Zero Hallucination</li>
              </ul>
            </div>
            <div>
              <span className="font-mono text-[11px] text-[#FAF9F5] uppercase tracking-wider block mb-3 font-semibold">
                Governance
              </span>
              <ul className="space-y-2 text-[#B0AEA5]">
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">Human-in-the-Loop</li>
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">Immutable Audit Trail</li>
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">Analyst Override</li>
                <li className="hover:text-[#FAF9F5] transition-colors cursor-pointer">Feedback Calibration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#87867F] gap-4">
          <div className="flex items-center gap-4">
            <span>THREATLENS SECURITY INTELLIGENCE PLATFORM</span>
            <span>•</span>
            <span>ENTERPRISE SPECIFICATION v2.4.0</span>
          </div>
          <div className="flex items-center gap-6">
            <span>3,000 Alerts, One Analyst Challenge</span>
            <span>MITRE ATT&CK Enterprise Matrix</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
