import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.network import NetworkScan
from app.models.user import User, UserRole
from app.schemas.network import NetworkScanListItem, NetworkScanRequest, NetworkScanResponse
from app.services.network_service import run_network_scan

router = APIRouter(prefix="/network", tags=["Network Monitoring"])

_ANALYST_OR_ADMIN = require_role(UserRole.ADMIN, UserRole.ANALYST)


@router.post("/scan", response_model=NetworkScanResponse, status_code=status.HTTP_201_CREATED)
def create_scan(
    payload: NetworkScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_ANALYST_OR_ADMIN),
):
    return run_network_scan(db, current_user.id, payload.target_range)


@router.get("/scans", response_model=list[NetworkScanListItem])
def list_scans(
    db: Session = Depends(get_db), current_user: User = Depends(_ANALYST_OR_ADMIN), limit: int = 50
):
    return (
        db.query(NetworkScan)
        .filter(NetworkScan.user_id == current_user.id)
        .order_by(NetworkScan.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/scans/{scan_id}", response_model=NetworkScanResponse)
def get_scan(
    scan_id: str, db: Session = Depends(get_db), current_user: User = Depends(_ANALYST_OR_ADMIN)
):
    try:
        scan_uuid = uuid.UUID(scan_id)
    except ValueError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Scan not found.")

    scan = (
        db.query(NetworkScan)
        .filter(NetworkScan.id == scan_uuid, NetworkScan.user_id == current_user.id)
        .first()
    )
    if not scan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Scan not found.")
    return scan
