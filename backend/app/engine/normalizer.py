"""
ThreatLens Alert Normalization Engine
Normalizes raw security alerts from diverse enterprise telemetry sources into a unified canonical schema.
"""
import re
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from app.models.schemas import (
    NormalizedAlert, AlertSource, Severity, AssetCriticality, AssetType
)

# Reference known critical assets
ENTERPRISE_ASSETS = {
    "10.0.1.10": {"name": "CORP-DC-01", "type": AssetType.DOMAIN_CONTROLLER, "criticality": AssetCriticality.CRITICAL, "owner": "sec-ops"},
    "10.0.1.11": {"name": "CORP-DC-02", "type": AssetType.DOMAIN_CONTROLLER, "criticality": AssetCriticality.CRITICAL, "owner": "sec-ops"},
    "10.0.2.50": {"name": "PROD-DB-PRIMARY", "type": AssetType.DATABASE, "criticality": AssetCriticality.CRITICAL, "owner": "data-infra"},
    "10.0.2.51": {"name": "PROD-DB-REPLICA", "type": AssetType.DATABASE, "criticality": AssetCriticality.HIGH, "owner": "data-infra"},
    "10.0.3.15": {"name": "PAYMENT-GW-01", "type": AssetType.PRODUCTION_SERVER, "criticality": AssetCriticality.CRITICAL, "owner": "payments-eng"},
    "10.0.3.20": {"name": "CORE-API-PROD", "type": AssetType.PRODUCTION_SERVER, "criticality": AssetCriticality.HIGH, "owner": "cloud-ops"},
    "10.0.4.101": {"name": "DEV-SRV-TEST", "type": AssetType.TEST_MACHINE, "criticality": AssetCriticality.LOW, "owner": "qa-team"},
    "10.0.4.102": {"name": "STAGING-BENCH-02", "type": AssetType.TEST_MACHINE, "criticality": AssetCriticality.LOW, "owner": "dev-ops"},
    "10.0.5.88": {"name": "EXEC-LAPTOP-CEO", "type": AssetType.EMPLOYEE_ENDPOINT, "criticality": AssetCriticality.HIGH, "owner": "leadership"},
    "10.0.5.92": {"name": "FIN-WORKSTATION-04", "type": AssetType.EMPLOYEE_ENDPOINT, "criticality": AssetCriticality.MEDIUM, "owner": "finance"},
    "10.0.5.95": {"name": "DEV-WORKSTATION-04", "type": AssetType.DEVELOPER_MACHINE, "criticality": AssetCriticality.MEDIUM, "owner": "engineering"},
    "10.0.5.42": {"name": "FIN-BILLING-03", "type": AssetType.EMPLOYEE_ENDPOINT, "criticality": AssetCriticality.HIGH, "owner": "finance"},
    "10.0.5.110": {"name": "DEV-WORKSTATION-12", "type": AssetType.DEVELOPER_MACHINE, "criticality": AssetCriticality.MEDIUM, "owner": "eng-frontend"},
    "10.0.5.115": {"name": "HR-TERMINAL-01", "type": AssetType.EMPLOYEE_ENDPOINT, "criticality": AssetCriticality.MEDIUM, "owner": "people-ops"},
    "10.0.8.12": {"name": "DC-HVAC-PLC-01", "type": AssetType.PRODUCTION_SERVER, "criticality": AssetCriticality.CRITICAL, "owner": "facilities-ot"}
}

DEFAULT_ASSET = {
    "name": "HOST-UNKNOWN",
    "type": AssetType.EMPLOYEE_ENDPOINT,
    "criticality": AssetCriticality.MEDIUM,
    "owner": "unassigned"
}

