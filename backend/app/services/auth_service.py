"""
Auth service - all authentication business logic lives here, not in routes.

Why: app/api/v1/auth.py (the routes) stays a thin layer that just parses
requests and calls these functions. This means:
  - We can unit test registration/login logic without spinning up HTTP.
  - If we later add a CLI command to create an admin user, it calls
    register_user() directly instead of duplicating this logic.
"""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.refresh_token import RefreshToken
from app.models.user import User


def register_user(db: Session, email: str, password: str, full_name: str) -> User:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        # 409 Conflict is the correct status code for "resource already
        # exists" - not 400, which is for malformed requests.
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")

    user = User(email=email, hashed_password=hash_password(password), full_name=full_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _generate_refresh_token() -> tuple[str, str]:
    """
    Returns (raw_token, token_hash).
    The raw token is sent to the client ONCE and never stored.
    Only the hash is persisted, so a database leak alone can't be used to
    log in as anyone - same principle as password hashing.
    secrets.token_urlsafe() is cryptographically secure random generation
    (unlike Python's default `random` module, which is NOT safe for
    security-sensitive tokens).
    """
    raw_token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    return raw_token, token_hash


def authenticate_and_issue_tokens(
    db: Session, email: str, password: str, ip_address: str, redis_client
) -> dict:
    from app.services import siem_service  # local import avoids a circular import with siem_service

    user = db.query(User).filter(User.email == email).first()

    # Deliberately vague error message: "Incorrect email or password" for
    # BOTH "email doesn't exist" and "password is wrong" cases. Returning a
    # different message for each (e.g. "no account with that email") lets
    # an attacker enumerate which emails are registered - a real OWASP
    # concern (user enumeration).
    if not user or not verify_password(password, user.hashed_password):
        siem_service.record_login_attempt(
            db, redis_client, email, ip_address, success=False, user_id=user.id if user else None
        )
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")

    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been disabled.")

    siem_service.record_login_attempt(db, redis_client, email, ip_address, success=True, user_id=user.id)

    access_token = create_access_token(subject=str(user.id), role=user.role.value)

    raw_refresh_token, token_hash = _generate_refresh_token()
    refresh_token_row = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(refresh_token_row)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": raw_refresh_token,
        "token_type": "bearer",
    }


def refresh_access_token(db: Session, raw_refresh_token: str) -> dict:
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    token_row = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    if not token_row or token_row.revoked:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token is invalid or expired.")

    # Some database drivers don't round-trip timezone info on read, which
    # would otherwise crash this comparison (naive vs aware datetime).
    # Normalizing defensively here means we NEVER accidentally skip the
    # expiry check due to a comparison error - fail closed, not open.
    expires_at = token_row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token is invalid or expired.")

    user = db.query(User).filter(User.id == token_row.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User account is no longer valid.")

    new_access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return {"access_token": new_access_token, "refresh_token": raw_refresh_token, "token_type": "bearer"}


def revoke_refresh_token(db: Session, raw_refresh_token: str) -> None:
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    token_row = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if token_row:
        token_row.revoked = True
        db.commit()


def get_user_by_id(db: Session, user_id: str) -> User | None:
    try:
        return db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    except ValueError:
        return None
