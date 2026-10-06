"""
ThreatLens Intelligent Alert Deduplication Engine
Reduces alert fatigue by clustering near-identical, repetitive, and burst alerts into unified incident seeds.
Calculates analyst workload saved.
"""
from typing import List, Dict, Tuple, Any
from collections import defaultdict
from app.models.schemas import NormalizedAlert


class AlertDeduplicator:
    @staticmethod
    def generate_dedup_signature(alert: NormalizedAlert) -> str:
        """
        Creates a composite deduplication signature based on entity identity,
        rule type, and host context.
        """
        user_key = alert.source_user or alert.destination_user or "any_user"
        process_key = alert.process or "any_proc"
        return f"{alert.alert_type}|{alert.detection_rule}|{alert.source_ip}|{alert.destination_ip}|{alert.host}|{user_key}|{process_key}"

    @classmethod
    def deduplicate(cls, alerts: List[NormalizedAlert]) -> Tuple[List[NormalizedAlert], Dict[str, List[NormalizedAlert]], Dict[str, Any]]:
        """
        Takes raw normalized alerts and returns:
        1. List of canonical representative alerts
        2. Map of representative_id -> list of collapsed alerts
        3. Deduplication metrics dictionary (total, collapsed, workload saved in hours)
        """
        groups: Dict[str, List[NormalizedAlert]] = defaultdict(list)
        
        for alert in alerts:
            sig = cls.generate_dedup_signature(alert)
            groups[sig].append(alert)

        representatives: List[NormalizedAlert] = []
        collapsed_map: Dict[str, List[NormalizedAlert]] = {}
        total_collapsed = 0

        for sig, group in groups.items():
            # Pick representative (highest severity or most recent)
            primary = max(group, key=lambda a: (
                {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}.get(a.severity.value, 1),
                a.timestamp
            ))
            representatives.append(primary)
            collapsed_map[primary.id] = group
            total_collapsed += (len(group) - 1)

        # Standard industry metric: ~2.5 minutes per alert manually reviewed by Tier-1
        minutes_saved = total_collapsed * 2.5
        hours_saved = round(minutes_saved / 60.0, 1)

        metrics = {
            "total_input_alerts": len(alerts),
            "unique_representatives": len(representatives),
            "collapsed_duplicates": total_collapsed,
            "deduplication_ratio": round((total_collapsed / len(alerts) * 100) if alerts else 0, 1),
            "workload_hours_saved": hours_saved
        }

        return representatives, collapsed_map, metrics
