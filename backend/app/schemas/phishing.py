import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.phishing import AnalysisType, RiskLevel


class UrlAnalysisRequest(BaseModel):
    url: str = Field(min_length=4, max_length=2048)


class EmailAnalysisRequest(BaseModel):
    raw_email: str = Field(
        min_length=1,
        description="Raw email source, including headers (From, Reply-To, Subject) and body.",
    )


class PhishingAnalysisResponse(BaseModel):
    id: uuid.UUID
    analysis_type: AnalysisType
    input_preview: str
    risk_score: int
    risk_level: RiskLevel
    findings_json: str
    ai_explanation: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
