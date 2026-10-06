"""
ThreatLens Threat Actor & Campaign Clustering Engine
Clusters disparate incidents across enterprise perimeter into unified adversary campaigns
based on shared IOC infrastructure, tactics, temporal coordination, and tool hashes.
"""
from typing import List, Dict, Set, Any
from collections import defaultdict
import uuid
from app.models.schemas import ThreatCampaign, Incident


KNOWN_CAMPAIGN_SIGNATURES = [
    {
        "id": "CAMP-APT29-COZY",
        "name": "Operation Cobalt Tempest",
        "threat_actor_alias": "APT29 / Midnight Blizzard",
        "ioc_ips": {"198.51.100.22", "198.51.100.44", "185.220.101.5"},
        "ioc_domains": {"update-sync-telemetry.org", "cdn-office-auth.net"},
        "techniques": ["T1566.001", "T1059.001", "T1078", "T1003.001"],
        "description": "Coordinated credential harvesting targeting executive mailboxes and domain controllers via spearphishing attachments and token theft."
    },
    {
        "id": "CAMP-FIN7-HYDRA",
        "name": "Campaign Silent Hydra",
        "threat_actor_alias": "FIN7 / Carbanak Variant",
        "ioc_ips": {"203.0.113.88", "194.26.29.112"},
        "ioc_domains": {"secure-invoice-portal.biz", "billing-gateway-api.com"},
        "techniques": ["T1059.003", "T1547.001", "T1021.002", "T1567"],
        "description": "Financial reconnaissance and database exfiltration campaign deploying living-off-the-land binaries and lateral SMB propagation."
    },
    {
        "id": "CAMP-VOLT-STORM",
        "name": "Vanguard Breach Simulation",
        "threat_actor_alias": "Volt Typhoon Emulation",
        "ioc_ips": {"192.0.2.144", "198.51.100.19"},
        "ioc_domains": {"router-cfg-backup.cc"},
        "techniques": ["T1087", "T1046", "T1021.006", "T1071.001"],
        "description": "Stealthy network device exploitation and living-off-the-land reconnaissance on critical utility production subnets."
    }
]


class CampaignClusterer:
    @classmethod
    def cluster_incidents(cls, incidents: List[Incident]) -> List[ThreatCampaign]:
        """
        Assigns incidents to campaign clusters based on shared infrastructure and ATT&CK profiles.
        """
        campaign_map: Dict[str, Dict[str, Any]] = {}

        # Initialize known campaigns
        for sig in KNOWN_CAMPAIGN_SIGNATURES:
            campaign_map[sig["id"]] = {
                "id": sig["id"],
                "name": sig["name"],
                "threat_actor_alias": sig["threat_actor_alias"],
                "incident_ids": [],
                "affected_assets": set(),
                "ips": set(sig["ioc_ips"]),
                "domains": set(sig["ioc_domains"]),
                "hashes": set(),
                "users": set(),
                "tactics": set(),
                "techniques": set(sig["techniques"]),
                "first_detected": "9999-99-99",
                "last_detected": "0000-00-00",
                "description": sig["description"]
            }

        # Match incidents
        for inc in incidents:
            matched_campaign_id = None
            
            # Check IP/domain overlap with known campaigns
            for camp_id, camp_data in campaign_map.items():
                shared_ips = set(inc.source_ips + inc.destination_ips).intersection(camp_data["ips"])
                shared_domains = set(inc.domains).intersection(camp_data["domains"])
                tech_ids = {t.technique_id for t in inc.mitre_techniques}
                shared_tech = tech_ids.intersection(camp_data["techniques"])

                if len(shared_ips) > 0 or len(shared_domains) > 0 or len(shared_tech) >= 3:
                    matched_campaign_id = camp_id
                    break

            # If matched, associate incident with campaign
            if matched_campaign_id:
                inc.campaign_id = matched_campaign_id
                inc.campaign_name = campaign_map[matched_campaign_id]["name"]
                
                c = campaign_map[matched_campaign_id]
                c["incident_ids"].append(inc.id)
                c["affected_assets"].update(inc.affected_assets)
                c["ips"].update(inc.source_ips + inc.destination_ips)
                c["domains"].update(inc.domains)
                c["hashes"].update(inc.hashes)
                c["users"].update(inc.users_involved)
                for t in inc.mitre_techniques:
                    c["tactics"].add(t.tactic)
                    c["techniques"].add(t.technique_id)
                if inc.first_seen < c["first_detected"]:
                    c["first_detected"] = inc.first_seen
                if inc.last_seen > c["last_detected"]:
                    c["last_detected"] = inc.last_seen

        # Convert to ThreatCampaign objects for non-empty campaigns
        campaigns: List[ThreatCampaign] = []
        for camp_id, data in campaign_map.items():
            if data["incident_ids"]:
                # Calculate aggregate risk score
                related_incidents = [i for i in incidents if i.id in data["incident_ids"]]
                avg_risk = sum(i.risk_score for i in related_incidents) / len(related_incidents) if related_incidents else 70.0
                max_risk = max([i.risk_score for i in related_incidents], default=75.0)
                camp_risk = round(min(99.0, max_risk * 1.05), 1)

                campaigns.append(ThreatCampaign(
                    id=data["id"],
                    name=data["name"],
                    threat_actor_alias=data["threat_actor_alias"],
                    confidence=0.91,
                    risk_score=camp_risk,
                    incidents_count=len(data["incident_ids"]),
                    incident_ids=data["incident_ids"],
                    affected_assets=sorted(list(data["affected_assets"])),
                    common_indicators={
                        "ips": sorted(list(data["ips"]))[:5],
                        "domains": sorted(list(data["domains"]))[:5],
                        "hashes": sorted(list(data["hashes"]))[:5],
                        "users": sorted(list(data["users"]))[:5]
                    },
                    mitre_tactics=sorted(list(data["tactics"])),
                    mitre_techniques=sorted(list(data["techniques"])),
                    first_detected=data["first_detected"] if data["first_detected"] != "9999-99-99" else "2026-10-06T14:00:00Z",
                    last_detected=data["last_detected"] if data["last_detected"] != "0000-00-00" else "2026-10-06T15:30:00Z",
                    description=data["description"]
                ))

        return campaigns
