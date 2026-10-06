import sys
import os
import json
import csv

sys.path.insert(0, os.path.dirname(__file__))
from app.generator.synthetic_data import SyntheticAlertGenerator

def generate():
    datasets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))
    os.makedirs(datasets_dir, exist_ok=True)

    print("Generating 3,000 realistic enterprise security alerts...")
    alerts = SyntheticAlertGenerator.generate_alerts(count=3000)
    print(f"Generated {len(alerts)} alerts.")

    # 1. Save JSON
    json_path = os.path.join(datasets_dir, "enterprise_3000_alerts_challenge.json")
    alerts_dicts = [a.model_dump() for a in alerts]
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(alerts_dicts, f, indent=2)
    print(f"Saved: {json_path} ({os.path.getsize(json_path)} bytes)")

    # 2. Save CSV
    csv_path = os.path.join(datasets_dir, "enterprise_3000_alerts_challenge.csv")
    keys = [
        "id", "timestamp", "source", "alert_type", "severity",
        "source_ip", "destination_ip", "source_user", "host",
        "process", "file_hash", "domain", "detection_rule",
        "raw_message", "mitre_technique_id", "mitre_technique_name",
        "mitre_tactic", "confidence"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys, extrasaction="ignore")
        writer.writeheader()
        for d in alerts_dicts:
            writer.writerow(d)
    print(f"Saved: {csv_path} ({os.path.getsize(csv_path)} bytes)")

    # Count rows in CSV
    with open(csv_path, "r", encoding="utf-8") as f:
        row_count = sum(1 for _ in f) - 1
    print(f"Verified CSV Row Count: {row_count} data rows.")

if __name__ == "__main__":
    generate()
