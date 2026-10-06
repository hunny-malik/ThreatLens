import urllib.request
import json

base = "http://localhost:8000"

def test_fp():
    # 0. Load Dataset 1
    print("Loading Dataset 1...")
    req_load = urllib.request.Request(f"{base}/api/datasets/load/dataset_1_storm_3000_csv", data=b'', method='POST')
    load_res = json.loads(urllib.request.urlopen(req_load).read().decode())
    print(f"Loaded: {load_res['dataset_name']} with {load_res['incidents_created']} incidents.")

    # 1. Check current incidents
    incs = json.loads(urllib.request.urlopen(f"{base}/api/incidents").read().decode())
    inc_id = incs[0]["id"]
    print(f"Target incident: {inc_id}, current status: {incs[0]['status']}")

    # 2. Update to False Positive
    payload = {
        "status": "False Positive",
        "notes": "Testing human triage: flagged as false positive by analyst",
        "analyst_name": "Duty Analyst",
        "analyst_role": "Tier-1 Analyst"
    }
    req = urllib.request.Request(
        f"{base}/api/incidents/{inc_id}/status",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    res = json.loads(urllib.request.urlopen(req).read().decode())
    print("Backend response:", res)

    # 3. Verify incident status
    updated_inc = json.loads(urllib.request.urlopen(f"{base}/api/incidents/{inc_id}").read().decode())
    print(f"Verified incident status in backend: {updated_inc['status']}")

if __name__ == "__main__":
    test_fp()
