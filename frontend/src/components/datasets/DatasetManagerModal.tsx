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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-hairline w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-canvas">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-oat border border-hairline flex items-center justify-center text-ink">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-semibold text-ink uppercase tracking-wider">
                  Enterprise Dataset &amp; Distributed Ingestion Hub
                </h2>
                <span className="text-[10px] font-mono bg-oat text-ink px-2 py-0.5 border border-hairline">
                  SPARK &bull; KAFKA &bull; HDFS
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5 font-sans">
                Load 3,000-event multi-attack scenarios, clean baselines, or execute 100,000+ Big Data pipelines
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Distributed Execution Modal Overlay if processing */}
          {processing && (
            <div className="p-5 bg-canvas border border-hairline space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-ink font-mono text-xs font-semibold uppercase">
                  <Cpu className="w-4 h-4 animate-spin text-clay-deep" />
                  <span>Distributed Spark &amp; Kafka Execution in Progress</span>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  Cluster: spark://spark-master:7077 (32 cores / 128 GB RAM)
                </span>
              </div>

              {/* Current Active Stage */}
              <div className="p-3 bg-surface border border-hairline flex items-center gap-2 text-xs font-mono text-ink">
                <Activity className="w-4 h-4 text-clay-deep animate-pulse shrink-0" />
                <span className="truncate">{processingStage}</span>
              </div>

              {/* Partitions Grid Monitor */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-mono text-text-muted">
                  <span>Partitions Assigned (Worker-01 .. Worker-08)</span>
                  <span>Throughput: ~1,680 alerts/sec</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {activePartitionProgress.map((val, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 bg-surface border border-hairline text-[10px] font-mono flex flex-col gap-1"
                    >
                      <div className="flex justify-between text-text-muted">
                        <span>P-{idx < 10 ? `0${idx}` : idx}</span>
                        <span className="text-ink font-semibold">{val}%</span>
                      </div>
                      <div className="w-full bg-oat h-1.5 overflow-hidden">
                        <div
                          className="bg-ink h-full transition-all duration-200"
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
            <div className="p-4 bg-sage/20 border border-sage space-y-3 text-ink">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase">
                  <CheckCircle2 className="w-4 h-4 text-ink" />
                  <span>
                    Dataset Ingested &amp; Correlated: {resultBanner.dataset_name || resultBanner.filename}
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold">
                  {resultBanner.total_alerts_ingested.toLocaleString()} ALERTS PROCESSED ACROSS {resultBanner.total_alerts_ingested >= 50000 ? '32 SPARK PARTITIONS' : '16 SPARK PARTITIONS'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-hairline text-xs font-mono">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase">Incidents Detected</span>
                  <span className="font-semibold text-ink">
                    {resultBanner.incidents_created > 0
                      ? `${resultBanner.incidents_created} Correlated Threats`
                      : '0 Threats (Clean Baseline)'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase">Noise Collapsed</span>
                  <span className="font-semibold text-ink">
                    {resultBanner.collapsed_duplicates.toLocaleString()} ({resultBanner.deduplication_ratio_pct}%)
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase">Fatigue Saved</span>
                  <span className="font-semibold text-ink">
                    {resultBanner.workload_hours_saved} Hours
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase">Campaigns Tracked</span>
                  <span className="font-semibold text-ink">
                    {resultBanner.active_campaigns} Threat Campaigns
                  </span>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-manilla border border-hairline flex items-center gap-2 text-xs font-mono text-ink">
              <AlertTriangle className="w-4 h-4 text-clay-deep" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Upload Custom Dataset File */}
          <div className="editorial-card p-5 space-y-3 border-dashed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-ink" />
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
                  Upload Custom Telemetry File (CSV, JSON, Logs)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-oat text-ink px-2 py-0.5 border border-hairline">
                Distributed Batch Processor
              </span>
            </div>

            <p className="font-serif text-xs text-ink/80 leading-relaxed">
              Upload arbitrary security telemetry (e.g. 3,000 to 100,000+ alerts). ThreatLens automatically partitions the batch, normalizes heterogeneous schemas, dedupes repetitive floods, and rebuilds the correlation graph.
            </p>

            <form onSubmit={handleFileUpload} className="flex items-center gap-3 pt-1 flex-wrap">
              <input
                type="file"
                accept=".csv,.json,.log,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block text-xs text-ink font-mono file:mr-3 file:py-1.5 file:px-3 file:border file:border-hairline file:text-xs file:font-mono file:bg-canvas file:text-ink hover:file:bg-oat/50 cursor-pointer"
              />
              <button
                type="submit"
                disabled={!selectedFile || processing}
                className="px-4 py-2 bg-clay text-ink hover:bg-clay/90 font-display font-medium disabled:opacity-50 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-clay"
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

          {/* Section 2: Datasets Catalog */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
                  Enterprise Scenarios &amp; Big-Data Datasets
                </h3>
                <p className="text-xs text-text-muted mt-0.5 font-sans">
                  Curated operational scenarios with realistic attack combinations and volume scaling
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1.5 flex-wrap">
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
                    className={`px-2.5 py-1 text-xs font-mono uppercase tracking-wider transition-colors border ${
                      filterType === tab.id
                        ? 'bg-clay text-ink font-semibold border-clay'
                        : 'bg-canvas text-ink/70 border-hairline hover:bg-oat/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingList ? (
              <div className="py-8 text-center font-mono text-xs text-text-muted">
                Loading enterprise dataset catalog...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDatasets.map((d) => {
                  const isClean = d.risk_level === 'CLEAN' || d.attack_count === 0;
                  const isCritical = d.risk_level === 'CRITICAL';
                  const isHigh = d.risk_level === 'HIGH';

                  return (
                    <div
                      key={d.id}
                      className="editorial-card p-5 flex flex-col justify-between space-y-3 hover:border-ink/40 transition-colors"
                    >
                      <div className="space-y-2.5">
                        {/* Top Badges */}
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-oat text-ink border border-hairline font-bold">
                              {d.records_count.toLocaleString()} LOGS
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-canvas text-ink border border-hairline">
                              {d.format}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 font-bold border ${
                                isClean
                                  ? 'bg-sage/40 text-ink border-sage'
                                  : isCritical
                                  ? 'bg-clay-deep text-canvas border-clay-deep'
                                  : isHigh
                                  ? 'bg-manilla text-ink border-hairline'
                                  : 'bg-canvas text-ink border-hairline'
                              }`}
                            >
                              {isClean ? '0 ATTACKS (CLEAN)' : `${d.attack_count} ATTACK${d.attack_count > 1 ? 'S' : ''}`}
                            </span>

                            <span className="text-[10px] font-mono px-1.5 py-0.5 font-semibold text-text-muted uppercase">
                              {d.risk_level}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="font-display font-semibold text-ink text-sm">{d.name}</h4>
                          <span className="text-xs font-mono text-clay-deep block mt-0.5">
                            {d.threat_category}
                          </span>
                        </div>

                        <p className="font-serif text-xs text-ink/80 leading-relaxed">
                          {d.description}
                        </p>
                      </div>

                      {/* Footer Actions & Sources */}
                      <div className="pt-3 border-t border-hairline flex items-center justify-between flex-wrap gap-2">
                        <div className="flex flex-wrap gap-1 font-mono text-[10px] text-text-muted max-w-[65%]">
                          {d.telemetry_sources.map((src: string) => (
                            <span
                              key={src}
                              className="bg-canvas px-1.5 py-0.5 border border-hairline"
                            >
                              {src}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => handleLoadPrebuilt(d.id)}
                          disabled={processing}
                          className="px-3 py-1.5 bg-canvas hover:bg-oat/50 text-ink border border-hairline text-xs font-display font-medium transition-colors flex items-center gap-1.5 shrink-0"
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
        <div className="px-6 py-3.5 border-t border-hairline bg-canvas flex justify-between items-center text-xs font-mono text-text-muted">
          <span>Distributed Architecture: Apache Spark 3.5 &bull; Apache Kafka 3.6 &bull; Hadoop HDFS 3.3</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-surface hover:bg-oat/50 text-ink border border-hairline text-xs font-display"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
