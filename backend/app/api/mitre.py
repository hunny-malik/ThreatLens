"""
ThreatLens MITRE ATT&CK Framework API
Provides enterprise ATT&CK matrix coverage, tactic mappings, and technique evidence.
"""
from fastapi import APIRouter
from typing import Dict, Any, List
from collections import defaultdict
from app.core.state import app_state

router = APIRouter(prefix="/api/mitre", tags=["MITRE ATT&CK"])

ALL_TACTICS = [
    "Initial Access",
    "Execution",
    "Persistence",
    "Privilege Escalation",
    "Defense Evasion",
    "Credential Access",
    "Discovery",
    "Lateral Movement",
    "Collection",
    "Command and Control",
    "Exfiltration",
    "Impact"
]


@router.get("/coverage")
def get_mitre_coverage() -> Dict[str, Any]:
    """
    Returns ATT&CK matrix data with detected vs unobserved techniques,
    incident counts per technique, and confidence scores.
    """
    tactic_tech_map: Dict[str, Dict[str, Any]] = {t: {} for t in ALL_TACTICS}

    for inc in app_state.incidents:
        for tech in inc.mitre_techniques:
            tac = tech.tactic
            if tac not in tactic_tech_map:
                tac = "Execution"
            
            tid = tech.technique_id
            if tid not in tactic_tech_map[tac]:
                tactic_tech_map[tac][tid] = {
                    "technique_id": tid,
                    "technique_name": tech.technique_name,
                    "tactic": tac,
                    "incident_count": 0,
                    "incident_ids": [],
                    "evidence_sources": set(),
                    "confidence": tech.confidence
                }
            tactic_tech_map[tac][tid]["incident_count"] += 1
            tactic_tech_map[tac][tid]["incident_ids"].append(inc.id)
            tactic_tech_map[tac][tid]["evidence_sources"].add(tech.detection_source)

    # Convert sets to lists
    coverage_formatted = []
    total_detected = 0
    for tac in ALL_TACTICS:
        tech_list = []
        for tid, data in tactic_tech_map[tac].items():
            data["evidence_sources"] = list(data["evidence_sources"])
            tech_list.append(data)
            total_detected += 1
        coverage_formatted.append({
            "tactic": tac,
            "detected_count": len(tech_list),
            "techniques": tech_list
        })

    return {
        "tactics_coverage": coverage_formatted,
        "total_tactics_monitored": len(ALL_TACTICS),
        "total_active_techniques": total_detected,
        "enterprise_coverage_percentage": round((total_detected / 48) * 100, 1)
    }
