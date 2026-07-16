import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.threat_intel import Verdict


class ForensicsRecordResponse(BaseModel):
    id: uuid.UUID
    filename: str
    file_size_bytes: int
    mime_type: str
    md5_hash: str
    sha1_hash: str
    sha256_hash: str
    has_gps_data: bool
    metadata_json: str
    threat_verdict: Verdict | None
    created_at: datetime

    model_config = {"from_attributes": True}


class IntegrityCheckResponse(BaseModel):
    original_filename: str
    original_sha256: str
    uploaded_sha256: str
    is_match: bool
