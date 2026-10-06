"""
ThreatLens Enterprise Assets API Endpoints
Provides asset inventory, criticality levels, active risk ratings, and compromised asset tracking.
"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.core.state import app_state
from app.models.schemas import Asset

router = APIRouter(prefix="/api/assets", tags=["Assets"])


@router.get("", response_model=List[Asset])
def get_assets():
    # Update active incident counts dynamically
    for asset in app_state.assets:
        count = sum(1 for inc in app_state.incidents if asset.name in inc.affected_assets or asset.ip_address in inc.destination_ips)
        asset.active_incidents_count = count
    return app_state.assets


@router.get("/{asset_id}", response_model=Asset)
def get_asset_by_id(asset_id: str):
    for a in app_state.assets:
        if a.id == asset_id or a.name.lower() == asset_id.lower():
            return a
    raise HTTPException(status_code=404, detail="Asset not found")
