"""
RefreshToken model.

Why a separate table instead of a column on User:
A user can be logged in from multiple devices (phone, laptop) at once -
each login creates its own refresh token row. This also enables:
  - "Log out of this device" (revoke one row)
  - "Log out everywhere" (revoke all rows for a user)
  - Seeing active sessions in a future security settings page

We store token_hash, not the raw token - same reasoning as password
hashing. If this table leaks, the tokens in it are useless without also
breaking the hash.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
