"""
ThreatLens Attack Chain Reconstruction Engine
Reconstructs the causal progression across the MITRE ATT&CK kill chain.
Enforces evidence validation: only stages backed by verified telemetry are included.
"""
from typing import List, Dict, Optional
from datetime import datetime
from app.models.schemas import AttackStage, AttackChainStep, NormalizedAlert, Severity

KILL_CHAIN_ORDER = [
    AttackStage.INITIAL_ACCESS,
    AttackStage.EXECUTION,
    AttackStage.PERSISTENCE,
    AttackStage.PRIVILEGE_ESCALATION,
    AttackStage.CREDENTIAL_ACCESS,
    AttackStage.DISCOVERY,
    AttackStage.LATERAL_MOVEMENT,
    AttackStage.COLLECTION,
    AttackStage.EXFILTRATION,
]

TACTIC_TO_STAGE: Dict[str, AttackStage] = {
    "initial access": AttackStage.INITIAL_ACCESS,
    "execution": AttackStage.EXECUTION,
    "persistence": AttackStage.PERSISTENCE,
    "privilege escalation": AttackStage.PRIVILEGE_ESCALATION,
    "credential access": AttackStage.CREDENTIAL_ACCESS,
    "discovery": AttackStage.DISCOVERY,
    "lateral movement": AttackStage.LATERAL_MOVEMENT,
    "collection": AttackStage.COLLECTION,
    "exfiltration": AttackStage.EXFILTRATION,
    "command and control": AttackStage.EXECUTION, # related to C2 execution
    "defense evasion": AttackStage.PRIVILEGE_ESCALATION
}


class AttackChainReconstructor:
    @classmethod
    def reconstruct_chain(cls, alerts: List[NormalizedAlert]) -> List[AttackChainStep]:
        """
        Extracts evidence-grounded stages sorted in chronological and logical kill-chain progression.
        """
        stage_evidence: Dict[AttackStage, List[NormalizedAlert]] = {}

        for alert in alerts:
            # Low severity benign telemetry without explicit MITRE tags or anomaly flags should not form an attack chain
            if alert.severity == Severity.LOW and not alert.mitre_technique_id and not alert.is_anomalous:
                continue

            tactic = (alert.mitre_tactic or "").lower()
            stage = TACTIC_TO_STAGE.get(tactic)
            if not stage:
                # Infer from alert_type or detection_rule
                rule_text = (alert.detection_rule + " " + alert.alert_type).lower()
                if "phish" in rule_text or "attachment" in rule_text:
                    stage = AttackStage.INITIAL_ACCESS
                elif "powershell" in rule_text or "script" in rule_text or "cmd" in rule_text or "execution" in rule_text:
                    stage = AttackStage.EXECUTION
                elif "registry" in rule_text or "run key" in rule_text or "startup" in rule_text or "scheduled" in rule_text:
                    stage = AttackStage.PERSISTENCE
                elif "privilege" in rule_text or "uac" in rule_text or "sudo" in rule_text:
                    stage = AttackStage.PRIVILEGE_ESCALATION
                elif "mimikatz" in rule_text or "lsass" in rule_text or "kerberoast" in rule_text or "brute" in rule_text or "credential" in rule_text:
                    stage = AttackStage.CREDENTIAL_ACCESS
                elif "recon" in rule_text or "scan" in rule_text or "whoami" in rule_text or "discovery" in rule_text:
                    stage = AttackStage.DISCOVERY
                elif "smb" in rule_text or "lateral" in rule_text or "winrm" in rule_text or "psexec" in rule_text:
                    stage = AttackStage.LATERAL_MOVEMENT
                elif "archive" in rule_text or "zip" in rule_text or "collection" in rule_text:
                    stage = AttackStage.COLLECTION
                elif "exfil" in rule_text or "egress" in rule_text or "upload" in rule_text:
                    stage = AttackStage.EXFILTRATION

            if stage:
                if stage not in stage_evidence:
                    stage_evidence[stage] = []
                stage_evidence[stage].append(alert)

        steps: List[AttackChainStep] = []

        # Only output stages supported by telemetry
        for stage in KILL_CHAIN_ORDER:
            if stage in stage_evidence:
                alerts_for_stage = stage_evidence[stage]
                # Sort stage alerts by timestamp
                alerts_for_stage.sort(key=lambda a: a.timestamp)
                primary = alerts_for_stage[0]
                
                tech_id = primary.mitre_technique_id or "T1059"
                tech_name = primary.mitre_technique_name or stage.value
                tactic = primary.mitre_tactic or stage.value
                
                # Concrete evidence narrative
                evidence_desc = (
                    f"Observed on host '{primary.host}' via {primary.source.value}. "
                    f"Rule: '{primary.detection_rule}'. "
                    f"Process/Indicator: '{primary.process or primary.file_hash or primary.source_ip}'"
                )
                
                confidence = sum(a.confidence for a in alerts_for_stage) / len(alerts_for_stage)

                steps.append(AttackChainStep(
                    stage=stage,
                    technique_id=tech_id,
                    technique_name=tech_name,
                    tactic=tactic,
                    timestamp=primary.timestamp,
                    source=primary.source.value,
                    evidence=evidence_desc,
                    confidence=round(confidence, 2),
                    related_alert_ids=[a.id for a in alerts_for_stage]
                ))

        return steps
