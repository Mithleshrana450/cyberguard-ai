import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.incident import Incident
from app.models.user import User, UserRole
from app.schemas.incident import (
    IncidentCreate,
    IncidentListItem,
    IncidentResponse,
    IncidentUpdate,
    NoteCreate,
    NoteResponse,
)
from app.services.incident_service import add_note, create_incident, get_incident_or_404, update_incident

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

_ANALYST_OR_ADMIN = require_role(UserRole.ADMIN, UserRole.ANALYST)


def _parse_uuid_or_404(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except ValueError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Incident not found.")


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create(
    payload: IncidentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return create_incident(db, current_user.id, payload)


@router.get("", response_model=list[IncidentListItem])
def list_incidents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: str | None = None,
    limit: int = 100,
):
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    return query.order_by(Incident.created_at.desc()).limit(limit).all()


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return get_incident_or_404(db, _parse_uuid_or_404(incident_id))


@router.patch("/{incident_id}", response_model=IncidentResponse)
def update(
    incident_id: str,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_ANALYST_OR_ADMIN),
):
    return update_incident(db, _parse_uuid_or_404(incident_id), payload)


@router.post("/{incident_id}/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    incident_id: str,
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return add_note(db, _parse_uuid_or_404(incident_id), current_user.id, payload.content)
