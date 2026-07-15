import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.scan import FindingCategory, FindingSeverity, ScanStatus


class ScanRequest(BaseModel):
    target_url: str = Field(
        description="Full URL to scan, e.g. https://example.com. You must own or be "
        "authorized to test this target."
    )


class FindingResponse(BaseModel):
    id: uuid.UUID
    category: FindingCategory
    severity: FindingSeverity
    title: str
    description: str
    recommendation: str

    model_config = {"from_attributes": True}


class ScanResponse(BaseModel):
    id: uuid.UUID
    target_url: str
    status: ScanStatus
    security_score: int | None
    error_message: str | None
    started_at: datetime
    completed_at: datetime | None
    findings: list[FindingResponse]

    model_config = {"from_attributes": True}


class ScanListItem(BaseModel):
    """Lighter-weight schema for the scan history list - no findings array,
    since a list of 50 past scans doesn't need every finding's full text."""

    id: uuid.UUID
    target_url: str
    status: ScanStatus
    security_score: int | None
    started_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}
