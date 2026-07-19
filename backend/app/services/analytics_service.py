"""
Analytics service - the impure half of this module's pure/impure split.

Everything here is deliberately PLATFORM-WIDE (no user_id filtering) -
unlike Scanner/Threat Intel/Phishing's per-user history, an executive
analytics view needs to answer "how is the organization doing," not
"how is this one user doing." This is why the module is restricted to
admin/analyst in the API layer - it's showing everyone's data.
"""

from sqlalchemy.orm import Session

from app.models.incident import Incident, IncidentStatus
from app.models.phishing import PhishingAnalysis
from app.models.scan import Scan, ScanFinding, ScanStatus
from app.models.security_event import SecurityAlert
from app.models.user import User
from app.services.analytics_data import bucket_by_day, compute_distribution, compute_score_distribution


def gather_analytics(db: Session, days: int = 30) -> dict:
    alert_timestamps = [a.created_at.isoformat() for a in db.query(SecurityAlert.created_at).all()]
    incident_timestamps = [i.created_at.isoformat() for i in db.query(Incident.created_at).all()]

    completed_scans = db.query(Scan).filter(Scan.status == ScanStatus.COMPLETED).all()
    scores = [s.security_score for s in completed_scans if s.security_score is not None]

    finding_severities = [f.severity.value for f in db.query(ScanFinding.severity).all()]
    alert_severities = [a.severity.value for a in db.query(SecurityAlert.severity).all()]
    phishing_levels = [p.risk_level.value for p in db.query(PhishingAnalysis.risk_level).all()]

    incidents = db.query(Incident).all()
    total_incidents = len(incidents)
    resolved_or_closed = len(
        [i for i in incidents if i.status in (IncidentStatus.RESOLVED, IncidentStatus.CLOSED)]
    )
    resolution_rate = round((resolved_or_closed / total_incidents) * 100) if total_incidents else None

    total_users = db.query(User).count()
    avg_score = round(sum(scores) / len(scores)) if scores else None

    return {
        "alert_trend": bucket_by_day(alert_timestamps, days),
        "incident_trend": bucket_by_day(incident_timestamps, days),
        "scan_score_distribution": compute_score_distribution(scores),
        "finding_severity_distribution": compute_distribution(finding_severities),
        "alert_severity_distribution": compute_distribution(alert_severities),
        "phishing_risk_distribution": compute_distribution(phishing_levels),
        "executive_summary": {
            "total_users": total_users,
            "total_scans": len(completed_scans),
            "average_security_score": avg_score,
            "total_alerts": len(alert_timestamps),
            "total_incidents": total_incidents,
            "incident_resolution_rate_percent": resolution_rate,
        },
    }
