from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.redis_client import get_redis
from app.db.session import get_db
from app.models.threat_intel import ThreatLookup
from app.models.user import User
from app.schemas.threat_intel import LookupRequest, LookupResponse
from app.services.threat_intel_service import run_lookup

router = APIRouter(prefix="/threat-intel", tags=["Threat Intelligence"])


@router.post("/lookup", response_model=LookupResponse, status_code=status.HTTP_201_CREATED)
def create_lookup(
    payload: LookupRequest,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
    current_user: User = Depends(get_current_user),
):
    return run_lookup(db, redis_client, current_user.id, payload.lookup_type, payload.value)


@router.get("/history", response_model=list[LookupResponse])
def get_lookup_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
):
    return (
        db.query(ThreatLookup)
        .filter(ThreatLookup.user_id == current_user.id)
        .order_by(ThreatLookup.created_at.desc())
        .limit(limit)
        .all()
    )
