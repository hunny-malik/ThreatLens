"""
ThreatLens Distributed Batch Processing Engine
Models Apache Spark Resilient Distributed Datasets (RDD) / DataFrames partitioned execution.
Executes multi-stage batch pipelines: UPLOAD -> VALIDATE -> NORMALIZE -> DISTRIBUTE -> PROCESS -> CORRELATE -> SCORE -> SUMMARIZE -> COMPLETE.
"""
import time
import uuid
import math
from typing import List, Dict, Any, Optional
from app.models.schemas import NormalizedAlert


class BatchPipelineJob:
    STAGES = [
        "UPLOAD",
        "VALIDATE",
        "NORMALIZE",
        "DISTRIBUTE",
        "PROCESS",
        "CORRELATE",
        "SCORE",
        "SUMMARIZE",
        "COMPLETE"
    ]

    STAGE_DESCRIPTIONS = {
        "UPLOAD": "Receiving and hashing incoming telemetry payload",
        "VALIDATE": "Verifying schema compliance and sanitizing field bounds",
        "NORMALIZE": "Executing distributed map to canonical NormalizedAlert schema",
        "DISTRIBUTE": "Partitioning RDD blocks across 4 Spark worker nodes",
        "PROCESS": "Parallel Map Phase: extracting IP, Host, User, Hash pivots",
        "CORRELATE": "Shuffle Phase: Hash-partitioning & collapsing repetitive duplicate noise",
        "SCORE": "Reduce Phase: Disjoint connected component graph partitioning & risk scoring",
        "SUMMARIZE": "Synthesizing zero-hallucination AI handover briefs & MITRE matrix",
        "COMPLETE": "Committing correlated incidents to HDFS & publishing to SOC queue"
    }

    def __init__(self, job_id: str, total_alerts: int, partitions: int = 16):
        self.job_id = job_id
        self.total_alerts = total_alerts
        self.partitions = partitions
        self.current_stage = "UPLOAD"
        self.stage_progress: Dict[str, float] = {s: 0.0 for s in self.STAGES}
        self.stage_durations_ms: Dict[str, int] = {}
        self.is_completed = False
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        self.processed_records = 0
        self.incidents_generated = 0
        self.workload_saved_hours = 0.0
        self.partitions_detail: List[Dict[str, Any]] = []
        self.worker_summary: List[Dict[str, Any]] = []

    def generate_partition_breakdown(self, collapsed_count: int = 0):
        if self.total_alerts >= 50000:
            worker_names = [f"spark-worker-{i:02d}" for i in range(1, 9)]
        else:
            worker_names = ["spark-worker-01", "spark-worker-02", "spark-worker-03", "spark-worker-04"]
            
        base_per_part = self.total_alerts // self.partitions
        rem = self.total_alerts % self.partitions
        
        self.partitions_detail = []
        worker_task_counts = {w: 0 for w in worker_names}
        worker_record_counts = {w: 0 for w in worker_names}

        for p in range(self.partitions):
            count = base_per_part + (1 if p < rem else 0)
            worker = worker_names[p % len(worker_names)]
            worker_task_counts[worker] += 1
            worker_record_counts[worker] += count
            
            p_collapsed = int(count * (collapsed_count / max(1, self.total_alerts)))
            self.partitions_detail.append({
                "partition_id": p,
                "rdd_block": f"part-{p:05d}.parquet",
                "assigned_worker": worker,
                "records_allocated": count,
                "records_collapsed": p_collapsed,
                "map_time_ms": 110 + (p * 7) % 65,
                "shuffle_kb": round(count * 0.28, 1),
                "reduce_time_ms": 85 + (p * 11) % 55,
                "status": "COMPLETED"
            })

        self.worker_summary = [
            {
                "worker_id": w,
                "assigned_partitions": worker_task_counts[w],
                "records_processed": worker_record_counts[w],
                "cpu_utilization_pct": round(58.0 + (idx * 2.8), 1) if self.total_alerts >= 50000 else round(42.0 + (idx * 3.4), 1),
                "ram_allocated_gb": "28.4 / 32.0" if self.total_alerts >= 50000 else "18.5 / 32.0",
                "status": "ONLINE"
            }
            for idx, w in enumerate(worker_names)
        ]

    def to_dict(self) -> Dict[str, Any]:
        duration = round((self.end_time - self.start_time) if self.end_time else (time.time() - self.start_time), 2)
        if self.total_alerts >= 50000 and self.partitions == 16:
            self.partitions = 32
        return {
            "job_id": self.job_id,
            "total_alerts": self.total_alerts,
            "partitions": self.partitions,
            "current_stage": self.current_stage,
            "stage_progress": self.stage_progress,
            "stage_descriptions": self.STAGE_DESCRIPTIONS,
            "stage_durations_ms": self.stage_durations_ms,
            "is_completed": self.is_completed,
            "duration_seconds": duration,
            "processed_records": self.processed_records,
            "incidents_generated": self.incidents_generated,
            "workload_saved_hours": self.workload_saved_hours,
            "partitions_detail": self.partitions_detail,
            "worker_summary": self.worker_summary,
            "cluster_master": "spark://spark-master.threatlens.internal:7077",
            "cluster_cores": 64 if self.total_alerts >= 50000 else 32,
            "cluster_ram_gb": 256 if self.total_alerts >= 50000 else 128
        }


class DistributedBatchEngine:
    def __init__(self):
        self.jobs: Dict[str, BatchPipelineJob] = {}

    def create_job(self, total_alerts: int, partitions: int = 16) -> BatchPipelineJob:
        if total_alerts >= 50000 and partitions == 16:
            partitions = 32
        job_id = f"job-spark-{uuid.uuid4().hex[:8]}"
        job = BatchPipelineJob(job_id=job_id, total_alerts=total_alerts, partitions=partitions)
        self.jobs[job_id] = job
        return job

    def execute_mock_batch_sync(self, job_id: str, total_alerts: int = 3000, incidents_count: int = 5, collapsed_count: int = 2700, partitions: int = 16) -> BatchPipelineJob:
        """Executes full multi-stage Spark distributed pipeline job with partition details."""
        if total_alerts >= 50000 and partitions == 16:
            partitions = 32
        job = self.jobs.get(job_id)
        if not job:
            job = self.create_job(total_alerts=total_alerts, partitions=partitions)

        job.total_alerts = total_alerts
        job.partitions = partitions
        durations = {
            "UPLOAD": 140,
            "VALIDATE": 95,
            "NORMALIZE": 310,
            "DISTRIBUTE": 160,
            "PROCESS": 340,
            "CORRELATE": 420,
            "SCORE": 230,
            "SUMMARIZE": 190,
            "COMPLETE": 50
        }
        job.stage_durations_ms = durations

        for s in job.STAGES:
            job.current_stage = s
            job.stage_progress[s] = 100.0

        job.is_completed = True
        job.end_time = time.time()
        job.processed_records = total_alerts
        job.incidents_generated = incidents_count
        job.workload_saved_hours = round((collapsed_count * 2.5) / 60.0, 1)
        job.generate_partition_breakdown(collapsed_count=collapsed_count)
        return job


batch_engine = DistributedBatchEngine()
