from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.services.analytics_service import gather_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])

_ANALYST_OR_ADMIN = require_role(UserRole.ADMIN, UserRole.ANALYST)


@router.get("/summary")
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(_ANALYST_OR_ADMIN),
    days: int = 30,
):
    days = max(1, min(days, 90))
    return gather_analytics(db, days)
