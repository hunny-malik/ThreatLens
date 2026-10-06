"""
Test loading and correlating 100,000 alerts with ThreatLens correlation engine.
"""
import os
import sys
import json
import time

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.models.schemas import NormalizedAlert
from app.engine.normalizer import AlertNormalizer
from app.engine.correlator import IncidentCorrelationEngine

dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "bigdata_100k_enterprise_multi_attack.json"))

print(f"[*] Testing 100,000 logs correlation from: {dataset_path}")
t0 = time.time()
with open(dataset_path, "r", encoding="utf-8") as f:
    raw_records = json.load(f)
t_read = time.time() - t0
print(f"[+] Loaded {len(raw_records):,} raw JSON records in {t_read:.2f}s")

t0 = time.time()
normalized = [AlertNormalizer.normalize(r) for r in raw_records]
t_norm = time.time() - t0
print(f"[+] Normalized {len(normalized):,} alerts in {t_norm:.2f}s ({len(normalized)/t_norm:,.0f} alerts/sec)")

t0 = time.time()
incidents, dedup = IncidentCorrelationEngine.process_telemetry(normalized)
t_corr = time.time() - t0
print(f"[+] Correlated into {len(incidents)} incidents in {t_corr:.2f}s")
print(f"[+] Deduplication metrics: Collapsed {dedup.get('collapsed_duplicates', 0):,} duplicates ({dedup.get('deduplication_ratio', 0)}% ratio)")
print(f"[+] Workload hours saved: {dedup.get('workload_hours_saved', 0):,} hours")

for inc in incidents:
    print(f"    - [{inc.id}] {inc.severity.value} | Risk {inc.risk_score:.1f} | {inc.title} (Alerts in incident: {inc.total_alerts:,})")
