"""
ThreatLens In-Memory Enterprise SOC State Store
Holds normalized alerts, correlated incidents, threat campaigns, assets,
pipeline metrics, and audit records.
"""
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    NormalizedAlert, Incident, ThreatCampaign, Asset, AssetType, AssetCriticality, PipelineStats
)
from app.generator.synthetic_data import SyntheticAlertGenerator
from app.engine.correlator import IncidentCorrelationEngine
from app.engine.normalizer import ENTERPRISE_ASSETS
from app.engine.campaign_clusterer import CampaignClusterer
from app.engine.feedback_learner import feedback_engine
from app.distributed.stream_broker import stream_broker


class AppState:
    def __init__(self):
        self.raw_alerts: List[NormalizedAlert] = []
        self.incidents: List[Incident] = []
        self.campaigns: List[ThreatCampaign] = []
        self.assets: List[Asset] = []
        self.analyst_role: str = "Tier-1 Analyst"
        self.analyst_name: str = "J. Mercer (Analyst-42)"
        self.analyst_id: str = "usr-4291"
        self.is_simulation_running: bool = False
        self.last_dedup_metrics: Dict[str, Any] = {}
        
        self.init_assets()
        self.seed_initial_state()

    def init_assets(self):
        self.assets = []
        for ip, meta in ENTERPRISE_ASSETS.items():
            self.assets.append(Asset(
                id=f"ast-{ip.replace('.', '-')}",
                name=meta["name"],
                type=meta["type"],
                criticality=meta["criticality"],
                ip_address=ip,
                os="Linux Ubuntu 22.04" if "DB" in meta["name"] or "API" in meta["name"] else "Windows Server 2022" if "DC" in meta["name"] else "Windows 11 Enterprise",
                owner=meta["owner"],
                active_incidents_count=0,
                risk_score=92.0 if meta["criticality"] == AssetCriticality.CRITICAL else 65.0,
                tags=["Production", "Tier-0" if meta["criticality"] == AssetCriticality.CRITICAL else "Workstation"]
            ))

    def seed_initial_state(self):
        """Generates realistic starting alerts and correlates them into incidents."""
        initial_alerts = SyntheticAlertGenerator.generate_alerts(count=3000)
        self.raw_alerts = initial_alerts
        self.incidents, dedup = IncidentCorrelationEngine.process_telemetry(initial_alerts)
        self.last_dedup_metrics = dedup
        self.campaigns = CampaignClusterer.cluster_incidents(self.incidents)
        
        # Update asset active incident counts
        for asset in self.assets:
            c = sum(1 for inc in self.incidents if asset.name in inc.affected_assets or asset.ip_address in inc.destination_ips)
            asset.active_incidents_count = c

        # Feed some metrics to stream broker
        stream_broker.total_ingested = len(initial_alerts)
        stream_broker.total_processed = len(initial_alerts)


app_state = AppState()
