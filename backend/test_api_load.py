"""
Test datasets endpoint and loading 100k dataset via REST API.
"""
import urllib.request
import json

base_url = "http://127.0.0.1:8000"

print("[*] Testing /api/datasets...")
req = urllib.request.urlopen(f"{base_url}/api/datasets")
datasets = json.loads(req.read().decode("utf-8"))
print(f"[+] Retrieved {len(datasets)} available datasets:")
for d in datasets:
    print(f"    - {d['id']}: {d['name']} ({d['records_count']:,} records)")

print("\n[*] Testing loading 100,000 alert dataset via POST /api/datasets/load/dataset_bigdata_100k_csv...")
post_req = urllib.request.Request(
    f"{base_url}/api/datasets/load/dataset_bigdata_100k_csv",
    data=b"",
    headers={"Content-Type": "application/json"},
    method="POST"
)
resp = urllib.request.urlopen(post_req)
result = json.loads(resp.read().decode("utf-8"))
print("[+] Dataset load successful!")
print(f"    - Status: {result.get('status')}")
print(f"    - Ingested: {result.get('total_alerts_ingested'):,}")
print(f"    - Incidents: {result.get('incidents_created')}")
print(f"    - Collapsed: {result.get('collapsed_duplicates'):,} ({result.get('deduplication_ratio_pct')}%)")
print(f"    - Workload hours saved: {result.get('workload_hours_saved'):,} hours")
for inc in result.get("incidents", []):
    print(f"      * [{inc['id']}] {inc['severity']} | Risk {inc['risk_score']} | {inc['title']}")
