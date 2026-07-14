"""
Auth dependencies - reusable pieces every protected route will use.

FastAPI's dependency injection system lets a route declare
`current_user: User = Depends(get_current_user)` and FastAPI handles
calling this function, extracting the token, validating it, and either
injecting the User object or raising 401 - all before the route's own
code even runs.

This is the ONE place token validation logic lives. Every module we build
from here on (scanner, SIEM, admin panel...) reuses this same dependency
instead of re-implementing auth checks.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User, UserRole
from app.services.auth_service import get_user_by_id

# HTTPBearer expects "Authorization: Bearer <token>" - the standard header
# format. FastAPI's Swagger UI (/api/docs) auto-generates an "Authorize"
# button when it sees this scheme, making the docs actually testable.
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)

    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_id(db, payload.get("sub"))
    if user is None or not user.is_active:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "User not found or inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(*allowed_roles: UserRole):
    """
    RBAC enforcement, as a dependency FACTORY.

    Usage in a route:
        @router.delete("/users/{id}")
        def delete_user(current_user: User = Depends(require_role(UserRole.ADMIN))):
            ...

    Why a factory (a function that returns a function) instead of one
    fixed dependency: different routes need different role requirements.
    This lets each route declare exactly which roles it permits, in one
    line, without writing a separate dependency function per role
    combination.
    """

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"This action requires one of these roles: {[r.value for r in allowed_roles]}.",
            )
        return current_user

    return role_checker
