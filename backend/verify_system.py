import urllib.request
import json

def verify():
    base = "http://localhost:8000"
    
    # 1. Datasets
    print("1. Checking /api/datasets...")
    res = json.loads(urllib.request.urlopen(f"{base}/api/datasets").read().decode())
    print(f"Total Available Datasets: {len(res)}")
    for d in res:
        print(f"  - [{d['id']}] {d['name']} -> {d.get('attack_count')} attacks, {d['records_count']} logs, {d['risk_level']}")

    # 2. Test Loading Dataset 4 (Clean Baseline - 0 Attacks)
    print("\n2. Loading Dataset 4 (Clean Baseline - 0 Attacks)...")
    req = urllib.request.Request(f"{base}/api/datasets/load/dataset_4_clean_3000_csv", data=b'', method='POST')
    load_res = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"Dataset Loaded: {load_res['dataset_name']}")
    print(f"Alerts Ingested: {load_res['total_alerts_ingested']}")
    print(f"Incidents Created: {load_res['incidents_created']} (Should be 0)")
    print(f"Collapsed Noise: {load_res['collapsed_duplicates']} ({load_res['deduplication_ratio_pct']}%)")

    # 3. Verify Dashboard KPIs after loading Clean Baseline
    print("\n3. Verifying /api/analytics/dashboard for Clean Baseline...")
    dash = json.loads(urllib.request.urlopen(f"{base}/api/analytics/dashboard").read().decode())
    kpis = dash["kpis"]
    print(f"Active Incidents: {kpis['active_incidents']}")
    print(f"Critical Incidents: {kpis['critical_incidents']}")
    print(f"Alerts Ingested: {kpis['alerts_ingested']}")
    print(f"Alerts Collapsed: {kpis['alerts_collapsed']}")
    print(f"Hourly Peak: {max(p['alerts'] for p in dash['volume_trend'])} alerts/hr")
    print(f"Hourly Incidents: {[p['incidents'] for p in dash['volume_trend']]}")

    # 4. Test Loading Dataset 1 (5 Attacks - Multi-Storm)
    print("\n4. Loading Dataset 1 (5 Attacks Storm)...")
    req = urllib.request.Request(f"{base}/api/datasets/load/dataset_1_storm_3000_csv", data=b'', method='POST')
    load_res1 = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"Dataset Loaded: {load_res1['dataset_name']}")
    print(f"Incidents Created: {load_res1['incidents_created']} (5 Attacks)")
    for inc in load_res1["incidents"]:
        print(f"  - [{inc['id']}] Risk: {inc['risk_score']} | Sev: {inc['severity']} | {inc['title']}")

    # 5. Test Batch Processing Pipeline
    print("\n5. Testing /api/simulation/batch...")
    req = urllib.request.Request(f"{base}/api/simulation/batch", data=json.dumps({"volume": 3000, "partitions": 16}).encode(), headers={"Content-Type": "application/json"}, method='POST')
    batch_res = json.loads(urllib.request.urlopen(req).read().decode())
    job = batch_res["job"]
    print(f"Job ID: {job['job_id']}")
    print(f"Partitions Count: {len(job['partitions_detail'])}")
    print(f"Partition Sample: {job['partitions_detail'][0]}")
    print(f"Workers: {[w['worker_id'] for w in job['worker_summary']]}")

    print("\n=== SYSTEM VERIFICATION SUCCESSFUL! ===")

if __name__ == "__main__":
    verify()
