import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.threat_intel import LookupType, Verdict


class LookupRequest(BaseModel):
    lookup_type: LookupType
    value: str


class LookupResponse(BaseModel):
    id: uuid.UUID
    lookup_type: LookupType
    query_value: str
    verdict: Verdict
    malicious_count: int
    suspicious_count: int
    total_engines: int
    summary: str
    created_at: datetime

    model_config = {"from_attributes": True}
