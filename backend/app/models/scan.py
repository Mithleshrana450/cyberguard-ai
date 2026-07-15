"""
Scan and ScanFinding models.

Why ScanFinding is a SEPARATE table from Scan, rather than a JSON column
on Scan holding a list of findings:
  - Future modules (Incident Management, Reports) can reference or escalate
    ONE finding directly by its own ID, not "finding #3 inside scan X's
    JSON blob."
  - The dashboard can run a real SQL query like "count critical findings
    across all scans this month" instead of parsing JSON in application
    code - databases are much faster at this than Python loops.
  - Postgres can index/filter on finding.severity directly.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class FindingSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class FindingCategory(str, enum.Enum):
    HEADERS = "headers"
    TLS = "tls"
    ROBOTS = "robots"
    DISCLOSURE = "disclosure"


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    target_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    status: Mapped[ScanStatus] = mapped_column(
        Enum(ScanStatus, values_callable=lambda e: [x.value for x in e]),
        default=ScanStatus.PENDING,
        nullable=False,
    )
    # 0-100, null until the scan completes and a score can be computed.
    security_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    findings: Mapped[list["ScanFinding"]] = relationship(
        back_populates="scan", cascade="all, delete-orphan"
    )


class ScanFinding(Base):
    __tablename__ = "scan_findings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    scan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("scans.id"), nullable=False, index=True)
    category: Mapped[FindingCategory] = mapped_column(
        Enum(FindingCategory, values_callable=lambda e: [x.value for x in e]), nullable=False
    )
    severity: Mapped[FindingSeverity] = mapped_column(
        Enum(FindingSeverity, values_callable=lambda e: [x.value for x in e]), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)

    scan: Mapped["Scan"] = relationship(back_populates="findings")