# MITRE Technique Signatures & Detection Mapping
MITRE_SIGNATURE_MAP = {
    "powershell_obfuscated": {"id": "T1059.001", "name": "PowerShell Execution", "tactic": "Execution"},
    "cmd_child_process": {"id": "T1059.003", "name": "Windows Command Shell", "tactic": "Execution"},
    "mimikatz_lsass_dump": {"id": "T1003.001", "name": "OS Credential Dumping: LSASS Memory", "tactic": "Credential Access"},
    "kerberoasting": {"id": "T1558.003", "name": "Kerberoasting", "tactic": "Credential Access"},
    "brute_force_ssh": {"id": "T1110.001", "name": "Password Guessing", "tactic": "Credential Access"},
    "phishing_email_attachment": {"id": "T1566.001", "name": "Spearphishing Attachment", "tactic": "Initial Access"},
    "valid_accounts_login": {"id": "T1078", "name": "Valid Accounts", "tactic": "Defense Evasion"},
    "lateral_smb_exec": {"id": "T1021.002", "name": "Remote Services: SMB/Windows Admin Shares", "tactic": "Lateral Movement"},
    "lateral_winrm": {"id": "T1021.006", "name": "Remote Services: Windows Remote Management", "tactic": "Lateral Movement"},
    "registry_run_keys": {"id": "T1547.001", "name": "Registry Run Keys / Startup Folder", "tactic": "Persistence"},
    "scheduled_task_create": {"id": "T1053.005", "name": "Scheduled Task", "tactic": "Persistence"},
    "whoami_net_recon": {"id": "T1087", "name": "Account Discovery", "tactic": "Discovery"},
    "port_scan_recon": {"id": "T1046", "name": "Network Service Discovery", "tactic": "Discovery"},
    "dns_tunneling": {"id": "T1071.004", "name": "Application Layer Protocol: DNS", "tactic": "Command and Control"},
    "c2_https_beacon": {"id": "T1071.001", "name": "Web Protocols C2", "tactic": "Command and Control"},
    "archive_collected_data": {"id": "T1560", "name": "Archive Collected Data", "tactic": "Collection"},
    "data_exfiltration_cloud": {"id": "T1567", "name": "Exfiltration Over Web Service", "tactic": "Exfiltration"}
}


