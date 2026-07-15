import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.scan import Scan
from app.models.user import User
from app.schemas.scanner import ScanListItem, ScanRequest, ScanResponse
from app.services.scanner_service import run_scan

router = APIRouter(prefix="/scanner", tags=["Website Scanner"])


@router.post("/scans", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
def create_scan(
    payload: ScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        scan = run_scan(db, current_user.id, payload.target_url)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc))
    return scan


@router.get("/scans", response_model=list[ScanListItem])
def list_scans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Scan)
        .filter(Scan.user_id == current_user.id)
        .order_by(Scan.started_at.desc())
        .all()
    )


@router.get("/scans/{scan_id}", response_model=ScanResponse)
def get_scan(scan_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        scan_uuid = uuid.UUID(scan_id)
    except ValueError:
        # A malformed ID (not even a valid UUID shape) is just as "not
        # found" from the client's perspective as a well-formed ID that
        # doesn't exist - both should be 404, not a 500 crash.
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Scan not found.")

    scan = db.query(Scan).filter(Scan.id == scan_uuid, Scan.user_id == current_user.id).first()
    if not scan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Scan not found.")
    return scan
