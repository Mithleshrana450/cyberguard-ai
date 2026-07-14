"""
User model.

Design decisions worth understanding:

1. UUID primary key instead of auto-increment integer.
   Sequential integer IDs (1, 2, 3...) leak information - an attacker
   hitting /api/v1/users/1 can guess /users/2, /users/3 exist too, and can
   estimate how many users you have (a form of information disclosure).
   UUIDs are unguessable.

2. role stored as a native Python Enum mapped to a Postgres ENUM type.
   This means the DATABASE ITSELF rejects any role value outside
   {admin, analyst, viewer} - invalid data can't get in even if application
   code has a bug. This is "defense in depth": validate at the API layer
   AND enforce at the database layer.

3. is_active flag instead of deleting rows.
   We never hard-delete user accounts. Disabling via is_active=False keeps
   an audit trail (which the Admin Panel and audit logging modules will
   depend on later) - you can't investigate an incident involving a user
   who no longer exists in the database.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        default=UserRole.VIEWER,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
