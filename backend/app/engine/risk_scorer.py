"""
ThreatLens Dynamic Explainable Risk Scoring Engine
Implements multi-factor asset-criticality-weighted dynamic scoring.
Ensures critical infrastructure events prioritize higher than lower-value test machines.
"""
from typing import List, Dict, Any, Tuple
from app.models.schemas import (
    Severity, AssetCriticality, AssetType, AttackStage,
    RiskExplanation, NormalizedAlert, AttackChainStep
)

SEVERITY_WEIGHTS = {
    Severity.LOW: 25.0,
    Severity.MEDIUM: 52.0,
    Severity.HIGH: 78.0,
    Severity.CRITICAL: 96.0,
}

ASSET_MULTIPLIERS = {
    AssetCriticality.CRITICAL: 1.45,
    AssetCriticality.HIGH: 1.22,
    AssetCriticality.MEDIUM: 1.00,
    AssetCriticality.LOW: 0.52,
}

STAGE_MULTIPLIERS = {
    AttackStage.EXFILTRATION: 1.30,
    AttackStage.LATERAL_MOVEMENT: 1.25,
    AttackStage.CREDENTIAL_ACCESS: 1.20,
    AttackStage.PRIVILEGE_ESCALATION: 1.18,
    AttackStage.COLLECTION: 1.15,
    AttackStage.PERSISTENCE: 1.12,
    AttackStage.EXECUTION: 1.10,
    AttackStage.INITIAL_ACCESS: 1.05,
    AttackStage.DISCOVERY: 1.02,
}


class DynamicRiskScorer:
    @classmethod
    def calculate_risk(
        cls,
        max_severity: Severity,
        primary_asset_criticality: AssetCriticality,
        primary_asset_type: AssetType,
        attack_chain: List[AttackChainStep],
        confidence: float,
        is_anomalous: bool,
        is_in_campaign: bool,
        anomaly_count: int = 0
    ) -> RiskExplanation:
        """
        Calculates explainable risk score:
        Score = [Severity * AssetMultiplier * StageMultiplier * Confidence] + AnomalyBoost + CampaignBoost
        Clamped to [5.0, 99.8].
        """
        base_sev = SEVERITY_WEIGHTS.get(max_severity, 50.0)
        asset_mult = ASSET_MULTIPLIERS.get(primary_asset_criticality, 1.0)
        
        # Max stage multiplier found in chain
        stage_mult = 1.0
        active_stage_name = "N/A"
        for step in attack_chain:
            m = STAGE_MULTIPLIERS.get(step.stage, 1.0)
            if m > stage_mult:
                stage_mult = m
                active_stage_name = step.stage.value

        conf_factor = max(0.65, min(1.05, 0.7 + (confidence * 0.35)))
        
        anomaly_boost = 0.0
        if is_anomalous:
            anomaly_boost = min(15.0, 7.5 + (anomaly_count * 2.5))
            
        campaign_boost = 6.0 if is_in_campaign else 0.0

        # Raw calculation
        raw_score = (base_sev * asset_mult * stage_mult * conf_factor * 0.65) + anomaly_boost + campaign_boost
        final_score = round(max(5.0, min(99.8, raw_score)), 1)

        # Build clear explanation
        crit_desc = f"{primary_asset_criticality.value} ({primary_asset_type.value}) applying {asset_mult:.2f}x weight"
        stage_desc = f"Latest kill-chain phase '{active_stage_name}' applying {stage_mult:.2f}x weight"
        
        explanation_lines = [
            f"Base severity {max_severity.value} contributes {base_sev:.0f} pts.",
            f"Target asset evaluated as {crit_desc}.",
            f"Attack progression stage: {stage_desc}.",
            f"Model telemetry confidence: {confidence:.2f} (factor {conf_factor:.2f}x).",
        ]
        if anomaly_boost > 0:
            explanation_lines.append(f"Behavioral anomaly boost of +{anomaly_boost:.1f} pts applied.")
        if campaign_boost > 0:
            explanation_lines.append(f"Threat campaign correlation boost of +{campaign_boost:.1f} pts applied.")

        full_explanation = " ".join(explanation_lines)

        return RiskExplanation(
            base_severity_score=base_sev,
            asset_criticality_multiplier=asset_mult,
            asset_criticality_reason=crit_desc,
            attack_stage_multiplier=stage_mult,
            attack_stage_reason=stage_desc,
            entity_importance_multiplier=asset_mult,
            confidence_weight=round(conf_factor, 2),
            behavioral_anomaly_boost=anomaly_boost,
            campaign_boost=campaign_boost,
            final_score=final_score,
            explanation=full_explanation
        )
