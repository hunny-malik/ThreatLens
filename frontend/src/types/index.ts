/**
 * ThreatLens Enterprise TypeScript Domain Definitions
 */

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AssetCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AssetType =
  | 'Domain Controller'
  | 'Production Server'
  | 'Database'
  | 'Employee Endpoint'
  | 'Developer Machine'
  | 'Cloud Resource'
  | 'Test Machine';

export type IncidentStatus =
  | 'Needs Investigation'
  | 'In Progress'
  | 'True Positive'
  | 'False Positive'
  | 'Benign'
  | 'Escalated'
  | 'Resolved';

export type ThreatClassification =
  | 'Known Threat'
  | 'Suspicious'
  | 'Anomalous'
  | 'Potential Novel Attack';

export type AttackStage =
  | 'Initial Access'
  | 'Execution'
  | 'Persistence'
  | 'Privilege Escalation'
  | 'Credential Access'
  | 'Discovery'
  | 'Lateral Movement'
  | 'Collection'
  | 'Exfiltration';

export interface MitreTechnique {
  technique_id: string;
  technique_name: string;
  tactic: string;
  confidence: number;
  evidence: string;
  detection_source: string;
}

export interface NormalizedAlert {
  id: string;
  timestamp: string;
  source: string;
  alert_type: string;
  severity: Severity;
  source_ip: string;
  destination_ip: string;
  source_user?: string;
  destination_user?: string;
  host: string;
  asset_id?: string;
  asset_name?: string;
  asset_criticality: AssetCriticality;
  asset_type: AssetType;
  process?: string;
  parent_process?: string;
  file_hash?: string;
  domain?: string;
  raw_message: string;
  confidence: number;
  detection_rule: string;
  mitre_technique_id?: string;
  mitre_technique_name?: string;
  mitre_tactic?: string;
  is_anomalous: boolean;
  anomaly_reasons: string[];
}

export interface AttackChainStep {
  stage: AttackStage;
  technique_id: string;
  technique_name: string;
  tactic: string;
  timestamp: string;
  source: string;
  evidence: string;
  confidence: number;
  related_alert_ids: string[];
}

export interface RiskExplanation {
  base_severity_score: number;
  asset_criticality_multiplier: number;
  asset_criticality_reason: string;
  attack_stage_multiplier: number;
  attack_stage_reason: string;
  entity_importance_multiplier: number;
  confidence_weight: number;
  behavioral_anomaly_boost: number;
  campaign_boost: number;
  final_score: number;
  explanation: string;
}

export interface AISummary {
  what_happened: string;
  why_it_matters: string;
  affected_assets: string[];
  attack_stage: string;
  mitre_techniques: string[];
  evidence_highlights: string[];
  risk_level: string;
  confidence: number;
  recommended_next_steps: string[];
  analyst_status: string;
  analyst_edited_summary?: string;
  analyst_notes?: string;
}

export interface InvestigationStep {
  priority: number;
  action: string;
  target_entity: string;
  rationale: string;
  evidence_pointer: string;
  completed: boolean;
}

export interface Incident {
  id: string;
  title: string;
  campaign_id?: string;
  campaign_name?: string;
  risk_score: number;
  severity: Severity;
  status: IncidentStatus;
  threat_classification: ThreatClassification;
  confidence: number;
  primary_asset: string;
  primary_asset_criticality: AssetCriticality;
  primary_asset_type: AssetType;
  affected_assets: string[];
  users_involved: string[];
  source_ips: string[];
  destination_ips: string[];
  domains: string[];
  hashes: string[];
  total_alerts: number;
  deduplicated_alerts_count: number;
  collapsed_summary: string;
  first_seen: string;
  last_seen: string;
  duration_minutes: number;
  attack_chain: AttackChainStep[];
  mitre_techniques: MitreTechnique[];
  risk_explanation: RiskExplanation;
  ai_summary: AISummary;
  recommended_actions: InvestigationStep[];
  correlation_reasons: string[];
  historical_fp_rate_for_pattern: number;
  assigned_analyst?: string;
  analyst_notes?: string;
  alert_ids: string[];
  sample_alerts: NormalizedAlert[];
}

export interface ThreatCampaign {
  id: string;
  name: string;
  threat_actor_alias: string;
  confidence: number;
  risk_score: number;
  incidents_count: number;
  incident_ids: string[];
  affected_assets: string[];
  common_indicators: {
    ips: string[];
    domains: string[];
    hashes: string[];
    users: string[];
  };
  mitre_tactics: string[];
  mitre_techniques: string[];
  first_detected: string;
  last_detected: string;
  description: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  criticality: AssetCriticality;
  ip_address: string;
  os: string;
  owner: string;
  active_incidents_count: number;
  risk_score: number;
  tags: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  analyst_id: string;
  analyst_name: string;
  analyst_role: string;
  action: string;
  incident_id?: string;
  previous_value?: string;
  new_value?: string;
  notes?: string;
}

export interface DashboardKPIs {
  kpis: {
    active_incidents: number;
    critical_incidents: number;
    alerts_ingested: number;
    alerts_correlated: number;
    alerts_collapsed: number;
    false_positive_rate: number;
    mttt_baseline_minutes: number;
    mttt_assisted_minutes: number;
    mttt_reduction_percentage: number;
    workload_hours_saved: number;
    processing_throughput_eps: number;
    processing_latency_ms: number;
    worker_nodes: number;
  };
  mttt_breakdown: {
    baseline_mttt_minutes: number;
    assisted_mttt_minutes: number;
    reduction_percentage: number;
    avg_alerts_per_incident: number;
    total_alerts_collapsed: number;
    workload_hours_saved: number;
    incidents_created: number;
    ai_summary_acceptance_rate: number;
    time_to_first_decision_seconds: number;
    time_to_escalation_seconds: number;
    total_analyst_actions: number;
  };
  severity_distribution: Record<string, number>;
  criticality_distribution: Record<string, number>;
  top_affected_assets: Array<{ asset: string; incident_count: number }>;
  volume_trend: Array<{ time: string; alerts: number; incidents: number }>;
  active_campaigns_count: number;
}

export interface ScalabilityBenchmark {
  alert_volume: number;
  single_node_time_sec: number;
  distributed_time_sec: number;
  single_node_throughput: number;
  distributed_throughput: number;
  speedup_factor: number;
  memory_peak_mb: number;
  spark_partitions: number;
}

export interface PipelineStatus {
  pipeline_metrics: {
    ingested_total: number;
    processed_total: number;
    throughput_eps: number;
    latency_ms: number;
    worker_nodes: number;
    active_workers: number;
    queue_size: number;
    lag_records: number;
    failed_events: number;
    batch_mode_active: boolean;
    streaming_mode_active: boolean;
    spark_partitions: number;
    kafka_partitions: number;
    single_node_eps: number;
    distributed_eps: number;
  };
  spark_cluster: {
    master_url: string;
    total_cores: number;
    memory_total_gb: number;
    active_applications: number;
    completed_jobs: number;
    jobs_history: any[];
    workers: any[];
  };
  kafka_cluster: {
    bootstrap_servers: string;
    total_partitions: number;
    total_consumer_groups: number;
    active_consumers: number;
    partitions: any[];
  };
  hdfs_storage: {
    cluster_name: string;
    namenode_status: string;
    total_capacity_tb: number;
    used_capacity_tb: number;
    free_capacity_tb: number;
    replication_factor: number;
    under_replicated_blocks: number;
    corrupt_blocks: number;
  };
}
