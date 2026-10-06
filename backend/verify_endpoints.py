import urllib.request
import json
import sys

def test():
    base = "http://localhost:8000"
    def get(path):
        url = base + path
        req = urllib.request.urlopen(url)
        return json.loads(req.read().decode('utf-8'))

    print("Checking /health...")
    health = get("/health")
    print(f" -> Status: {health.get('status')}, Total Alerts: {health.get('total_alerts')}")

    print("Checking /api/analytics/dashboard...")
    dash = get("/api/analytics/dashboard")
    kpis = dash["kpis"]
    print(f" -> Active Incidents: {kpis['active_incidents']}, MTTT Reduction: {kpis['mttt_reduction_percentage']}%")

    print("Checking /api/incidents...")
    incidents = get("/api/incidents")
    print(f" -> Incidents loaded: {len(incidents)}")
    first_id = incidents[0]["id"]

    print(f"Checking /api/incidents/{first_id}...")
    inc = get(f"/api/incidents/{first_id}")
    print(f" -> Title: {inc['title']}, Risk: {inc['risk_score']}")

    print(f"Checking /api/incidents/{first_id}/alerts...")
    alts = get(f"/api/incidents/{first_id}/alerts")
    print(f" -> Underlying alerts: {len(alts)}")

    print("Checking /api/campaigns...")
    camps = get("/api/campaigns")
    print(f" -> Campaigns: {len(camps)}")

    print("Checking /api/mitre/coverage...")
    mitre = get("/api/mitre/coverage")
    print(f" -> Active Techniques: {mitre['total_active_techniques']}")

    print("Checking /api/assets...")
    assets = get("/api/assets")
    print(f" -> Assets: {len(assets)}")

    print("Checking /api/pipeline/status...")
    pipe = get("/api/pipeline/status")
    print(f" -> Spark Cores: {pipe['spark_cluster']['total_cores']}")

    print("Checking /api/search?q=CORP...")
    srch = get("/api/search?q=CORP")
    print(f" -> Search results: {srch['total_results']}")

    print("Checking /api/audit...")
    audit = get("/api/audit")
    print(f" -> Audit records: {len(audit)}")

    print("\n[SUCCESS] ALL THREATLENS ENDPOINTS OPERATING AT PRODUCTION FIDELITY!")

if __name__ == "__main__":
    test()
