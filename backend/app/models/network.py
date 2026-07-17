import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class NetworkScanStatus(str, enum.Enum):
    COMPLETED = "completed"
    FAILED = "failed"


class NetworkScan(Base):
    __tablename__ = "network_scans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    target_range: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[NetworkScanStatus] = mapped_column(
        Enum(NetworkScanStatus, values_callable=lambda e: [x.value for x in e]), nullable=False
    )
    hosts_scanned: Mapped[int] = mapped_column(Integer, default=0)
    hosts_up: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    hosts: Mapped[list["NetworkHost"]] = relationship(back_populates="scan", cascade="all, delete-orphan")


class NetworkHost(Base):
    __tablename__ = "network_hosts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    scan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("network_scans.id"), nullable=False, index=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    is_up: Mapped[bool] = mapped_column(Boolean, nullable=False)
    hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # JSON-encoded list of open port numbers - kept as text since the
    # count varies per host and doesn't need to be queried individually.
    open_ports_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")

    scan: Mapped["NetworkScan"] = relationship(back_populates="hosts")
