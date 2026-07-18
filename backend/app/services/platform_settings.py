"""
Platform settings storage.

Why get_setting() takes a `default` parameter rather than assuming every
key always exists: this is what lets existing modules (like SIEM) adopt
a configurable setting WITHOUT a hard migration-order dependency - if the
row hasn't been seeded yet for any reason, the module still works exactly
as it did before, just with the hardcoded default. This is a resilience
choice, not a shortcut - a settings row should enhance behavior, never be
a single point of failure for a module that worked fine before.
"""

from sqlalchemy.orm import Session

from app.models.admin import PlatformSetting

DEFAULT_SETTINGS = [
    (
        "brute_force_threshold",
        "5",
        "Number of failed login attempts from one IP within 5 minutes that triggers a SIEM alert.",
    ),
    (
        "platform_name",
        "CyberGuard AI",
        "Display name shown in the UI. (Informational only - not yet wired to the frontend.)",
    ),
    (
        "support_email",
        "support@example.com",
        "Contact email shown to users. (Informational only - not yet wired to the frontend.)",
    ),
]


def get_setting(db: Session, key: str, default: str) -> str:
    row = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
    return row.value if row else default


def get_setting_int(db: Session, key: str, default: int) -> int:
    raw = get_setting(db, key, str(default))
    try:
        return int(raw)
    except ValueError:
        return default


def set_setting(db: Session, key: str, value: str) -> PlatformSetting:
    row = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
    if not row:
        row = PlatformSetting(key=key, value=value, description="")
        db.add(row)
    else:
        row.value = value
    db.commit()
    db.refresh(row)
    return row


def seed_default_settings(db: Session) -> None:
    for key, value, description in DEFAULT_SETTINGS:
        existing = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
        if not existing:
            db.add(PlatformSetting(key=key, value=value, description=description))
    db.commit()
