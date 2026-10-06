"""
ThreatLens Novel / Unknown Attack Anomaly Detection Engine
Applies statistical baselining and heuristic novelty scoring to detect zero-day or signatureless threats.
"""
from typing import List, Tuple, Dict, Any
from app.models.schemas import ThreatClassification, NormalizedAlert


class AnomalyDetector:
    # Baseline expectations
    STANDARD_WORKING_HOURS = (7, 19)
    KNOWN_SYSTEM_PROCESSES = {
        "svchost.exe", "explorer.exe", "services.exe", "lsass.exe", "csrss.exe",
        "smss.exe", "wininit.exe", "runtimebroker.exe", "taskhostw.exe"
    }

    @classmethod
    def evaluate_cluster(cls, alerts: List[NormalizedAlert]) -> Tuple[ThreatClassification, List[str]]:
        """
        Evaluates a cluster of alerts to determine threat classification:
        Known Threat, Suspicious, Anomalous, or Potential Novel Attack,
        and generates explainable anomaly signals.
        """
        reasons: List[str] = []
        has_known_signatures = False
        anomaly_score = 0

        for a in alerts:
            # Check if alert originated from a recognized static signature rule
            if a.mitre_technique_id and not a.is_anomalous:
                has_known_signatures = True

            # Scan anomaly signals
            if a.is_anomalous:
                anomaly_score += 2
                for r in a.anomaly_reasons:
                    if r not in reasons:
                        reasons.append(r)

            # Process masquerading check
            if a.process:
                proc_lower = a.process.lower()
                if any(k in proc_lower for k in cls.KNOWN_SYSTEM_PROCESSES):
                    if "users\\" in proc_lower or "temp\\" in proc_lower or "appdata\\" in proc_lower:
                        msg = f"System binary masquerading or execution outside System32: {a.process}"
                        if msg not in reasons:
                            reasons.append(msg)
                            anomaly_score += 3

            # Network exfiltration or DNS anomaly
            if a.alert_type and ("beacon" in a.alert_type.lower() or "dga" in a.alert_type.lower() or "dns tunnel" in a.alert_type.lower()):
                anomaly_score += 2
                msg = f"Non-standard communication pattern: {a.alert_type}"
                if msg not in reasons:
                    reasons.append(msg)

        # Classification decision matrix
        if anomaly_score >= 5 and not has_known_signatures:
            classification = ThreatClassification.POTENTIAL_NOVEL_ATTACK
            if not reasons:
                reasons.append("High-divergence behavioral anomalies with absent static rule signatures")
        elif anomaly_score >= 3:
            classification = ThreatClassification.ANOMALOUS
        elif has_known_signatures:
            classification = ThreatClassification.KNOWN_THREAT
        else:
            classification = ThreatClassification.SUSPICIOUS

        return classification, reasons
