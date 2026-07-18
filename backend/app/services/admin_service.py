"""
Admin orchestration service.

The self-protection guard in update_user() is the most important logic
in this module: an admin can NEVER change their own role away from admin
or deactivate their own account, via this endpoint. Without this, a
single careless click ("let me test what viewer role looks like") could
lock the only admin account out of the platform with no way back in
short of direct database access.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.admin import AuditLog
from app.models.user import User, UserRole
from app.services.audit_log import record_audit_log


def list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


def update_user(
    db: Session,
    actor_id,
    target_user_id,
    new_role: UserRole | None,
    new_is_active: bool | None,
) -> User:
    target = db.query(User).filter(User.id == target_user_id).first()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")

    is_self = target.id == actor_id
    if is_self and new_role is not None and new_role != UserRole.ADMIN:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "You cannot change your own role away from admin. Ask another admin to do this "
            "if it's genuinely needed.",
        )
    if is_self and new_is_active is False:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot deactivate your own account.")

    changes = []
    if new_role is not None and new_role != target.role:
        changes.append(f"role: {target.role.value} -> {new_role.value}")
        target.role = new_role
    if new_is_active is not None and new_is_active != target.is_active:
        changes.append(f"is_active: {target.is_active} -> {new_is_active}")
        target.is_active = new_is_active

    db.commit()
    db.refresh(target)

    if changes:
        record_audit_log(
            db,
            actor_id=actor_id,
            action="user.updated",
            target_user_id=target.id,
            details="; ".join(changes),
        )

    return target


def list_audit_logs(db: Session, limit: int = 100) -> list[AuditLog]:
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
