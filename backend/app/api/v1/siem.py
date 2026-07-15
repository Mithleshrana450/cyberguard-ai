"""
SIEM routes.

Both endpoints use require_role(ADMIN, ANALYST) - the first real use of
Module 1's RBAC dependency factory in an actual feature. Login events and
alerts are platform-wide security data (who's attacking the whole
system), not something tied to one user's own account, so a 'viewer' role
shouldn't see it.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.security_event import LoginEvent, SecurityAlert
from app.models.user import User, UserRole
from app.schemas.siem import LoginEventResponse, SecurityAlertResponse

router = APIRouter(prefix="/siem", tags=["Mini SIEM"])

_ANALYST_OR_ADMIN = require_role(UserRole.ADMIN, UserRole.ANALYST)


@router.get("/alerts", response_model=list[SecurityAlertResponse])
def list_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(_ANALYST_OR_ADMIN),
    limit: int = 50,
):
    return db.query(SecurityAlert).order_by(SecurityAlert.created_at.desc()).limit(limit).all()


@router.get("/events", response_model=list[LoginEventResponse])
def list_login_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(_ANALYST_OR_ADMIN),
    limit: int = 100,
):
    return db.query(LoginEvent).order_by(LoginEvent.created_at.desc()).limit(limit).all()
