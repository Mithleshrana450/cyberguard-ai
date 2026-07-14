"""
Security utilities: password hashing and JWT handling.

Why these two concerns live in one file:
Both are pure, stateless functions with no database dependency - they take
input, return output. Keeping them separate from services/ (which DOES talk
to the database) makes them trivially unit-testable and reusable anywhere
in the app (e.g. the AI assistant module could verify a token the same way
the auth routes do, without duplicating this logic).
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# bcrypt is deliberately slow (see Module 1 explanation) - this is a feature,
# not a performance bug. "schemes=['bcrypt']" tells passlib to use it, and
# passlib handles the salt generation for us automatically per-password.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Never compare passwords with `==`. passlib's verify() does a
    constant-time comparison internally, which prevents timing attacks -
    where an attacker measures how long a comparison takes to guess
    characters one at a time.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, role: str) -> str:
    """
    'subject' is the user's ID, encoded as the standard JWT 'sub' claim.
    We also embed 'role' directly in the token so that every request can
    check permissions WITHOUT a database lookup - that's what makes JWT
    auth fast and stateless. The tradeoff: if you change a user's role,
    it won't take effect until their current token expires (hence why
    access tokens are short-lived - 30 minutes here).
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "role": role, "exp": expire, "type": "access"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """
    Returns the decoded payload if the token is valid and unexpired,
    otherwise None. Callers (like our auth dependency) turn None into a
    401 Unauthorized response.
    """
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
