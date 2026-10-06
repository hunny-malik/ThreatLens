"""
ThreatLens Incidents API Endpoints
Manages correlated incidents, triage states, analyst overrides, and MITRE management.
"""
from fastapi import APIRouter, Query, HTTPException, Body
from typing import List, Optional, Dict, Any
from app.core.state import app_state
from app.models.schemas import Incident, IncidentStatus, Severity, NormalizedAlert
from app.engine.feedback_learner import feedback_engine

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.get("", response_model=List[Incident])
def get_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    criticality: Optional[str] = None,
    campaign_id: Optional[str] = None,
    search: Optional[str] = None
):
    results = app_state.incidents
    if status:
        results = [i for i in results if i.status.value.lower() == status.lower()]
    if severity:
        results = [i for i in results if i.severity.value.upper() == severity.upper()]
    if criticality:
        results = [i for i in results if i.primary_asset_criticality.value.upper() == criticality.upper()]
    if campaign_id:
        results = [i for i in results if i.campaign_id == campaign_id]
    if search:
        s = search.lower()
        results = [
            i for i in results
            if s in i.id.lower() or s in i.title.lower() or s in i.primary_asset.lower() or any(s in u.lower() for u in i.users_involved)
        ]
    return results


@router.get("/{incident_id}", response_model=Incident)
def get_incident_by_id(incident_id: str):
    for i in app_state.incidents:
        if i.id == incident_id:
            return i
    raise HTTPException(status_code=404, detail="Incident not found")


@router.get("/{incident_id}/alerts", response_model=List[NormalizedAlert])
def get_incident_alerts(incident_id: str):
    """Returns underlying alerts for inspecting deduplicated/collapsed activity."""
    for inc in app_state.incidents:
        if inc.id == incident_id:
            # Find alerts in raw_alerts by alert_ids
            matched = [a for a in app_state.raw_alerts if a.id in inc.alert_ids]
            if not matched:
                matched = inc.sample_alerts
            return matched
    raise HTTPException(status_code=404, detail="Incident not found")


@router.post("/{incident_id}/status")
def update_incident_status(
    incident_id: str,
    payload: Dict[str, Any] = Body(...)
):
    new_status_str = payload.get("status")
    notes = payload.get("notes", "")
    analyst_name = payload.get("analyst_name", app_state.analyst_name)
    analyst_role = payload.get("analyst_role", app_state.analyst_role)

    for inc in app_state.incidents:
        if inc.id == incident_id:
            old_status = inc.status.value
            # Match enum
            for s in IncidentStatus:
                if s.value.lower() == str(new_status_str).lower():
                    inc.status = s
                    break

            # Record feedback and audit entry
            rule_key = inc.sample_alerts[0].detection_rule if inc.sample_alerts else inc.title
            feedback_engine.record_decision(
                incident_id=incident_id,
                rule_or_pattern=rule_key,
                analyst_id=app_state.analyst_id,
                analyst_name=analyst_name,
                analyst_role=analyst_role,
                status=inc.status,
                previous_status=old_status,
                notes=notes
            )
            return {"status": "success", "incident_id": incident_id, "new_status": inc.status.value}

    raise HTTPException(status_code=404, detail="Incident not found")


@router.post("/{incident_id}/override")
def override_incident_properties(
    incident_id: str,
    payload: Dict[str, Any] = Body(...)
):
    for inc in app_state.incidents:
        if inc.id == incident_id:
            analyst_name = payload.get("analyst_name", app_state.analyst_name)
            analyst_role = payload.get("analyst_role", app_state.analyst_role)
            notes = payload.get("notes", "Analyst parameter override")

            if "risk_score" in payload:
                old_val = str(inc.risk_score)
                new_val = float(payload["risk_score"])
                inc.risk_score = new_val
                feedback_engine.record_override(
                    incident_id=incident_id,
                    action="Risk Score Override",
                    analyst_id=app_state.analyst_id,
                    analyst_name=analyst_name,
                    analyst_role=analyst_role,
                    previous_val=old_val,
                    new_val=str(new_val),
                    notes=notes
                )

            if "severity" in payload:
                old_val = inc.severity.value
                new_val = payload["severity"].upper()
                for sev in Severity:
                    if sev.value == new_val:
                        inc.severity = sev
                        break
                feedback_engine.record_override(
                    incident_id=incident_id,
                    action="Severity Override",
                    analyst_id=app_state.analyst_id,
                    analyst_name=analyst_name,
                    analyst_role=analyst_role,
                    previous_val=old_val,
                    new_val=new_val,
                    notes=notes
                )

            if "ai_summary_status" in payload:
                # Accept, Modified, Rejected
                status_choice = payload["ai_summary_status"]
                edited_summary = payload.get("edited_summary")
                inc.ai_summary.analyst_status = status_choice
                if edited_summary:
                    inc.ai_summary.analyst_edited_summary = edited_summary
                feedback_engine.record_override(
                    incident_id=incident_id,
                    action=f"AI Summary {status_choice}",
                    analyst_id=app_state.analyst_id,
                    analyst_name=analyst_name,
                    analyst_role=analyst_role,
                    previous_val="Unreviewed",
                    new_val=status_choice,
                    notes=edited_summary or notes
                )

            return {"status": "success", "incident": inc}

    raise HTTPException(status_code=404, detail="Incident not found")


@router.post("/{incident_id}/mitre/toggle")
def toggle_mitre_technique(
    incident_id: str,
    payload: Dict[str, Any] = Body(...)
):
    tech_id = payload.get("technique_id")
    action = payload.get("action", "REMOVE") # REMOVE or CONFIRM
    analyst_name = payload.get("analyst_name", app_state.analyst_name)

    for inc in app_state.incidents:
        if inc.id == incident_id:
            if action == "REMOVE":
                inc.mitre_techniques = [t for t in inc.mitre_techniques if t.technique_id != tech_id]
                feedback_engine.record_override(
                    incident_id=incident_id,
                    action="MITRE Technique Removed",
                    analyst_id=app_state.analyst_id,
                    analyst_name=analyst_name,
                    analyst_role=app_state.analyst_role,
                    previous_val=tech_id,
                    new_val="REMOVED",
                    notes=f"Analyst verified technique {tech_id} as not applicable"
                )
            return {"status": "success", "mitre_techniques": inc.mitre_techniques}

    raise HTTPException(status_code=404, detail="Incident not found")
