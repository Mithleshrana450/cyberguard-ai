import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.redis_client import get_redis
from app.db.session import get_db
from app.models.forensics import ForensicsRecord
from app.models.user import User
from app.schemas.forensics import ForensicsRecordResponse, IntegrityCheckResponse
from app.services.forensics_service import analyze_upload, verify_integrity

router = APIRouter(prefix="/forensics", tags=["Digital Forensics"])


@router.post("/analyze", response_model=ForensicsRecordResponse, status_code=status.HTTP_201_CREATED)
async def analyze_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
    current_user: User = Depends(get_current_user),
):
    return await analyze_upload(db, redis_client, current_user.id, file)


@router.get("/analyses", response_model=list[ForensicsRecordResponse])
def list_analyses(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user), limit: int = 50
):
    return (
        db.query(ForensicsRecord)
        .filter(ForensicsRecord.user_id == current_user.id)
        .order_by(ForensicsRecord.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/analyses/{record_id}", response_model=ForensicsRecordResponse)
def get_analysis(
    record_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        record_uuid = uuid.UUID(record_id)
    except ValueError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Forensics record not found.")

    record = (
        db.query(ForensicsRecord)
        .filter(ForensicsRecord.id == record_uuid, ForensicsRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Forensics record not found.")
    return record


@router.post("/analyses/{record_id}/verify", response_model=IntegrityCheckResponse)
async def verify_file_integrity(
    record_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        record_uuid = uuid.UUID(record_id)
    except ValueError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Forensics record not found.")

    return await verify_integrity(db, record_uuid, current_user.id, file)
