import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.admin import PlatformSetting
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminUserResponse,
    AuditLogResponse,
    SettingResponse,
    SettingUpdateRequest,
    UserUpdateRequest,
)
from app.services.admin_service import list_audit_logs, list_users, update_user
from app.services.audit_log import record_audit_log
from app.services.platform_settings import set_setting

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

_ADMIN_ONLY = require_role(UserRole.ADMIN)


@router.get("/users", response_model=list[AdminUserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(_ADMIN_ONLY)):
    return list_users(db)


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
def patch_user(
    user_id: str,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_ADMIN_ONLY),
):
    try:
        target_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")

    return update_user(db, current_user.id, target_uuid, payload.role, payload.is_active)


@router.get("/audit-logs", response_model=list[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(_ADMIN_ONLY)):
    return list_audit_logs(db)


@router.get("/settings", response_model=list[SettingResponse])
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(_ADMIN_ONLY)):
    return db.query(PlatformSetting).order_by(PlatformSetting.key).all()


@router.patch("/settings/{key}", response_model=SettingResponse)
def patch_setting(
    key: str,
    payload: SettingUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_ADMIN_ONLY),
):
    updated = set_setting(db, key, payload.value)
    record_audit_log(
        db, actor_id=current_user.id, action="setting.updated", details=f"{key} = {payload.value}"
    )
    return updated
