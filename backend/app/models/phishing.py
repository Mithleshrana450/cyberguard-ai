import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AnalysisType(str, enum.Enum):
    URL = "url"
    EMAIL = "email"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PhishingAnalysis(Base):
    __tablename__ = "phishing_analyses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    analysis_type: Mapped[AnalysisType] = mapped_column(
        Enum(AnalysisType, values_callable=lambda e: [x.value for x in e]), nullable=False
    )
    # Truncated preview of the analyzed input (first ~300 chars) - stored
    # for history display, NOT the full raw email indefinitely. Emails can
    # contain personal/sensitive content, so keeping only a preview limits
    # how much of that data sits in the database long-term.
    input_preview: Mapped[str] = mapped_column(String(320), nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-100, higher = more suspicious
    risk_level: Mapped[RiskLevel] = mapped_column(
        Enum(RiskLevel, values_callable=lambda e: [x.value for x in e]), nullable=False
    )
    findings_json: Mapped[str] = mapped_column(Text, nullable=False)
    ai_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
