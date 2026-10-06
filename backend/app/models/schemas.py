"""
ThreatLens Common Schema Definitions
Enterprise Security Alert Intelligence & Incident Correlation System
"""
from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field
import datetime


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AssetCriticality(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AssetType(str, Enum):
    DOMAIN_CONTROLLER = "Domain Controller"
    PRODUCTION_SERVER = "Production Server"
    DATABASE = "Database"
    EMPLOYEE_ENDPOINT = "Employee Endpoint"
    DEVELOPER_MACHINE = "Developer Machine"
    CLOUD_RESOURCE = "Cloud Resource"
    TEST_MACHINE = "Test Machine"


class AlertSource(str, Enum):
    FIREWALL = "Firewall"
    EDR = "EDR"
    SIEM = "SIEM"
    WINDOWS_EVENTS = "Windows Event Logs"
    LINUX_LOGS = "Linux Logs"
    AUTHENTICATION = "Authentication Systems"
    CLOUD_TRAIL = "Cloud Logs"
    IDS_IPS = "IDS/IPS"
    ZEEK_NETWORK = "Network Monitoring"
    APPLICATION_LOGS = "Application Logs"


class IncidentStatus(str, Enum):
    NEEDS_INVESTIGATION = "Needs Investigation"
    IN_PROGRESS = "In Progress"
    TRUE_POSITIVE = "True Positive"
    FALSE_POSITIVE = "False Positive"
    BENIGN = "Benign"
    ESCALATED = "Escalated"
    RESOLVED = "Resolved"


class ThreatClassification(str, Enum):
    KNOWN_THREAT = "Known Threat"
    SUSPICIOUS = "Suspicious"
    ANOMALOUS = "Anomalous"
    POTENTIAL_NOVEL_ATTACK = "Potential Novel Attack"


class AttackStage(str, Enum):
    INITIAL_ACCESS = "Initial Access"
    EXECUTION = "Execution"
    PERSISTENCE = "Persistence"
    PRIVILEGE_ESCALATION = "Privilege Escalation"
    CREDENTIAL_ACCESS = "Credential Access"
    DISCOVERY = "Discovery"
    LATERAL_MOVEMENT = "Lateral Movement"
    COLLECTION = "Collection"
    EXFILTRATION = "Exfiltration"


class UserRole(str, Enum):
    ANALYST = "Tier-1 Analyst"
    SENIOR_ANALYST = "Senior Analyst"
    SOC_LEAD = "SOC Lead / Admin"


class MitreTechnique(BaseModel):
    technique_id: str
    technique_name: str
    tactic: str
    confidence: float = Field(ge=0.0, le=1.0, default=0.85)
    evidence: str
    detection_source: str


class NormalizedAlert(BaseModel):
    id: str
    timestamp: str
    source: AlertSource
    alert_type: str
    severity: Severity
    source_ip: str
    destination_ip: str
    source_user: Optional[str] = None
    destination_user: Optional[str] = None
    host: str
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    asset_criticality: AssetCriticality = AssetCriticality.MEDIUM
    asset_type: AssetType = AssetType.EMPLOYEE_ENDPOINT
    process: Optional[str] = None
    parent_process: Optional[str] = None
    file_hash: Optional[str] = None
    domain: Optional[str] = None
    raw_message: str
    confidence: float = Field(ge=0.0, le=1.0, default=0.8)
    detection_rule: str
    mitre_technique_id: Optional[str] = None
    mitre_technique_name: Optional[str] = None
    mitre_tactic: Optional[str] = None
    is_anomalous: bool = False
    anomaly_reasons: List[str] = Field(default_factory=list)
    raw_source_format: Optional[str] = None


class AttackChainStep(BaseModel):
    stage: AttackStage
    technique_id: str
    technique_name: str
    tactic: str
    timestamp: str
    source: str
    evidence: str
    confidence: float
    related_alert_ids: List[str] = Field(default_factory=list)


class RiskExplanation(BaseModel):
    base_severity_score: float
    asset_criticality_multiplier: float
    asset_criticality_reason: str
    attack_stage_multiplier: float
    attack_stage_reason: str
    entity_importance_multiplier: float
    confidence_weight: float
    behavioral_anomaly_boost: float
    campaign_boost: float
    final_score: float
    explanation: str


class AISummary(BaseModel):
    what_happened: str
    why_it_matters: str
    affected_assets: List[str]
    attack_stage: str
    mitre_techniques: List[str]
    evidence_highlights: List[str]
    risk_level: str
    confidence: float
    recommended_next_steps: List[str]
    analyst_status: str = "Unreviewed"  # Accepted, Modified, Rejected
    analyst_edited_summary: Optional[str] = None
    analyst_notes: Optional[str] = None


class InvestigationStep(BaseModel):
    priority: int
    action: str
    target_entity: str
    rationale: str
    evidence_pointer: str
    completed: bool = False


class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    analyst_id: str
    analyst_name: str
    analyst_role: str
    action: str
    incident_id: Optional[str] = None
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    notes: Optional[str] = None


class Asset(BaseModel):
    id: str
    name: str
    type: AssetType
    criticality: AssetCriticality
    ip_address: str
    os: str
    owner: str
    active_incidents_count: int = 0
    risk_score: float = 0.0
    tags: List[str] = Field(default_factory=list)


class Incident(BaseModel):
    id: str
    title: str
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    risk_score: float = Field(ge=0.0, le=100.0)
    severity: Severity
    status: IncidentStatus = IncidentStatus.NEEDS_INVESTIGATION
    threat_classification: ThreatClassification = ThreatClassification.SUSPICIOUS
    confidence: float = Field(ge=0.0, le=1.0)
    primary_asset: str
    primary_asset_criticality: AssetCriticality
    primary_asset_type: AssetType
    affected_assets: List[str] = Field(default_factory=list)
    users_involved: List[str] = Field(default_factory=list)
    source_ips: List[str] = Field(default_factory=list)
    destination_ips: List[str] = Field(default_factory=list)
    domains: List[str] = Field(default_factory=list)
    hashes: List[str] = Field(default_factory=list)
    
    total_alerts: int
    deduplicated_alerts_count: int
    collapsed_summary: str  # e.g., "487 duplicate/related alerts collapsed"
    
    first_seen: str
    last_seen: str
    duration_minutes: float
    
    attack_chain: List[AttackChainStep] = Field(default_factory=list)
    mitre_techniques: List[MitreTechnique] = Field(default_factory=list)
    risk_explanation: RiskExplanation
    ai_summary: AISummary
    recommended_actions: List[InvestigationStep] = Field(default_factory=list)
    correlation_reasons: List[str] = Field(default_factory=list)
    
    historical_fp_rate_for_pattern: float = 0.0
    assigned_analyst: Optional[str] = None
    analyst_notes: Optional[str] = None
    alert_ids: List[str] = Field(default_factory=list)
    sample_alerts: List[NormalizedAlert] = Field(default_factory=list)


class ThreatCampaign(BaseModel):
    id: str
    name: str
    threat_actor_alias: str
    confidence: float
    risk_score: float
    incidents_count: int
    incident_ids: List[str]
    affected_assets: List[str]
    common_indicators: Dict[str, List[str]]  # ips, domains, hashes, users
    mitre_tactics: List[str]
    mitre_techniques: List[str]
    first_detected: str
    last_detected: str
    description: str


class PipelineStats(BaseModel):
    ingested_total: int
    processed_total: int
    throughput_eps: float
    latency_ms: float
    worker_nodes: int
    active_workers: int
    queue_size: int
    lag_records: int
    failed_events: int
    batch_mode_active: bool
    streaming_mode_active: bool
    spark_partitions: int
    kafka_partitions: int
    single_node_eps: float
    distributed_eps: float


class MTTTMetrics(BaseModel):
    baseline_mttt_minutes: float
    assisted_mttt_minutes: float
    reduction_percentage: float
    avg_alerts_per_incident: float
    total_alerts_collapsed: int
    workload_hours_saved: float
    incidents_created: int
    ai_summary_acceptance_rate: float
    time_to_first_decision_seconds: float
    time_to_escalation_seconds: float
    total_analyst_actions: int


class ScalabilityBenchmark(BaseModel):
    alert_volume: int
    single_node_time_sec: float
    distributed_time_sec: float
    single_node_throughput: float
    distributed_throughput: float
    speedup_factor: float
    memory_peak_mb: float
    spark_partitions: int
