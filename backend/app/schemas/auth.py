"""
Pydantic schemas for authentication.

Why request and response schemas are SEPARATE classes, never the ORM model
directly:
  - UserCreate (request) requires a plaintext `password` field - that
    should NEVER appear in a response.
  - UserResponse (response) deliberately excludes `hashed_password` -
    even though it's just a hash, there's no reason to ever send it to
    the client. Being explicit about what leaves the server is a core
    security habit, not paranoia - it's how accidental data leaks happen
    in real APIs (a lazy `return db_user` that serializes the whole ORM
    object, hash included).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    # Lets Pydantic build this schema directly from a SQLAlchemy ORM object
    # (model.User) instead of requiring a manual dict conversion.
    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
