"""
Report data assembly.

Every function here returns a list of plain dicts (or a summary dict) -
that shape is deliberately generic because it feeds THREE different
consumers: the JSON preview endpoint, the CSV export (csv_export.py), and
the PDF report (pdf_report.py). Producing one normalized shape once,
rather than three module-specific formats, is what keeps those three
consumers simple.
"""

from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.network import NetworkScan
from app.models.phishing import PhishingAnalysis
from app.models.scan import Scan
from app.models.security_event import SecurityAlert
from app.models.threat_intel import ThreatLookup

REPORT_TYPES = ("scans", "alerts", "threat-intel", "phishing", "network", "incidents")


def get_scans(db: Session, user_id, limit: int = 100) -> list[dict]:
    scans = (
        db.query(Scan).filter(Scan.user_id == user_id).order_by(Scan.started_at.desc()).limit(limit).all()
    )
    return [
        {
            "id": str(s.id),
            "target_url": s.target_url,
            "status": s.status.value,
            "security_score": s.security_score,
            "started_at": s.started_at.isoformat(),
        }
        for s in scans
    ]


def get_alerts(db: Session, limit: int = 100) -> list[dict]:
    alerts = db.query(SecurityAlert).order_by(SecurityAlert.created_at.desc()).limit(limit).all()
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "severity": a.severity.value,
            "source_ip": a.source_ip,
            "is_resolved": a.is_resolved,
            "created_at": a.created_at.isoformat(),
        }
        for a in alerts
    ]


def get_threat_lookups(db: Session, user_id, limit: int = 100) -> list[dict]:
    lookups = (
        db.query(ThreatLookup)
        .filter(ThreatLookup.user_id == user_id)
        .order_by(ThreatLookup.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": str(t.id),
            "lookup_type": t.lookup_type.value,
            "query_value": t.query_value,
            "verdict": t.verdict.value,
            "created_at": t.created_at.isoformat(),
        }
        for t in lookups
    ]


def get_phishing_analyses(db: Session, user_id, limit: int = 100) -> list[dict]:
    analyses = (
        db.query(PhishingAnalysis)
        .filter(PhishingAnalysis.user_id == user_id)
        .order_by(PhishingAnalysis.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": str(p.id),
            "analysis_type": p.analysis_type.value,
            "input_preview": p.input_preview,
            "risk_score": p.risk_score,
            "risk_level": p.risk_level.value,
            "created_at": p.created_at.isoformat(),
        }
        for p in analyses
    ]


def get_network_scans(db: Session, user_id, limit: int = 100) -> list[dict]:
    scans = (
        db.query(NetworkScan)
        .filter(NetworkScan.user_id == user_id)
        .order_by(NetworkScan.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": str(n.id),
            "target_range": n.target_range,
            "hosts_scanned": n.hosts_scanned,
            "hosts_up": n.hosts_up,
            "created_at": n.created_at.isoformat(),
        }
        for n in scans
    ]


def get_incidents(db: Session, limit: int = 100) -> list[dict]:
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).limit(limit).all()
    return [
        {
            "id": str(i.id),
            "title": i.title,
            "status": i.status.value,
            "severity": i.severity.value,
            "created_at": i.created_at.isoformat(),
        }
        for i in incidents
    ]


def get_report_rows(db: Session, user_id, report_type: str) -> list[dict]:
    handlers = {
        "scans": lambda: get_scans(db, user_id),
        "alerts": lambda: get_alerts(db),
        "threat-intel": lambda: get_threat_lookups(db, user_id),
        "phishing": lambda: get_phishing_analyses(db, user_id),
        "network": lambda: get_network_scans(db, user_id),
        "incidents": lambda: get_incidents(db),
    }
    if report_type not in handlers:
        raise ValueError(f"Unknown report type: {report_type}")
    return handlers[report_type]()


def get_summary(db: Session, user_id) -> dict:
    all_scans = get_scans(db, user_id)
    all_alerts = get_alerts(db)
    all_incidents = get_incidents(db)

    completed_scores = [s["security_score"] for s in all_scans if s["security_score"] is not None]
    avg_score = round(sum(completed_scores) / len(completed_scores)) if completed_scores else None

    return {
        "average_security_score": avg_score,
        "total_scans": len(all_scans),
        "total_alerts": len(all_alerts),
        "unresolved_alerts": len([a for a in all_alerts if not a["is_resolved"]]),
        "total_incidents": len(all_incidents),
        "open_incidents": len([i for i in all_incidents if i["status"] in ("open", "investigating")]),
        "recent_scans": all_scans[:5],
        "recent_alerts": all_alerts[:5],
        "recent_incidents": all_incidents[:5],
    }
