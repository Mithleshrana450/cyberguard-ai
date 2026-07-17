"""
Security context gathering for the AI assistant.

Split into two pieces, same principle as every other module's pure/impure
separation:
  - build_context_summary(): takes a plain dict of already-fetched numbers
    and formats it into a text block for the LLM prompt. No DB access -
    fully unit testable with synthetic data.
  - gather_user_security_context(): the impure part, runs the actual
    queries across FIVE different modules' tables. Not unit tested
    directly (it's mostly "does SQLAlchemy work"), but its OUTPUT shape
    is what feeds the tested pure function.
"""

from sqlalchemy.orm import Session

from app.models.network import NetworkScan
from app.models.phishing import PhishingAnalysis, RiskLevel
from app.models.scan import Scan, ScanFinding, ScanStatus, FindingSeverity
from app.models.security_event import SecurityAlert
from app.models.threat_intel import ThreatLookup, Verdict


def build_context_summary(context: dict) -> str:
    lines = ["Current security context for this user (use this to ground your answers):"]

    if context.get("latest_scan_score") is not None:
        lines.append(
            f"- Latest website scan security score: {context['latest_scan_score']}/100 "
            f"(target: {context.get('latest_scan_target', 'unknown')})"
        )
    else:
        lines.append("- No website scans have been run yet.")

    lines.append(f"- Open critical scan findings: {context.get('critical_scan_findings', 0)}")
    lines.append(f"- Unresolved SIEM security alerts: {context.get('active_siem_alerts', 0)}")
    lines.append(f"- Threat-intel lookups flagged malicious: {context.get('malicious_threat_lookups', 0)}")
    lines.append(f"- Phishing checks flagged high/critical risk: {context.get('risky_phishing_checks', 0)}")

    if context.get("last_network_scan_hosts_up") is not None:
        lines.append(
            f"- Most recent network scan found {context['last_network_scan_hosts_up']} host(s) up "
            f"in range {context.get('last_network_scan_range', 'unknown')}"
        )

    return "\n".join(lines)


def gather_user_security_context(db: Session, user_id) -> dict:
    context: dict = {}

    latest_scan = (
        db.query(Scan)
        .filter(Scan.user_id == user_id, Scan.status == ScanStatus.COMPLETED)
        .order_by(Scan.completed_at.desc())
        .first()
    )
    if latest_scan:
        context["latest_scan_score"] = latest_scan.security_score
        context["latest_scan_target"] = latest_scan.target_url

    context["critical_scan_findings"] = (
        db.query(ScanFinding)
        .join(Scan, ScanFinding.scan_id == Scan.id)
        .filter(Scan.user_id == user_id, ScanFinding.severity == FindingSeverity.CRITICAL)
        .count()
    )

    context["active_siem_alerts"] = (
        db.query(SecurityAlert).filter(SecurityAlert.is_resolved.is_(False)).count()
    )

    context["malicious_threat_lookups"] = (
        db.query(ThreatLookup)
        .filter(ThreatLookup.user_id == user_id, ThreatLookup.verdict == Verdict.MALICIOUS)
        .count()
    )

    context["risky_phishing_checks"] = (
        db.query(PhishingAnalysis)
        .filter(
            PhishingAnalysis.user_id == user_id,
            PhishingAnalysis.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL]),
        )
        .count()
    )

    latest_net_scan = (
        db.query(NetworkScan)
        .filter(NetworkScan.user_id == user_id)
        .order_by(NetworkScan.created_at.desc())
        .first()
    )
    if latest_net_scan:
        context["last_network_scan_hosts_up"] = latest_net_scan.hosts_up
        context["last_network_scan_range"] = latest_net_scan.target_range

    return context
