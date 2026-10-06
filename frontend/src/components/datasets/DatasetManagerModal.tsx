import React, { useState, useEffect } from 'react';
import {
  Upload,
  Database,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Play,
  ArrowRight,
  ShieldAlert,
  Layers,
  Sparkles,
  Cpu,
  Server,
  Activity,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';

interface DatasetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: () => void;
}

export const DatasetManagerModal: React.FC<DatasetManagerModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
}) => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [activePartitionProgress, setActivePartitionProgress] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resultBanner, setResultBanner] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    if (!isOpen) {
      setResultBanner(null);
      setErrorMsg(null);
      setProcessing(false);
      return;
    }

    const fetchDatasets = async () => {
      setLoadingList(true);
      try {
        const data = await api.getDatasets();
        setDatasets(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingList(false);
      }
    };
    fetchDatasets();
  }, [isOpen]);

  // Animated distributed execution simulation
  const runDistributedProcessingAnimation = async (recordCount: number = 3000) => {
    setProcessing(true);
    const isBigData = recordCount >= 50000;
    const partitionCount = isBigData ? 32 : 16;
    const workerCount = isBigData ? 8 : 4;
    const kafkaPartitions = isBigData ? 16 : 8;

    const initialPartitions = Array(partitionCount).fill(0);
    setActivePartitionProgress(initialPartitions);

    const stages = [
      { name: 'STREAM_INGEST', desc: `Streaming ${recordCount.toLocaleString()} events across ${kafkaPartitions} Kafka topic partitions` },
      { name: 'SPARK_PARTITION', desc: `Distributing into ${partitionCount} RDD Parquet blocks across ${workerCount} Spark worker nodes` },
      { name: 'MAP_NORMALIZE', desc: `Parallel Map (${partitionCount} partitions): Converting heterogeneous telemetry to canonical schema` },
      { name: 'SHUFFLE_DEDUP', desc: 'Shuffle Phase: Hashing composite signatures, collapsing repetitive storm noise' },
      { name: 'REDUCE_GRAPH', desc: 'Reduce Phase: Connected component graph partitioning across IP & host pivots' },
      { name: 'RISK_SCORING', desc: 'Evaluating asset criticality multipliers & MITRE kill-chain progression' },
      { name: 'HDFS_SINK', desc: 'Committing correlated incidents to HDFS & updating active SOC triage queue' },
    ];

    for (let sIdx = 0; sIdx < stages.length; sIdx++) {
      setProcessingStage(stages[sIdx].desc);
      const pct = Math.min(100, Math.round(((sIdx + 1) / stages.length) * 100));
      setActivePartitionProgress((prev) =>
        prev.map((val, pIdx) => Math.min(100, pct + ((pIdx * 3) % 15)))
      );
      await new Promise((r) => setTimeout(r, isBigData ? 320 : 250));
    }
  };

  const handleLoadPrebuilt = async (datasetId: string) => {
    setErrorMsg(null);
    setResultBanner(null);
    const targetDataset = datasets.find((d) => d.id === datasetId);
    const recordCount = targetDataset?.records_count || 3000;
    try {
      // 1. Kick off visual distributed cluster execution
      const animationPromise = runDistributedProcessingAnimation(recordCount);
      const apiPromise = api.loadDataset(datasetId);

      const [, res] = await Promise.all([animationPromise, apiPromise]);
      setResultBanner(res);
      onDatasetLoaded();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to load dataset');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setErrorMsg(null);
    setResultBanner(null);
    try {
      const animationPromise = runDistributedProcessingAnimation(selectedFile.size > 10000000 ? 100000 : 3000);
      const apiPromise = api.uploadDataset(selectedFile);

      const [, res] = await Promise.all([animationPromise, apiPromise]);
      setResultBanner(res);
      setSelectedFile(null);
      onDatasetLoaded();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to upload custom dataset');
    } finally {
      setProcessing(false);
    }
  };

  const filteredDatasets = datasets.filter((d) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'BIGDATA') return d.records_count >= 50000;
    if (filterType === 'CSV') return d.format === 'CSV';
    if (filterType === 'JSON') return d.format === 'JSON';
    if (filterType === 'CRITICAL') return d.risk_level === 'CRITICAL';
    if (filterType === 'CLEAN') return d.risk_level === 'CLEAN';
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-charcoal-900 border border-slate-700 w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-charcoal-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide font-mono">
                  Enterprise Dataset &amp; Distributed Ingestion Hub
                </h2>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                  APACHE SPARK &bull; KAFKA &bull; HDFS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Load full 3,000-event multi-attack scenarios, clean operational baselines, or upload custom telemetry
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Distributed Execution Modal Overlay if processing */}
          {processing && (
            <div className="p-4 rounded-lg bg-slate-900 border border-cyan-800/80 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                  <Cpu className="w-4 h-4 animate-spin" />
                  <span>Distributed Spark &amp; Kafka Execution in Progress</span>
                </div>
                <span className="text-[11px] font-mono text-slate-300">
                  Cluster: spark://spark-master:7077 (32 cores / 128 GB RAM)
                </span>
              </div>

              {/* Current Active Stage */}
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-200">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                <span className="truncate">{processingStage}</span>
              </div>

              {/* 16 Partitions Grid Monitor */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>16 RDD Partitions (Worker-01 .. Worker-04)</span>
                  <span>Throughput: ~1,680 alerts/sec</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {activePartitionProgress.map((val, idx) => (
                    <div
                      key={idx}
                      className="p-1 rounded bg-slate-950 border border-slate-800 text-[9px] font-mono flex flex-col gap-0.5"
                    >
                      <div className="flex justify-between text-slate-400">
                        <span>P-{idx < 10 ? `0${idx}` : idx}</span>
                        <span className="text-cyan-400">{val}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full transition-all duration-200"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Result Banner */}
          {resultBanner && !processing && (
            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Dataset Ingested &amp; Correlated: {resultBanner.dataset_name || resultBanner.filename}
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-300">
                  {resultBanner.total_alerts_ingested.toLocaleString()} ALERTS PROCESSED ACROSS {resultBanner.total_alerts_ingested >= 50000 ? '32 SPARK PARTITIONS (8 WORKERS)' : '16 SPARK PARTITIONS (4 WORKERS)'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-900/60 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">INCIDENTS DETECTED</span>
                  <span className={`font-bold ${resultBanner.incidents_created > 0 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                    {resultBanner.incidents_created > 0
                      ? `${resultBanner.incidents_created} Correlated Threats`
                      : '0 Threats (Clean Baseline)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">NOISE COLLAPSED</span>
                  <span className="text-emerald-400 font-bold">
                    {resultBanner.collapsed_duplicates.toLocaleString()} ({resultBanner.deduplication_ratio_pct}%)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">FATIGUE SAVED</span>
                  <span className="text-amber-400 font-bold">
                    {resultBanner.workload_hours_saved} Hours
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CAMPAIGNS TRACKED</span>
                  <span className="text-rose-400 font-bold">
                    {resultBanner.active_campaigns} Threat Campaigns
                  </span>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded flex items-center gap-2 text-xs font-mono text-red-300">
              <AlertTriangle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Upload Custom Dataset File */}
          <div className="soc-card p-4 space-y-3 bg-slate-900/40 border-dashed border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  Upload Custom Telemetry File (CSV, JSON, Logs)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                DISTRIBUTED BATCH PROCESSOR
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Upload arbitrary security logs (e.g. 3,000 alerts). ThreatLens automatically partitions the batch, normalizes heterogeneous schemas, dedupes repetitive floods, and rebuilds the correlation graph.
            </p>

            <form onSubmit={handleFileUpload} className="flex items-center gap-3 pt-1">
              <input
                type="file"
                accept=".csv,.json,.log,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
              <button
                type="submit"
                disabled={!selectedFile || processing}
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white rounded text-xs font-mono font-semibold shrink-0 transition-colors flex items-center gap-1.5 shadow-md"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Cluster...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload &amp; Distribute</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Section 2: 6 Diverse 3,000-Log Enterprise Datasets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                  Enterprise &amp; Big-Data Datasets (3,000 to 100,000+ Alerts)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  6 operational shift scenarios plus high-throughput 100,000+ Big Data Spark stress-tests
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1.5">
                {[
                  { id: 'ALL', label: 'All Datasets' },
                  { id: 'BIGDATA', label: '100K+ Big Data' },
                  { id: 'CRITICAL', label: 'Critical Risk' },
                  { id: 'CLEAN', label: 'Clean Baseline' },
                  { id: 'CSV', label: 'CSV' },
                  { id: 'JSON', label: 'JSON' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-colors border ${
                      filterType === tab.id
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-800 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingList ? (
              <div className="py-8 text-center font-mono text-xs text-slate-400">
                Loading enterprise dataset catalog...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredDatasets.map((d) => {
                  const isClean = d.risk_level === 'CLEAN' || d.attack_count === 0;
                  const isCritical = d.risk_level === 'CRITICAL';
                  const isHigh = d.risk_level === 'HIGH';

                  return (
                    <div
                      key={d.id}
                      className="soc-card-elevated p-4 flex flex-col justify-between space-y-3 border-slate-750 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-2">
                        {/* Top Badges */}
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                              {d.records_count.toLocaleString()} LOGS
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {d.format}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border ${
                                isClean
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : isCritical
                                  ? 'bg-red-950 text-red-300 border-red-800'
                                  : isHigh
                                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {isClean ? '0 ATTACKS (CLEAN)' : `${d.attack_count} ATTACK${d.attack_count > 1 ? 'S' : ''}`}
                            </span>

                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                                isClean
                                  ? 'text-emerald-400'
                                  : isCritical
                                  ? 'text-red-400'
                                  : isHigh
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {d.risk_level}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="font-semibold text-slate-100 text-xs">{d.name}</h4>
                          <span className="text-[10px] font-mono text-cyan-400 block mt-0.5">
                            {d.threat_category}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                          {d.description}
                        </p>
                      </div>

                      {/* Footer Actions & Sources */}
                      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex flex-wrap gap-1 font-mono text-[9px] text-slate-400 max-w-[65%]">
                          {d.telemetry_sources.map((src: string) => (
                            <span
                              key={src}
                              className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800"
                            >
                              {src}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => handleLoadPrebuilt(d.id)}
                          disabled={processing}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:border-cyan-700 rounded text-xs font-mono font-medium transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Load &amp; Process</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-charcoal-950 flex justify-between items-center text-xs font-mono text-slate-400">
          <span>Distributed Architecture: Apache Spark 3.5 &bull; Apache Kafka 3.6 &bull; Hadoop HDFS 3.3</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
