"""
ThreatLens Feedback Learning & Human-In-The-Loop Engine
Tracks analyst triage decisions (True Positive, False Positive, Escalated, Overrides),
computes historical FP rates for recurring alert patterns, and adjusts prioritization without silent suppression.
"""
from typing import Dict, List, Tuple, Any, Optional
from collections import defaultdict
import datetime
from app.models.schemas import IncidentStatus, AuditLogEntry


class FeedbackLearningEngine:
    def __init__(self):
        # Pattern key -> list of decisions ("TP", "FP", "BENIGN", "ESCALATED")
        self.pattern_history: Dict[str, List[str]] = defaultdict(list)
        # Audit log trail
        self.audit_trail: List[AuditLogEntry] = []
        # Configuration for learned feedback handling
        self.policy: str = "REDUCE_PRIORITY"  # Options: REDUCE_PRIORITY, REQUIRE_REVIEW, INCREASE_PRIORITY
        
        # Seed realistic baseline learned patterns
        self._seed_baseline_feedback()

    def _seed_baseline_feedback(self):
        # Vulnerability scanner pattern: historically high FP
        vuln_scanner_key = "Generic Security Anomaly|Vulnerability Scanner Sweep"
        self.pattern_history[vuln_scanner_key] = ["FP", "FP", "FP", "FP", "FP", "FP", "BENIGN", "FP", "TP"] # 80% FP
        
        # Backup service automation
        backup_key = "Scheduled Task|Automated Backup Sync"
        self.pattern_history[backup_key] = ["FP", "FP", "FP", "BENIGN", "FP", "TP"] # 75% FP

        # Credential dumping: historically very low FP (high TP)
        mimikatz_key = "OS Credential Dumping: LSASS Memory|Mimikatz Memory Harvest"
        self.pattern_history[mimikatz_key] = ["TP", "TP", "TP", "TP", "TP", "TP", "TP"]

    def record_decision(
        self,
        incident_id: str,
        rule_or_pattern: str,
        analyst_id: str,
        analyst_name: str,
        analyst_role: str,
        status: IncidentStatus,
        previous_status: Optional[str] = None,
        notes: Optional[str] = None
    ) -> AuditLogEntry:
        """
        Records human analyst triage decision into the feedback learning model and creates immutable audit log.
        """
        code = "TP"
        if status == IncidentStatus.FALSE_POSITIVE:
            code = "FP"
        elif status == IncidentStatus.BENIGN:
            code = "BENIGN"
        elif status == IncidentStatus.ESCALATED:
            code = "ESCALATED"

        self.pattern_history[rule_or_pattern].append(code)

        log_entry = AuditLogEntry(
            id=f"audit-{len(self.audit_trail) + 1:04d}",
            timestamp=datetime.datetime.utcnow().isoformat() + "Z",
            analyst_id=analyst_id,
            analyst_name=analyst_name,
            analyst_role=analyst_role,
            action=f"Status changed to {status.value}",
            incident_id=incident_id,
            previous_value=previous_status or "Needs Investigation",
            new_value=status.value,
            notes=notes
        )
        self.audit_trail.insert(0, log_entry)
        return log_entry

    def record_override(
        self,
        incident_id: str,
        action: str,
        analyst_id: str,
        analyst_name: str,
        analyst_role: str,
        previous_val: str,
        new_val: str,
        notes: Optional[str] = None
    ) -> AuditLogEntry:
        """
        Records manual override of severity, risk score, MITRE tag, or AI summary.
        """
        entry = AuditLogEntry(
            id=f"audit-{len(self.audit_trail) + 1:04d}",
            timestamp=datetime.datetime.utcnow().isoformat() + "Z",
            analyst_id=analyst_id,
            analyst_name=analyst_name,
            analyst_role=analyst_role,
            action=action,
            incident_id=incident_id,
            previous_value=previous_val,
            new_value=new_val,
            notes=notes
        )
        self.audit_trail.insert(0, entry)
        return entry

    def get_pattern_fp_rate(self, pattern_key: str) -> float:
        """
        Returns percentage (0.0 to 100.0) of times this pattern was classified as False Positive.
        """
        history = self.pattern_history.get(pattern_key, [])
        if not history:
            return 0.0
        fp_count = history.count("FP")
        return round((fp_count / len(history)) * 100.0, 1)

    def calculate_global_stats(self) -> Dict[str, Any]:
        """
        Computes system-wide True Positive, False Positive, and override rates.
        """
        all_decisions: List[str] = []
        for decs in self.pattern_history.values():
            all_decisions.extend(decs)

        total = len(all_decisions)
        if total == 0:
            return {"total_decisions": 0, "fpr": 0.0, "tpr": 0.0, "overrides": 0}

        fp_count = all_decisions.count("FP")
        tp_count = all_decisions.count("TP") + all_decisions.count("ESCALATED")
        fpr = round((fp_count / total) * 100.0, 1)
        tpr = round((tp_count / total) * 100.0, 1)

        override_actions = [a for a in self.audit_trail if "override" in a.action.lower() or "modified" in a.action.lower() or "score" in a.action.lower()]

        return {
            "total_decisions": total,
            "false_positive_rate": fpr,
            "true_positive_rate": tpr,
            "total_audit_entries": len(self.audit_trail),
            "analyst_overrides_count": len(override_actions),
            "policy": self.policy
        }


# Global singleton instance
feedback_engine = FeedbackLearningEngine()
