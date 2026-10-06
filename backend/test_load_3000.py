import urllib.request
import json

def test():
    req = urllib.request.Request('http://localhost:8000/api/datasets/load/enterprise_3000_csv', data=b'', method='POST')
    res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print("Dataset:", res["dataset_name"])
    print("Total Alerts Ingested:", res["total_alerts_ingested"])
    print("Incidents Created:", res["incidents_created"])
    print("Collapsed Duplicates:", res["collapsed_duplicates"])
    print(f"Deduplication Ratio: {res['deduplication_ratio_pct']}%")
    print(f"Fatigue Workload Hours Saved: {res['workload_hours_saved']} hours")
    print("\nSample Generated Incidents:")
    for inc in res["incidents"][:4]:
        print(f" - [{inc['id']}] {inc['title']} (Risk: {inc['risk_score']})")

if __name__ == "__main__":
    test()
