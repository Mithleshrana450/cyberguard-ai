from sqlalchemy.orm import Session

from app.models.admin import AuditLog


def record_audit_log(db: Session, actor_id, action: str, target_user_id=None, details: str = "") -> AuditLog:
    entry = AuditLog(actor_id=actor_id, action=action, target_user_id=target_user_id, details=details)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
