"""
ThreatLens Alerts API Endpoints
Provides filtered ingestion streams, alert detail lookup, and raw inspection.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.core.state import app_state
from app.models.schemas import NormalizedAlert

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=List[NormalizedAlert])
def get_alerts(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    severity: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None
):
    results = app_state.raw_alerts
    if severity:
        results = [a for a in results if a.severity.value.upper() == severity.upper()]
    if source:
        results = [a for a in results if source.lower() in a.source.value.lower()]
    if search:
        s = search.lower()
        results = [
            a for a in results
            if s in a.id.lower() or s in a.raw_message.lower() or s in a.host.lower() or s in a.source_ip.lower()
        ]
    return results[offset : offset + limit]


@router.get("/{alert_id}", response_model=NormalizedAlert)
def get_alert_by_id(alert_id: str):
    for a in app_state.raw_alerts:
        if a.id == alert_id:
            return a
    raise HTTPException(status_code=404, detail="Alert not found")
