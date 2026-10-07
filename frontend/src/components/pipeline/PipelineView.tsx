import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Activity, Play, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { PipelineStatus } from '../../types';
import { DirectoryFooter } from '../layout/DirectoryFooter';

export const PipelineView: React.FC = () => {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchVolume, setBatchVolume] = useState(3000);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [currentBatchJob, setCurrentBatchJob] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const data = await api.getPipelineStatus();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRunBatchJob = async () => {
    setIsBatchRunning(true);
    try {
      const res = await api.runBatchJob(batchVolume, 16);
      setCurrentBatchJob(res.job);
      fetchStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setIsBatchRunning(false);
    }
  };

  if (loading || !status) {
    return (
      <div className="p-12 text-center text-text-muted font-mono text-xs">
        Loading distributed cluster metrics...
      </div>
    );
  }

  const { pipeline_metrics, spark_cluster, kafka_cluster, hdfs_storage } = status;

  const pipelineStages = [
    'UPLOAD',
    'VALIDATE',
    'NORMALIZE',
    'DISTRIBUTE',
    'PROCESS',
    'CORRELATE',
    'SCORE',
    'SUMMARIZE',
    'COMPLETE',
  ];

  return (
    <div className="bg-canvas min-h-full flex flex-col justify-between">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="pb-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-clay" />
            <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight text-ink">
              Distributed Pipeline &amp; Cluster Telemetry
            </h2>
          </div>
          <p className="font-serif text-sm text-text-muted mt-1">
            Real-time Apache Kafka streaming ingestion and Apache Spark distributed batch processing cluster.
          </p>
        </div>

        {/* Cluster Overview KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="editorial-card p-5 space-y-1">
            <span className="text-text-muted text-[10px] uppercase">Stream Throughput</span>
            <div className="text-xl font-bold text-ink">
              {pipeline_metrics.throughput_eps.toLocaleString()} EPS
            </div>
            <span className="text-text-muted text-[11px]">events per second</span>
          </div>

          <div className="editorial-card p-5 space-y-1">
            <span className="text-text-muted text-[10px] uppercase">Average Latency</span>
            <div className="text-xl font-bold text-ink">
              {pipeline_metrics.latency_ms} ms
            </div>
            <span className="text-text-muted text-[11px]">end-to-end correlation</span>
          </div>

          <div className="editorial-card p-5 space-y-1">
            <span className="text-text-muted text-[10px] uppercase">Kafka Buffer Lag</span>
            <div className="text-xl font-bold text-ink">
              {pipeline_metrics.lag_records} Records
            </div>
            <span className="text-text-muted text-[11px]">across 8 partitions</span>
          </div>

          <div className="editorial-card p-5 space-y-1">
            <span className="text-text-muted text-[10px] uppercase">Spark Executor Cores</span>
            <div className="text-xl font-bold text-ink">
              {spark_cluster.total_cores} Cores
            </div>
            <span className="text-text-muted text-[11px]">{spark_cluster.memory_total_gb} GB RAM Pool</span>
          </div>
        </div>

        {/* Distributed Batch Processing Pipeline (Requirement 18) */}
        <div className="editorial-card p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-hairline pb-4">
            <div>
              <h3 className="font-display text-base font-semibold uppercase tracking-wider text-ink">
                Distributed Batch Processing Pipeline (Apache Spark RDD)
              </h3>
              <span className="text-xs text-text-muted font-sans mt-0.5 block">
                Process historical telemetry batches across partitioned worker executors.
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={batchVolume}
                onChange={(e) => setBatchVolume(Number(e.target.value))}
                className="bg-canvas border border-hairline text-ink text-xs px-3 py-2 font-mono focus:outline-none"
              >
                <option value={3000}>3,000 Alerts (Current Dataset Batch)</option>
                <option value={10000}>10,000 Alerts Batch</option>
                <option value={100000}>100,000 Alerts Batch</option>
                <option value={1000000}>1,000,000 Alerts Batch</option>
              </select>

              <button
                onClick={handleRunBatchJob}
                disabled={isBatchRunning}
                className="flex items-center gap-2 px-4 py-2 bg-clay text-ink hover:bg-clay/90 disabled:opacity-50 text-xs font-display font-medium uppercase tracking-wider border border-clay transition-colors"
              >
                {isBatchRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Spark Job...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Batch Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pipeline Stage Blocks */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center text-xs font-mono">
            {pipelineStages.map((stg, i) => (
              <div
                key={stg}
                className={`p-3 border transition-colors ${
                  currentBatchJob
                    ? 'bg-sage/30 border-sage text-ink'
                    : 'bg-canvas border-hairline text-text-muted'
                }`}
              >
                <span className="text-[10px] text-text-muted block">STEP {i + 1}</span>
                <span className="font-bold text-xs mt-1 block text-ink">{stg}</span>
                <span className="text-[10px] mt-1 block font-semibold text-clay-deep">
                  {currentBatchJob ? '100%' : 'READY'}
                </span>
              </div>
            ))}
          </div>

          {currentBatchJob && (
            <div className="p-4 bg-sage/20 border border-sage flex items-center justify-between text-xs font-mono text-ink flex-wrap gap-2">
              <span>
                Job <strong className="font-bold">{currentBatchJob.job_id}</strong> completed in{' '}
                <strong className="font-bold">{currentBatchJob.duration_seconds}s</strong>
              </span>
              <span>
                Processed: <strong>{currentBatchJob.processed_records.toLocaleString()} alerts</strong> across 16 partitions
              </span>
              <span>
                Fatigue Saved: <strong>{currentBatchJob.workload_saved_hours} hrs</strong>
              </span>
            </div>
          )}
        </div>

        {/* Spark Workers & Kafka Partitions Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spark Worker Cluster */}
          <div className="editorial-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
                Spark Worker Nodes ({spark_cluster.workers.length} Nodes)
              </h4>
              <span className="text-xs font-mono text-clay-deep font-semibold">Cluster Balanced</span>
            </div>

            <div className="space-y-2">
              {spark_cluster.workers.map((w: any) => (
                <div
                  key={w.node_id}
                  className="p-3 bg-canvas border border-hairline flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="font-bold text-ink block">{w.node_id}</span>
                    <span className="text-text-muted text-[11px]">{w.ip}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-ink block">CPU: {w.cpu_pct}%</span>
                    <span className="text-text-muted text-[10px]">RAM: {w.ram_gb} GB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kafka Partitions Status */}
          <div className="editorial-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
                Kafka Partitions ({kafka_cluster.total_partitions} Partitions)
              </h4>
              <span className="text-xs font-mono text-clay-deep font-semibold">Consumers Active</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {kafka_cluster.partitions.map((p: any) => (
                <div
                  key={p.partition_id}
                  className="p-3 bg-canvas border border-hairline flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="font-bold text-ink">Partition #{p.partition_id}</span>
                    <span className="text-text-muted block text-[10px]">{p.leader_broker}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-ink block">Offset: {p.offset_current}</span>
                    <span className="text-text-muted text-[10px]">{p.health}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enterprise Distributed Architecture Explanation */}
        <div className="editorial-card p-6 md:p-8 space-y-4">
          <div className="border-b border-hairline pb-3">
            <h3 className="font-display text-base font-semibold uppercase tracking-wider text-ink">
              Distributed Technologies in ThreatLens: Hadoop vs. Spark vs. Kafka vs. YARN
            </h3>
            <p className="font-serif text-xs text-text-muted mt-1">
              How enterprise big-data tools coordinate across ingestion, storage, and correlation:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-canvas border border-hairline space-y-2">
              <span className="font-mono font-bold text-ink block">1. APACHE HADOOP (HDFS)</span>
              <span className="text-text-muted font-mono text-[10px] block">Distributed Storage Layer</span>
              <p className="font-serif text-xs text-ink/80 leading-relaxed">
                Stores raw historical telemetry archives (terabytes to petabytes). Splits high-volume logs into 128 MB blocks with 3x replication across DataNodes for high fault-tolerance.
              </p>
            </div>

            <div className="p-4 bg-canvas border border-hairline space-y-2">
              <span className="font-mono font-bold text-ink block">2. APACHE SPARK</span>
              <span className="text-text-muted font-mono text-[10px] block">In-Memory Compute Engine</span>
              <p className="font-serif text-xs text-ink/80 leading-relaxed">
                Executes parallel batch processing (RDDs and DataFrames). 10x-100x faster than legacy MapReduce by executing in-memory map-side deduplication and entity graph shuffles.
              </p>
            </div>

            <div className="p-4 bg-canvas border border-hairline space-y-2">
              <span className="font-mono font-bold text-ink block">3. APACHE KAFKA</span>
              <span className="text-text-muted font-mono text-[10px] block">Distributed Stream Broker</span>
              <p className="font-serif text-xs text-ink/80 leading-relaxed">
                Buffers incoming real-time alerts across partitioned topics. Decouples high-velocity ingestion from analytical pipelines, guaranteeing zero alert drop even during DDoS surges.
              </p>
            </div>

            <div className="p-4 bg-canvas border border-hairline space-y-2">
              <span className="font-mono font-bold text-ink block">4. HADOOP YARN</span>
              <span className="text-text-muted font-mono text-[10px] block">Resource Negotiator</span>
              <p className="font-serif text-xs text-ink/80 leading-relaxed">
                Allocates CPU core pools and memory limits to Spark executors across physical worker nodes, enabling dynamic horizontal scaling from 10K to 10M+ alerts.
              </p>
            </div>
          </div>
        </div>
      </div>

      <DirectoryFooter />
    </div>
  );
};
