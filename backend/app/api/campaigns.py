"""
ThreatLens Campaigns API Endpoints
Provides threat actor campaign clustering, common indicators, and cross-incident intelligence.
"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.core.state import app_state
from app.models.schemas import ThreatCampaign

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])


@router.get("", response_model=List[ThreatCampaign])
def get_campaigns():
    return app_state.campaigns


@router.get("/{campaign_id}", response_model=ThreatCampaign)
def get_campaign_by_id(campaign_id: str):
    for c in app_state.campaigns:
        if c.id == campaign_id:
            return c
    raise HTTPException(status_code=404, detail="Campaign not found")
