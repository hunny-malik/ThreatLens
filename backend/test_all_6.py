import os
import sys
import json

sys.path.insert(0, os.path.dirname(__file__))
from app.engine.normalizer import AlertNormalizer
from app.engine.correlator import IncidentCorrelationEngine

datasets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))

target_files = [
    "1_multi_attack_enterprise_storm_3000.json",
    "2_dual_moderate_campaign_3000.json",
    "3_stealth_insider_low_3000.json",
    "4_clean_enterprise_zero_attacks_3000.json",
    "5_perimeter_scanner_ransomware_3000.json",
    "6_policy_violations_low_risk_3000.json"
]

for filename in target_files:
    path = os.path.join(datasets_dir, filename)
    with open(path, "r", encoding="utf-8") as f:
        raw_list = json.load(f)
    
    normalized = [AlertNormalizer.normalize(r) for r in raw_list]
    incidents, dedup = IncidentCorrelationEngine.process_telemetry(normalized)
    
    print("=" * 65)
    print(f"Dataset: {filename}")
    print(f"Total Alerts: {len(normalized):,} | Correlated Incidents: {len(incidents)}")
    print(f"Duplicates Collapsed: {dedup.get('collapsed_duplicates', 0):,} ({dedup.get('deduplication_ratio', 0)}%)")
    print(f"Incident Titles & Risk Scores:")
    for inc in incidents:
        print(f"  - [{inc.id}] (Risk: {inc.risk_score:4.1f} | Sev: {inc.severity.value:8s}) {inc.title}")
    if not incidents:
        print("  - [CLEAN] 0 Incidents Created (Pure Benign Baseline)")
