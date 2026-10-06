"""
ThreatLens Multi-Attack Disentanglement Engine
Disentangles simultaneous independent attacks within high-volume telemetry.
Ensures that a 100,000-event log file is NOT treated as a single monolith, but partitioned
into distinct operational attack campaigns and targeted incidents.
"""
from typing import List, Dict, Set, Tuple, Any
from collections import defaultdict
from datetime import datetime, timezone
from app.models.schemas import NormalizedAlert


class AttackDisentanglementEngine:
    @staticmethod
    def _parse_time(ts_str: str) -> float:
        try:
            # Handle ISO string
            cleaned = ts_str.replace("Z", "+00:00")
            return datetime.fromisoformat(cleaned).timestamp()
        except Exception:
            return 0.0

    @classmethod
    def disentangle_attacks(cls, alerts: List[NormalizedAlert], temporal_window_seconds: int = 3600) -> List[List[NormalizedAlert]]:
        """
        Partitions alerts into distinct attack clusters using multi-dimensional graph connectivity.
        Nodes: Alerts
        Edges: Strong shared context (Host, User, External IP, Process lineage, Domain)
               AND within temporal proximity (temporal_window_seconds).
        """
        if not alerts:
            return []

        # Sort chronologically
        sorted_alerts = sorted(alerts, key=lambda a: cls._parse_time(a.timestamp))
        n = len(sorted_alerts)

        # Build adjacency graph
        parent = list(range(n))

        def find(i: int) -> int:
            if parent[i] == i:
                return i
            parent[i] = find(parent[i])
            return parent[i]

        def union(i: int, j: int):
            root_i = find(i)
            root_j = find(j)
            if root_i != root_j:
                parent[root_i] = root_j

        # Index by pivots
        host_index: Dict[str, List[int]] = defaultdict(list)
        user_index: Dict[str, List[int]] = defaultdict(list)
        ext_ip_index: Dict[str, List[int]] = defaultdict(list)
        domain_index: Dict[str, List[int]] = defaultdict(list)
        hash_index: Dict[str, List[int]] = defaultdict(list)

        for idx, alert in enumerate(sorted_alerts):
            if alert.host and alert.host != "0.0.0.0":
                host_index[alert.host].append(idx)
            user = alert.source_user or alert.destination_user
            if user and user.lower() not in ["system", "local service", "network service"]:
                user_index[user].append(idx)
            # External or specific IPs
            for ip in [alert.source_ip, alert.destination_ip]:
                if ip and ip not in ["0.0.0.0", "127.0.0.1", "255.255.255.255"]:
                    # check if external or specific target
                    ext_ip_index[ip].append(idx)
            if alert.domain:
                domain_index[alert.domain].append(idx)
            if alert.file_hash:
                hash_index[alert.file_hash].append(idx)

        # Connect nodes within time window sharing significant pivots
        def link_indices(indices: List[int]):
            for k in range(len(indices) - 1):
                idx_a = indices[k]
                idx_b = indices[k + 1]
                t_a = cls._parse_time(sorted_alerts[idx_a].timestamp)
                t_b = cls._parse_time(sorted_alerts[idx_b].timestamp)
                if abs(t_b - t_a) <= temporal_window_seconds:
                    union(idx_a, idx_b)

        for indices in host_index.values():
            link_indices(indices)
        for indices in user_index.values():
            link_indices(indices)
        for indices in ext_ip_index.values():
            link_indices(indices)
        for indices in domain_index.values():
            link_indices(indices)
        for indices in hash_index.values():
            link_indices(indices)

        # Group by disjoint connected components
        clusters: Dict[int, List[NormalizedAlert]] = defaultdict(list)
        for idx in range(n):
            root = find(idx)
            clusters[root].append(sorted_alerts[idx])

        return list(clusters.values())