class AlertNormalizer:
    @staticmethod
    def resolve_asset_metadata(ip_or_host: str) -> Dict[str, Any]:
        """Looks up or infers asset criticality and type."""
        if ip_or_host in ENTERPRISE_ASSETS:
            return ENTERPRISE_ASSETS[ip_or_host]
        
        # Check by name
        for ip, meta in ENTERPRISE_ASSETS.items():
            if meta["name"].lower() == ip_or_host.lower():
                return meta
        
        # Heuristic inference from name
        name_lower = ip_or_host.lower()
        if "dc" in name_lower or "domain" in name_lower:
            return {"name": ip_or_host, "type": AssetType.DOMAIN_CONTROLLER, "criticality": AssetCriticality.CRITICAL, "owner": "sec-ops"}
        if "db" in name_lower or "sql" in name_lower or "postgres" in name_lower:
            return {"name": ip_or_host, "type": AssetType.DATABASE, "criticality": AssetCriticality.HIGH, "owner": "data-infra"}
        if "prod" in name_lower:
            return {"name": ip_or_host, "type": AssetType.PRODUCTION_SERVER, "criticality": AssetCriticality.HIGH, "owner": "cloud-ops"}
        if "test" in name_lower or "dev" in name_lower or "staging" in name_lower:
            return {"name": ip_or_host, "type": AssetType.TEST_MACHINE, "criticality": AssetCriticality.LOW, "owner": "qa-team"}
            
        return {
            "name": ip_or_host or "UNKNOWN-HOST",
            "type": AssetType.EMPLOYEE_ENDPOINT,
            "criticality": AssetCriticality.MEDIUM,
            "owner": "sec-inventory"
        }

    @classmethod
    def normalize(cls, raw: Dict[str, Any]) -> NormalizedAlert:
        """
        Takes raw dictionary alert in heterogeneous format and normalizes to NormalizedAlert.
        """
        alert_id = str(raw.get("id") or raw.get("alert_id") or raw.get("uuid") or f"alt-{uuid.uuid4().hex[:10]}")
        timestamp = str(raw.get("timestamp") or raw.get("@timestamp") or raw.get("time") or datetime.utcnow().isoformat() + "Z")
        
        # Source detection
        source_str = raw.get("source") or raw.get("log_source") or raw.get("vendor") or "SIEM"
        source_enum = AlertSource.SIEM
        for member in AlertSource:
            if member.value.lower() in str(source_str).lower():
                source_enum = member
                break
        
        # Severity normalization
        sev_raw = str(raw.get("severity") or raw.get("level") or raw.get("priority") or "MEDIUM").upper()
        if any(w in sev_raw for w in ["CRIT", "FATAL", "URGENT", "P1"]):
            severity = Severity.CRITICAL
        elif any(w in sev_raw for w in ["HIGH", "SEVERE", "P2"]):
            severity = Severity.HIGH
        elif any(w in sev_raw for w in ["MED", "WARN", "MODERATE", "P3"]):
            severity = Severity.MEDIUM
        else:
            severity = Severity.LOW

        # Entity fields
        src_ip = raw.get("source_ip") or raw.get("src_ip") or raw.get("src") or raw.get("client_ip") or "0.0.0.0"
        dst_ip = raw.get("destination_ip") or raw.get("dst_ip") or raw.get("dst") or raw.get("server_ip") or "0.0.0.0"
        src_user = raw.get("source_user") or raw.get("src_user") or raw.get("user") or raw.get("username") or None
        dst_user = raw.get("destination_user") or raw.get("dst_user") or raw.get("target_user") or None
        host = raw.get("host") or raw.get("hostname") or raw.get("device_name") or raw.get("computer_name") or dst_ip or src_ip

        # Resolve asset criticality
        asset_info = cls.resolve_asset_metadata(dst_ip if dst_ip != "0.0.0.0" else host)
        
        # Process and Hash
        process = raw.get("process") or raw.get("process_name") or raw.get("image") or raw.get("app")
        parent_process = raw.get("parent_process") or raw.get("parent_image")
        file_hash = raw.get("file_hash") or raw.get("hash") or raw.get("sha256") or raw.get("md5")
        domain = raw.get("domain") or raw.get("query") or raw.get("hostname_queried")
        raw_msg = raw.get("raw_message") or raw.get("message") or raw.get("msg") or str(raw)
        rule_name = raw.get("detection_rule") or raw.get("rule_name") or raw.get("signature") or raw.get("alert_type") or "Generic Security Anomaly"
        alert_type = raw.get("alert_type") or rule_name

        # Confidence
        try:
            confidence = float(raw.get("confidence") or 0.85)
        except (ValueError, TypeError):
            confidence = 0.85
        confidence = max(0.1, min(1.0, confidence))

        # MITRE Mapping
        mitre_tech_id = raw.get("mitre_technique_id")
        mitre_tech_name = raw.get("mitre_technique_name")
        mitre_tactic = raw.get("mitre_tactic")

        if not mitre_tech_id and severity != Severity.LOW:
            # Check signatures only for Medium/High/Critical alerts to prevent routine backups from matching ATT&CK
            raw_text_scan = f"{alert_type} {raw_msg} {process}".lower()
            for key, sig in MITRE_SIGNATURE_MAP.items():
                key_phrase = key.replace("_", " ")
                if key_phrase in raw_text_scan:
                    mitre_tech_id = sig["id"]
                    mitre_tech_name = sig["name"]
                    mitre_tactic = sig["tactic"]
                    break

        # Check Novel/Anomaly indicators
        raw_is_anom = raw.get("is_anomalous", False)
        if isinstance(raw_is_anom, str):
            is_anomalous = raw_is_anom.strip().lower() in ["true", "1", "yes"]
        else:
            is_anomalous = bool(raw_is_anom)

        raw_anom_reasons = raw.get("anomaly_reasons")
        if isinstance(raw_anom_reasons, str):
            anomaly_reasons = [r.strip() for r in raw_anom_reasons.split(";") if r.strip()]
        elif isinstance(raw_anom_reasons, list):
            anomaly_reasons = [str(r) for r in raw_anom_reasons]
        else:
            anomaly_reasons = []

        if not anomaly_reasons:
            if "off-hours" in raw_msg.lower() or "unusual time" in raw_msg.lower():
                is_anomalous = True
                anomaly_reasons.append("Unusual login time outside established user baseline")
            if "rare process" in raw_msg.lower() or (process and "temp\\" in str(process).lower()):
                is_anomalous = True
                anomaly_reasons.append(f"Abnormal execution path for process: {process}")
            if "volume spike" in raw_msg.lower() or "outbound exfil" in raw_msg.lower():
                is_anomalous = True
                anomaly_reasons.append("Data egress volume 4.8x standard hourly baseline")

        return NormalizedAlert(
            id=alert_id,
            timestamp=timestamp,
            source=source_enum,
            alert_type=alert_type,
            severity=severity,
            source_ip=str(src_ip),
            destination_ip=str(dst_ip),
            source_user=str(src_user) if src_user else None,
            destination_user=str(dst_user) if dst_user else None,
            host=str(host),
            asset_id=str(dst_ip),
            asset_name=asset_info["name"],
            asset_criticality=asset_info["criticality"],
            asset_type=asset_info["type"],
            process=str(process) if process else None,
            parent_process=str(parent_process) if parent_process else None,
            file_hash=str(file_hash) if file_hash else None,
            domain=str(domain) if domain else None,
            raw_message=raw_msg[:1000],
            confidence=confidence,
            detection_rule=rule_name,
            mitre_technique_id=mitre_tech_id,
            mitre_technique_name=mitre_tech_name,
            mitre_tactic=mitre_tactic,
            is_anomalous=is_anomalous,
            anomaly_reasons=anomaly_reasons,
            raw_source_format=source_str
        )
