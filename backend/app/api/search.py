"""
ThreatLens Global Search Engine API
High-performance cross-indexing across incidents, alerts, IPs, domains, hashes, users, hosts, assets, and MITRE techniques.
"""
from fastapi import APIRouter, Query
from typing import Dict, Any, List
from app.core.state import app_state

router = APIRouter(prefix="/api/search", tags=["Global Search"])


@router.get("")
def global_search(q: str = Query(..., min_length=1)) -> Dict[str, Any]:
    query = q.lower().strip()
    
    matched_incidents = []
    matched_alerts = []
    matched_campaigns = []
    matched_assets = []

    # 1. Search Incidents
    for inc in app_state.incidents:
        hit = False
        reasons = []
        if query in inc.id.lower():
            hit = True
            reasons.append(f"Incident ID: {inc.id}")
        if query in inc.title.lower():
            hit = True
            reasons.append(f"Title match: {inc.title}")
        if query in inc.primary_asset.lower():
            hit = True
            reasons.append(f"Primary asset: {inc.primary_asset}")
        for ip in inc.source_ips + inc.destination_ips:
            if query in ip.lower():
                hit = True
                reasons.append(f"IP address: {ip}")
        for user in inc.users_involved:
            if query in user.lower():
                hit = True
                reasons.append(f"User: {user}")
        for d in inc.domains:
            if query in d.lower():
                hit = True
                reasons.append(f"Domain: {d}")
        for h in inc.hashes:
            if query in h.lower():
                hit = True
                reasons.append(f"Hash: {h}")
        for tech in inc.mitre_techniques:
            if query in tech.technique_id.lower() or query in tech.technique_name.lower():
                hit = True
                reasons.append(f"MITRE: {tech.technique_id} {tech.technique_name}")

        if hit:
            matched_incidents.append({
                "incident": inc,
                "match_reasons": reasons[:3]
            })

    # 2. Search Alerts
    for a in app_state.raw_alerts[:200]:
        if (query in a.id.lower() or query in a.raw_message.lower() or
            query in a.host.lower() or query in a.source_ip.lower() or
            (a.process and query in a.process.lower())):
            matched_alerts.append(a)
            if len(matched_alerts) >= 15:
                break

    # 3. Search Campaigns
    for c in app_state.campaigns:
        if (query in c.id.lower() or query in c.name.lower() or
            query in c.threat_actor_alias.lower() or
            any(query in ip.lower() for ip in c.common_indicators.get("ips", []))):
            matched_campaigns.append(c)

    # 4. Search Assets
    for ast in app_state.assets:
        if (query in ast.name.lower() or query in ast.ip_address.lower() or
            query in ast.owner.lower() or query in ast.type.value.lower()):
            matched_assets.append(ast)

    return {
        "query": q,
        "total_results": len(matched_incidents) + len(matched_alerts) + len(matched_campaigns) + len(matched_assets),
        "incidents": matched_incidents[:10],
        "alerts": matched_alerts[:10],
        "campaigns": matched_campaigns[:5],
        "assets": matched_assets[:5]
    }
