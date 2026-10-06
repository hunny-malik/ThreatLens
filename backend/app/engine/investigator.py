"""
ThreatLens Evidence-Based Investigation Recommender
Generates prioritized, tactical investigation playbooks dynamically adapted to incident context.
"""
from typing import List
from app.models.schemas import InvestigationStep, AttackChainStep, NormalizedAlert, AssetCriticality


class InvestigationRecommender:
    @classmethod
    def generate_steps(
        cls,
        primary_asset: str,
        asset_criticality: AssetCriticality,
        attack_chain: List[AttackChainStep],
        sample_alerts: List[NormalizedAlert]
    ) -> List[InvestigationStep]:
        steps: List[InvestigationStep] = []
        priority = 1

        # Check for Domain Controller or critical asset
        if asset_criticality == AssetCriticality.CRITICAL:
            steps.append(InvestigationStep(
                priority=priority,
                action=f"Review Tier-0 Authentication Logs on {primary_asset}",
                target_entity=primary_asset,
                rationale="Critical asset involved with active security alert correlation. High probability of credential theft or ticket tampering.",
                evidence_pointer="Windows Event ID 4624 (Logon), 4672 (Admin Logon), 4768/4769 (Kerberos TGT/ST requests)",
                completed=False
            ))
            priority += 1

        # Check for Credential Access or LSASS
        if any("T1003" in s.technique_id or s.stage.value == "Credential Access" for s in attack_chain):
            steps.append(InvestigationStep(
                priority=priority,
                action="Inspect Host Process Ancestry & Memory Injections",
                target_entity=primary_asset,
                rationale="Evidence of credential dumping or process injection detected. Validate process parentage.",
                evidence_pointer="EDR Process Tree: Examine parent/child relationship and DLL loads for lsass.exe and powershell.exe",
                completed=False
            ))
            priority += 1

        # Check for Lateral Movement
        if any("T1021" in s.technique_id or s.stage.value == "Lateral Movement" for s in attack_chain):
            steps.append(InvestigationStep(
                priority=priority,
                action="Verify Lateral Movement Indicators & Remote Sessions",
                target_entity=primary_asset,
                rationale="Remote administrative shares or WinRM execution observed connecting across internal subnets.",
                evidence_pointer="Network flow logs & Event ID 5140 (Network Share Object Access) and 7045 (Service Creation)",
                completed=False
            ))
            priority += 1

        # Check external IP connections
        ext_ips = [a.source_ip for a in sample_alerts if not a.source_ip.startswith("10.") and a.source_ip != "0.0.0.0"]
        if ext_ips:
            steps.append(InvestigationStep(
                priority=priority,
                action=f"Correlate External C2 Communications ({ext_ips[0]}) with Threat Intel",
                target_entity=ext_ips[0],
                rationale="Direct network communication or beaconing detected to external untrusted infrastructure.",
                evidence_pointer=f"Firewall & Zeek conn.log matching outbound traffic destination: {ext_ips[0]}",
                completed=False
            ))
            priority += 1

        # Standard containment step
        steps.append(InvestigationStep(
            priority=priority,
            action=f"Assess Host Containment Readiness for {primary_asset}",
            target_entity=primary_asset,
            rationale="Verify operational dependencies before applying network isolation policy.",
            evidence_pointer="CMDB Asset Criticality Matrix & Active Service Dependency Registry",
            completed=False
        ))

        return steps
