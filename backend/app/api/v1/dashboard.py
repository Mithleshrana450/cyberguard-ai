"""
Dashboard routes.

Now that the scanner module exists, this pulls real numbers from the
database instead of the honest-zero placeholder from Module 2. This is
exactly the "no rewrite needed" payoff described in that module's docs -
the frontend component doesn't change at all, only what this endpoint
returns.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.scan import FindingSeverity, Scan, ScanFinding, ScanStatus
from app.models.user import User
from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    user_scans = db.query(Scan).filter(Scan.user_id == current_user.id)

    total_scans_run = user_scans.count()

    latest_completed_scan = (
        user_scans.filter(Scan.status == ScanStatus.COMPLETED)
        .order_by(Scan.completed_at.desc())
        .first()
    )
    security_score = latest_completed_scan.security_score if latest_completed_scan else 0

    findings_query = (
        db.query(ScanFinding)
        .join(Scan, ScanFinding.scan_id == Scan.id)
        .filter(Scan.user_id == current_user.id)
    )
    active_alerts = findings_query.count()
    critical_alerts = findings_query.filter(ScanFinding.severity == FindingSeverity.CRITICAL).count()

    recent_scans = user_scans.order_by(Scan.started_at.desc()).limit(5).all()
    recent_activity = [
        {
            "type": "scan",
            "target_url": s.target_url,
            "status": s.status.value,
            "started_at": s.started_at.isoformat(),
        }
        for s in recent_scans
    ]

    return DashboardSummary(
        security_score=security_score,
        active_alerts=active_alerts,
        critical_alerts=critical_alerts,
        total_scans_run=total_scans_run,
        recent_activity=recent_activity,
    )
