"""
ThreatLens Dataset Management & Upload API
Enables loading pre-bundled enterprise security datasets (CSV/JSON)
and uploading custom telemetry files for distributed processing and correlation.
"""
import os
import csv
import json
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Dict, Any

from app.core.state import app_state
from app.models.schemas import NormalizedAlert
from app.engine.normalizer import AlertNormalizer
from app.engine.correlator import IncidentCorrelationEngine
from app.engine.campaign_clusterer import CampaignClusterer
from app.distributed.stream_broker import stream_broker

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

DATASETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "datasets"))

AVAILABLE_DATASETS = [
  {
    "id": "dataset_1_storm_3000_csv",
    "name": "Dataset 1: Multi-Attack Telemetry Storm (5 Attacks, Critical Risk)",
    "filename": "1_multi_attack_enterprise_storm_3000.csv",
    "format": "CSV",
    "threat_category": "Multi-Campaign Concurrency (5 Simultaneous Attacks)",
    "attack_count": 5,
    "risk_level": "CRITICAL",
    "description": "3,000 multi-source events featuring 5 simultaneous independent attacks: APT29 LSASS credential dumping, FIN7 payment API SQLi & 4.2GB DB exfil, LockBit Ransomware npm dropper, Cloud Rogue Admin Tor login to S3 theft, and Novel Zero-Day AppData temp masquerade. 99.3% deduplication.",
    "telemetry_sources": ["EDR", "Firewall", "Windows Event Logs", "Linux Logs", "Auth", "Zeek", "Cloud"],
    "records_count": 3000
  },
  {
    "id": "dataset_1_storm_3000_json",
    "name": "Dataset 1: Multi-Attack Telemetry Storm (5 Attacks, Critical Risk - JSON)",
    "filename": "1_multi_attack_enterprise_storm_3000.json",
    "format": "JSON",
    "threat_category": "Multi-Campaign Concurrency (5 Simultaneous Attacks)",
    "attack_count": 5,
    "risk_level": "CRITICAL",
    "description": "Complete production JSON array containing 3,000 multi-source security events with 5 simultaneous attack chains and ground-truth labels for distributed streaming and disentanglement.",
    "telemetry_sources": ["EDR", "Firewall", "Windows Event Logs", "Linux Logs", "Auth", "Zeek", "Cloud"],
    "records_count": 3000
  },
  {
    "id": "dataset_2_dual_3000_csv",
    "name": "Dataset 2: Dual Targeted Intrusion (2 Attacks, High/Medium Risk)",
    "filename": "2_dual_moderate_campaign_3000.csv",
    "format": "CSV",
    "threat_category": "Targeted Corporate Intrusion (2 Simultaneous Campaigns)",
    "attack_count": 2,
    "risk_level": "HIGH",
    "description": "3,000 events featuring exactly 2 distinct attacks: FIN7 e-commerce SQL injection with database reconnaissance, and automated credential stuffing with domain admin account takeover against Active Directory.",
    "telemetry_sources": ["Application Logs", "Linux Logs", "Authentication Systems", "Firewall"],
    "records_count": 3000
  },
  {
    "id": "dataset_2_dual_3000_json",
    "name": "Dataset 2: Dual Targeted Intrusion (2 Attacks, High/Medium Risk - JSON)",
    "filename": "2_dual_moderate_campaign_3000.json",
    "format": "JSON",
    "threat_category": "Targeted Corporate Intrusion (2 Simultaneous Campaigns)",
    "attack_count": 2,
    "risk_level": "HIGH",
    "description": "JSON representation of 3,000 records containing exactly 2 attack campaigns surrounded by 2,880 routine operational logs.",
    "telemetry_sources": ["Application Logs", "Linux Logs", "Authentication Systems", "Firewall"],
    "records_count": 3000
  },
  {
    "id": "dataset_3_insider_3000_csv",
    "name": "Dataset 3: Stealth Insider Data Staging (1 Attack, Medium/Low Risk)",
    "filename": "3_stealth_insider_low_3000.csv",
    "format": "CSV",
    "threat_category": "Low-and-Slow Insider Threat & Data Governance",
    "attack_count": 1,
    "risk_level": "MEDIUM",
    "description": "3,000 events containing exactly 1 subtle insider threat: authorized analyst performing slow off-hours S3 downloads of confidential ledgers into encrypted 7z archives without volumetric alarms. 2,965 routine logs.",
    "telemetry_sources": ["Cloud Logs", "EDR", "Network Monitoring"],
    "records_count": 3000
  },
  {
    "id": "dataset_3_insider_3000_json",
    "name": "Dataset 3: Stealth Insider Data Staging (1 Attack, Medium/Low Risk - JSON)",
    "filename": "3_stealth_insider_low_3000.json",
    "format": "JSON",
    "threat_category": "Low-and-Slow Insider Threat & Data Governance",
    "attack_count": 1,
    "risk_level": "MEDIUM",
    "description": "JSON format of 3,000 events capturing 1 subtle insider data exfiltration activity.",
    "telemetry_sources": ["Cloud Logs", "EDR", "Network Monitoring"],
    "records_count": 3000
  },
  {
    "id": "dataset_4_clean_3000_csv",
    "name": "Dataset 4: Clean Enterprise Baseline (0 Attacks / 100% Benign)",
    "filename": "4_clean_enterprise_zero_attacks_3000.csv",
    "format": "CSV",
    "threat_category": "Baseline Operational Normal (Zero Threats)",
    "attack_count": 0,
    "risk_level": "CLEAN",
    "description": "3,000 pure operational events: scheduled database backups, routine Windows Event 4688 executions, IT Tanium inventory queries, legitimate Kerberos renewals, and DNS queries. Zero cyberattacks. Tests zero false-positive hallucination.",
    "telemetry_sources": ["Windows Event Logs", "Firewall", "EDR", "Authentication Systems", "Network Monitoring"],
    "records_count": 3000
  },
  {
    "id": "dataset_4_clean_3000_json",
    "name": "Dataset 4: Clean Enterprise Baseline (0 Attacks / 100% Benign - JSON)",
    "filename": "4_clean_enterprise_zero_attacks_3000.json",
    "format": "JSON",
    "threat_category": "Baseline Operational Normal (Zero Threats)",
    "attack_count": 0,
    "risk_level": "CLEAN",
    "description": "JSON format of 3,000 100% benign operational telemetry events. Results in 0 incident tickets created.",
    "telemetry_sources": ["Windows Event Logs", "Firewall", "EDR", "Authentication Systems", "Network Monitoring"],
    "records_count": 3000
  },
  {
    "id": "dataset_5_scanner_3000_csv",
    "name": "Dataset 5: Perimeter Scanner Storm + Fast Ransomware (1 Critical Attack)",
    "filename": "5_perimeter_scanner_ransomware_3000.csv",
    "format": "CSV",
    "threat_category": "Extreme Deduplication Stress-Test & Rapid Outbreak",
    "attack_count": 1,
    "risk_level": "CRITICAL",
    "description": "3,000 events featuring 2,860 repetitive Nessus vulnerability scanner sweeps and perimeter drops (90.5% deduplication collapsing) plus 1 fast LockBit ransomware outbreak attempting VSS shadow copy purge and lateral spray.",
    "telemetry_sources": ["Firewall", "EDR"],
    "records_count": 3000
  },
  {
    "id": "dataset_5_scanner_3000_json",
    "name": "Dataset 5: Perimeter Scanner Storm + Fast Ransomware (1 Attack - JSON)",
    "filename": "5_perimeter_scanner_ransomware_3000.json",
    "format": "JSON",
    "threat_category": "Extreme Deduplication Stress-Test & Rapid Outbreak",
    "attack_count": 1,
    "risk_level": "CRITICAL",
    "description": "JSON format of 3,000 events testing needle-in-a-haystack deduplication under scanner noise storm.",
    "telemetry_sources": ["Firewall", "EDR"],
    "records_count": 3000
  },
  {
    "id": "dataset_6_policy_3000_csv",
    "name": "Dataset 6: Compliance Policy Violations & Shadow IT (2 Low-Risk Anomalies)",
    "filename": "6_policy_violations_low_risk_3000.csv",
    "format": "CSV",
    "threat_category": "Internal Governance & Shadow IT (No External Attacks)",
    "attack_count": 2,
    "risk_level": "LOW",
    "description": "3,000 events containing exactly 2 low-severity governance violations: unauthorized BitTorrent P2P client on HR laptop and unapproved personal Dropbox cloud sync. Zero external APTs, low risk scores.",
    "telemetry_sources": ["EDR", "Network Monitoring", "Windows Event Logs"],
    "records_count": 3000
  },
  {
    "id": "dataset_6_policy_3000_json",
    "name": "Dataset 6: Compliance Policy Violations & Shadow IT (2 Anomalies - JSON)",
    "filename": "6_policy_violations_low_risk_3000.json",
    "format": "JSON",
    "threat_category": "Internal Governance & Shadow IT (No External Attacks)",
    "attack_count": 2,
    "risk_level": "LOW",
    "description": "JSON format of 3,000 events capturing 2 low-risk acceptable use policy violations.",
    "telemetry_sources": ["EDR", "Network Monitoring", "Windows Event Logs"],
    "records_count": 3000
  },
  {
    "id": "enterprise_3000_csv",
    "name": "Original 3,000 Alerts Challenge Benchmark (Enterprise CSV)",
    "filename": "enterprise_3000_alerts_challenge.csv",
    "format": "CSV",
    "threat_category": "Full Shift Simulation (3,000 Events)",
    "attack_count": 5,
    "risk_level": "CRITICAL",
    "description": "Complete production benchmark containing simultaneous attacks (APT29, FIN7, Ransomware, Cloud Exfil, Novel Zero-Day) surrounded by 2,700+ repetitive benign telemetry events.",
    "telemetry_sources": ["EDR", "Firewall", "Windows Event Logs", "Linux Logs", "Auth", "Zeek", "Cloud"],
    "records_count": 3000
  },
  {
    "id": "dataset_bigdata_100k_csv",
    "name": "Big Data Benchmark: 100,000 Enterprise Logs (10 Attacks, CSV)",
    "filename": "bigdata_100k_enterprise_multi_attack.csv",
    "format": "CSV",
    "threat_category": "Big Data Scale Stress-Test (100,000 Events, 32 Spark Partitions)",
    "attack_count": 10,
    "risk_level": "CRITICAL",
    "description": "Massive 100,000 telemetry events benchmark testing high-volume distributed ingestion, 32-partition Spark RDD map-reduce, and graph disentanglement across 10 simultaneous cyberattacks (APT29, FIN7, LockBit, Tor Exfil, Zero-Day, AD Kerberoasting, CI/CD Poisoning, Insider HR Staging, SCADA Modbus, and SSO Credential Stuffing). 99.9% deduplication collapsing.",
    "telemetry_sources": ["EDR", "Firewall", "Windows Event Logs", "Linux Logs", "Auth", "Network Monitoring", "Cloud"],
    "records_count": 100000
  },
  {
    "id": "dataset_bigdata_100k_json",
    "name": "Big Data Benchmark: 100,000 Enterprise Logs (10 Attacks, JSON)",
    "filename": "bigdata_100k_enterprise_multi_attack.json",
    "format": "JSON",
    "threat_category": "Big Data Scale Stress-Test (100,000 Events, 32 Spark Partitions)",
    "attack_count": 10,
    "risk_level": "CRITICAL",
    "description": "Complete 100,000 record JSON dataset benchmarking enterprise scale event-per-second (EPS) ingestion, 32-partition RDD mapping, and 10 simultaneous attack campaigns.",
    "telemetry_sources": ["EDR", "Firewall", "Windows Event Logs", "Linux Logs", "Auth", "Network Monitoring", "Cloud"],
    "records_count": 100000
  }
]


