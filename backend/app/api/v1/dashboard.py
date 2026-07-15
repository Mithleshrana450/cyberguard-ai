"""
Dashboard routes.

Note the Depends(get_current_user) on the route below - this is the FIRST
route in the app (besides /auth/me) that requires authentication. It
proves Module 1's auth dependency works for protecting real feature
routes, not just the auth module itself.
"""

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(current_user: User = Depends(get_current_user)):
    # Honest placeholder - see schemas/dashboard.py docstring for why these
    # are zero instead of fake demo numbers.
    return DashboardSummary(
        security_score=0,
        active_alerts=0,
        critical_alerts=0,
        total_scans_run=0,
        recent_activity=[],
    )
