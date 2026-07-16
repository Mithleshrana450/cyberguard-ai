import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.threat_intel import Verdict


class ForensicsRecord(Base):
    __tablename__ = "forensics_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(255), nullable=False)
    md5_hash: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    sha1_hash: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    has_gps_data: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # JSON-encoded string of any extracted metadata (EXIF fields, etc.) -
    # kept as text rather than a rigid schema since different file types
    # yield completely different metadata shapes.
    metadata_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    # Nullable: populated by cross-checking sha256_hash against Module 5's
    # threat-intel hash lookup, reusing the SAME Postgres enum type that
    # migration d4e8b25c9a16 already created - no duplicate type needed.
    # Null means "no threat-intel check was performed" (e.g. VirusTotal
    # not configured), distinct from an actual 'unknown' verdict.
    threat_verdict: Mapped[Verdict | None] = mapped_column(
        Enum(Verdict, values_callable=lambda e: [x.value for x in e], name="verdict"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