def parse_raw_records(content: str, filename: str) -> List[Dict[str, Any]]:
    """Parses raw text content as either JSON array or CSV."""
    records = []
    if filename.endswith(".json") or content.strip().startswith("["):
        try:
            records = json.loads(content)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")
    else:
        # Assume CSV
        try:
            reader = csv.DictReader(io.StringIO(content))
            for row in reader:
                records.append(dict(row))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")
    return records


@router.get("")
def list_available_datasets():
    """Returns catalog of bundled enterprise datasets."""
    return AVAILABLE_DATASETS


@router.post("/load/{dataset_id}")
def load_dataset(dataset_id: str):
    """Loads one of the bundled sample datasets directly into the correlation engine."""
    matched = next((d for d in AVAILABLE_DATASETS if d["id"] == dataset_id), None)
    if not matched:
        raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")

    file_path = os.path.join(DATASETS_DIR, matched["filename"])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail=f"Dataset file {matched['filename']} missing on server")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    raw_records = parse_raw_records(content, matched["filename"])
    normalized_alerts = [AlertNormalizer.normalize(r) for r in raw_records]

    # Ingest into stream broker
    for a in normalized_alerts:
        stream_broker.publish_alert(a)

    # Correlate into incidents
    incidents, dedup_metrics = IncidentCorrelationEngine.process_telemetry(normalized_alerts)
    
    # Update live state
    app_state.raw_alerts = normalized_alerts
    app_state.incidents = incidents
    app_state.last_dedup_metrics = dedup_metrics
    app_state.campaigns = CampaignClusterer.cluster_incidents(incidents)

    for asset in app_state.assets:
        asset.active_incidents_count = sum(
            1 for inc in incidents if asset.name in inc.affected_assets or asset.ip_address in inc.destination_ips
        )

    return {
        "status": "success",
        "dataset_name": matched["name"],
        "threat_category": matched["threat_category"],
        "total_alerts_ingested": len(normalized_alerts),
        "incidents_created": len(incidents),
        "collapsed_duplicates": dedup_metrics.get("collapsed_duplicates", 0),
        "deduplication_ratio_pct": dedup_metrics.get("deduplication_ratio", 0.0),
        "workload_hours_saved": dedup_metrics.get("workload_hours_saved", 0.0),
        "active_campaigns": len(app_state.campaigns),
        "incidents": [
            {
                "id": i.id,
                "title": i.title,
                "risk_score": i.risk_score,
                "severity": i.severity.value,
                "primary_asset": i.primary_asset,
                "threat_classification": i.threat_classification.value,
                "attack_chain_stages": [s.stage.value for s in i.attack_chain]
            }
            for i in incidents
        ]
    }


