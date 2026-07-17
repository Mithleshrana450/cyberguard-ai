from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.incident import Incident, IncidentNote, IncidentStatus
from app.services.incident_workflow import is_valid_transition


def create_incident(db: Session, user_id, payload) -> Incident:
    incident = Incident(
        created_by=user_id,
        title=payload.title,
        description=payload.description,
        severity=payload.severity,
        source_type=payload.source_type,
        source_id=payload.source_id,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


def get_incident_or_404(db: Session, incident_id) -> Incident:
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Incident not found.")
    return incident


def update_incident(db: Session, incident_id, payload) -> Incident:
    incident = get_incident_or_404(db, incident_id)

    if payload.status is not None and payload.status != incident.status:
        if not is_valid_transition(incident.status, payload.status):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Cannot move an incident from '{incident.status.value}' to "
                f"'{payload.status.value}' directly. See the incident workflow rules.",
            )
        incident.status = payload.status
        if payload.status == IncidentStatus.CLOSED:
            incident.closed_at = datetime.now(timezone.utc)
        else:
            incident.closed_at = None

    if payload.assigned_to is not None:
        incident.assigned_to = payload.assigned_to

    if payload.severity is not None:
        incident.severity = payload.severity

    db.commit()
    db.refresh(incident)
    return incident


def add_note(db: Session, incident_id, author_id, content: str) -> IncidentNote:
    get_incident_or_404(db, incident_id)

    note = IncidentNote(incident_id=incident_id, author_id=author_id, content=content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note
