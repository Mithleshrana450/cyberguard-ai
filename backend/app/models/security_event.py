"""
SIEM models: LoginEvent (raw log data) and SecurityAlert (derived pattern).

Why these are two separate tables, not one:
LoginEvent is the raw, high-volume log - every single login attempt,
success or failure, gets a row. SecurityAlert is a much rarer, DERIVED
record - created only when the detection logic (siem_service.py) decides
a pattern in the raw events crosses a threshold. This mirrors how real
SIEM tools work: you keep raw logs for investigation/audit, and alerts are
a separate, human-reviewable layer built on top of them.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AlertSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AlertType(str, enum.Enum):
    BRUTE_FORCE_LOGIN = "brute_force_login"


class LoginEvent(Base):
    __tablename__ = "login_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # user_id is nullable - a failed login with a WRONG email has no matching
    # user row at all, but we still need to log the attempt itself.
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    email_attempted: Mapped[str] = mapped_column(String(255), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )


class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    alert_type: Mapped[AlertType] = mapped_column(
        Enum(AlertType, values_callable=lambda e: [x.value for x in e]), nullable=False
    )
    severity: Mapped[AlertSeverity] = mapped_column(
        Enum(AlertSeverity, values_callable=lambda e: [x.value for x in e]), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    source_ip: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