@router.post("/upload")
async def upload_custom_dataset(file: UploadFile = File(...)):
    """Uploads an arbitrary CSV, JSON, or log file to process through the correlation pipeline."""
    try:
        content_bytes = await file.read()
        content = content_bytes.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Unable to read file content: {str(e)}")

    raw_records = parse_raw_records(content, file.filename or "telemetry.csv")
    if not raw_records:
        raise HTTPException(status_code=400, detail="Uploaded dataset contains zero records")

    normalized_alerts = [AlertNormalizer.normalize(r) for r in raw_records]

    # Ingest into stream broker
    for a in normalized_alerts:
        stream_broker.publish_alert(a)

    # Run complete correlation pipeline
    incidents, dedup_metrics = IncidentCorrelationEngine.process_telemetry(normalized_alerts)

    # Update state
    app_state.raw_alerts = normalized_alerts
    app_state.incidents = incidents
    app_state.last_dedup_metrics = dedup_metrics
    app_state.campaigns = CampaignClusterer.cluster_incidents(incidents)

    for asset in app_state.assets:
        asset.active_incidents_count = sum(
            1 for inc in incidents if asset.name in inc.affected_assets or asset.ip_address in inc.destination_ips
        )

    return {
        "status": "success",
        "filename": file.filename,
        "total_alerts_ingested": len(normalized_alerts),
        "incidents_created": len(incidents),
        "collapsed_duplicates": dedup_metrics.get("collapsed_duplicates", 0),
        "deduplication_ratio_pct": dedup_metrics.get("deduplication_ratio", 0.0),
        "workload_hours_saved": dedup_metrics.get("workload_hours_saved", 0.0),
        "active_campaigns": len(app_state.campaigns),
        "incidents": [
            {
                "id": i.id,
                "title": i.title,
                "risk_score": i.risk_score,
                "severity": i.severity.value,
                "primary_asset": i.primary_asset,
                "threat_classification": i.threat_classification.value,
                "attack_chain_stages": [s.stage.value for s in i.attack_chain]
            }
            for i in incidents
        ]
    }
