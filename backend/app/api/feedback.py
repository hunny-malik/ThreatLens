"""
ThreatLens Feedback Learning Management API
Allows analysts to configure how learned patterns influence priority
and inspect pattern false-positive rates.
"""
from fastapi import APIRouter, Body
from typing import Dict, Any
from app.engine.feedback_learner import feedback_engine

router = APIRouter(prefix="/api/feedback", tags=["Feedback Learning"])


@router.get("/stats")
def get_feedback_stats() -> Dict[str, Any]:
    return feedback_engine.calculate_global_stats()


@router.post("/policy")
def set_feedback_policy(payload: Dict[str, str] = Body(...)):
    new_policy = payload.get("policy", "REDUCE_PRIORITY")
    if new_policy in ["REDUCE_PRIORITY", "REQUIRE_REVIEW", "INCREASE_PRIORITY"]:
        feedback_engine.policy = new_policy
        return {"status": "success", "policy": new_policy}
    return {"status": "error", "message": "Invalid policy specified"}
