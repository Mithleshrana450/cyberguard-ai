import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class AdminUserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    actor_id: uuid.UUID
    action: str
    target_user_id: uuid.UUID | None
    details: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SettingResponse(BaseModel):
    key: str
    value: str
    description: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class SettingUpdateRequest(BaseModel):
    value: str
