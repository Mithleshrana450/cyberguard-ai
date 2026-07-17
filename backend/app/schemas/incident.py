import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.incident import IncidentSeverity, IncidentStatus


class IncidentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    severity: IncidentSeverity
    source_type: str | None = None
    source_id: str | None = None


class IncidentUpdate(BaseModel):
    status: IncidentStatus | None = None
    assigned_to: uuid.UUID | None = None
    severity: IncidentSeverity | None = None


class NoteCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class NoteResponse(BaseModel):
    id: uuid.UUID
    author_id: uuid.UUID
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class IncidentResponse(BaseModel):
    id: uuid.UUID
    created_by: uuid.UUID
    assigned_to: uuid.UUID | None
    title: str
    description: str
    status: IncidentStatus
    severity: IncidentSeverity
    source_type: str | None
    source_id: str | None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None
    notes: list[NoteResponse]

    model_config = {"from_attributes": True}


class IncidentListItem(BaseModel):
    id: uuid.UUID
    title: str
    status: IncidentStatus
    severity: IncidentSeverity
    assigned_to: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
