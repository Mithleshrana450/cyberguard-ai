import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LookupType(str, enum.Enum):
    IP = "ip"
    DOMAIN = "domain"
    URL = "url"
    HASH = "hash"


class Verdict(str, enum.Enum):
    MALICIOUS = "malicious"
    SUSPICIOUS = "suspicious"
    CLEAN = "clean"
    UNKNOWN = "unknown"  # not previously analyzed by any vendor


class ThreatLookup(Base):
    __tablename__ = "threat_lookups"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    lookup_type: Mapped[LookupType] = mapped_column(
        Enum(LookupType, values_callable=lambda e: [x.value for x in e]), nullable=False
    )
    query_value: Mapped[str] = mapped_column(String(2048), nullable=False)
    verdict: Mapped[Verdict] = mapped_column(
        Enum(Verdict, values_callable=lambda e: [x.value for x in e]), nullable=False
    )
    malicious_count: Mapped[int] = mapped_column(Integer, default=0)
    suspicious_count: Mapped[int] = mapped_column(Integer, default=0)
    total_engines: Mapped[int] = mapped_column(Integer, default=0)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
