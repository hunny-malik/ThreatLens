import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Activity, Play, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { PipelineStatus } from '../../types';

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
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
            Distributed Pipeline &amp; Cluster Telemetry
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time Apache Kafka streaming ingestion and Apache Spark distributed batch processing cluster.
        </p>
      </div>

      {/* Cluster Overview KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div className="soc-card p-4 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase">STREAM THROUGHPUT</span>
          <div className="text-xl font-bold text-cyan-400">
            {pipeline_metrics.throughput_eps.toLocaleString()} EPS
          </div>
          <span className="text-slate-400 text-[11px]">events per second</span>
        </div>

        <div className="soc-card p-4 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase">AVERAGE LATENCY</span>
          <div className="text-xl font-bold text-emerald-400">
            {pipeline_metrics.latency_ms} ms
          </div>
          <span className="text-slate-400 text-[11px]">end-to-end correlation</span>
        </div>

        <div className="soc-card p-4 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase">KAFKA BUFFER LAG</span>
          <div className="text-xl font-bold text-slate-100">
            {pipeline_metrics.lag_records} Records
          </div>
          <span className="text-slate-400 text-[11px]">across 8 partitions</span>
        </div>

        <div className="soc-card p-4 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase">SPARK EXECUTOR CORES</span>
          <div className="text-xl font-bold text-amber-400">
            {spark_cluster.total_cores} Cores
          </div>
          <span className="text-slate-400 text-[11px]">{spark_cluster.memory_total_gb} GB RAM Pool</span>
        </div>
      </div>

      {/* Distributed Batch Processing Pipeline (Requirement 18) */}
      <div className="soc-card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
              Distributed Batch Processing Pipeline (Apache Spark RDD)
            </h3>
            <span className="text-[11px] text-slate-400">
              Process historical telemetry batches across partitioned worker executors.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={batchVolume}
              onChange={(e) => setBatchVolume(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none"
            >
              <option value={3000}>3,000 Alerts (Current Dataset Batch)</option>
              <option value={10000}>10,000 Alerts Batch</option>
              <option value={100000}>100,000 Alerts Batch</option>
              <option value={1000000}>1,000,000 Alerts Batch</option>
            </select>

            <button
              onClick={handleRunBatchJob}
              disabled={isBatchRunning}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white rounded text-xs font-mono font-medium transition-colors"
            >
              {isBatchRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>EXECUTING SPARK JOB...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>RUN BATCH PIPELINE</span>
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
              className={`p-2 rounded border ${
                currentBatchJob
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              <span className="text-[9px] text-slate-400 block">STEP {i + 1}</span>
              <span className="font-bold text-[11px] mt-0.5 block">{stg}</span>
              <span className="text-[10px] text-emerald-400 mt-0.5 block">
                {currentBatchJob ? '100%' : 'READY'}
              </span>
            </div>
          ))}
        </div>

        {currentBatchJob && (
          <div className="p-3 bg-slate-900/80 rounded border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300 flex-wrap gap-2">
            <span>
              Job <strong className="text-cyan-400">{currentBatchJob.job_id}</strong> completed in{' '}
              <strong className="text-emerald-400">{currentBatchJob.duration_seconds}s</strong>
            </span>
            <span>
              Processed: <strong>{currentBatchJob.processed_records.toLocaleString()} alerts</strong> across 16 partitions
            </span>
            <span>
              Fatigue Saved: <strong className="text-amber-400">{currentBatchJob.workload_saved_hours} hrs</strong>
            </span>
          </div>
        )}
      </div>

      {/* Spark Workers & Kafka Partitions Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spark Worker Cluster */}
        <div className="soc-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
              Spark Worker Nodes ({spark_cluster.workers.length} Nodes)
            </h4>
            <span className="text-[10px] font-mono text-emerald-400">CLUSTER BALANCED</span>
          </div>

          <div className="space-y-2">
            {spark_cluster.workers.map((w: any) => (
              <div
                key={w.node_id}
                className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="text-slate-100 font-semibold block">{w.node_id}</span>
                  <span className="text-slate-400 text-[11px]">{w.ip}</span>
                </div>
                <div className="text-right">
                  <span className="text-cyan-400 block">CPU: {w.cpu_pct}%</span>
                  <span className="text-slate-400 text-[10px]">RAM: {w.ram_gb} GB</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kafka Partitions Status */}
        <div className="soc-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
              Kafka Partitions ({kafka_cluster.total_partitions} Partitions)
            </h4>
            <span className="text-[10px] font-mono text-emerald-400">CONSUMERS ACTIVE</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {kafka_cluster.partitions.map((p: any) => (
              <div
                key={p.partition_id}
                className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="text-slate-100 font-semibold">Partition #{p.partition_id}</span>
                  <span className="text-slate-400 block text-[10px]">{p.leader_broker}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-200 block">Offset: {p.offset_current}</span>
                  <span className="text-emerald-400 text-[10px]">{p.health}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enterprise Distributed Architecture Explanation */}
      <div className="soc-card p-5 space-y-4 bg-slate-900/40 border-cyan-900/40">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
            Distributed Technologies in ThreatLens: Hadoop vs. Spark vs. Kafka vs. YARN
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            How enterprise big-data tools coordinate across ingestion, storage, and correlation:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="font-mono text-cyan-400 font-bold block">1. APACHE HADOOP (HDFS)</span>
            <span className="text-slate-400 font-mono text-[10px] block">Distributed Storage Layer</span>
            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
              Stores raw historical telemetry archives (terabytes to petabytes). Splits high-volume logs into 128 MB blocks with 3x replication across DataNodes for high fault-tolerance.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="font-mono text-emerald-400 font-bold block">2. APACHE SPARK</span>
            <span className="text-slate-400 font-mono text-[10px] block">In-Memory Compute Engine</span>
            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
              Executes parallel batch processing (RDDs and DataFrames). 10x-100x faster than legacy MapReduce by executing in-memory map-side deduplication and entity graph shuffles.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="font-mono text-amber-400 font-bold block">3. APACHE KAFKA</span>
            <span className="text-slate-400 font-mono text-[10px] block">Distributed Stream Broker</span>
            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
              Buffers incoming real-time alerts across partitioned topics. Decouples high-velocity ingestion from analytical pipelines, guaranteeing zero alert drop even during DDoS surges.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="font-mono text-rose-400 font-bold block">4. HADOOP YARN</span>
            <span className="text-slate-400 font-mono text-[10px] block">Resource Negotiator</span>
            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
              Allocates CPU core pools and memory limits to Spark executors across physical worker nodes, enabling dynamic horizontal scaling from 10K to 10M+ alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
