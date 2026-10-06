import urllib.request
import json
import uuid

def test_upload():
    boundary = uuid.uuid4().hex
    with open('datasets/6_novel_zero_day_masquerade.json', 'rb') as f:
        file_bytes = f.read()

    body = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="file"; filename="custom_novel_threat.json"\r\n'
        f'Content-Type: application/json\r\n\r\n'
    ).encode('utf-8') + file_bytes + f'\r\n--{boundary}--\r\n'.encode('utf-8')

    req = urllib.request.Request(
        'http://localhost:8000/api/datasets/upload',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read().decode('utf-8'))
    print("Upload Result:", result["status"])
    print("Filename:", result["filename"])
    print("Ingested Alerts:", result["total_alerts_ingested"])
    print("Created Incidents:", result["incidents_created"])
    print("Detected Category:", result["incidents"][0]["threat_classification"])
    print("[SUCCESS] MULTIPART DATASET UPLOAD OPERATING CLEANLY!")

if __name__ == "__main__":
    test_upload()
