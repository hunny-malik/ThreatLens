"""
ThreatLens Immutable Audit Logs API
Provides enterprise audit trail of all analyst triage actions, overrides, and security decisions.
"""
from fastapi import APIRouter
from typing import List
from app.engine.feedback_learner import feedback_engine
from app.models.schemas import AuditLogEntry

router = APIRouter(prefix="/api/audit", tags=["Audit"])


@router.get("", response_model=List[AuditLogEntry])
def get_audit_trail():
    return feedback_engine.audit_trail
