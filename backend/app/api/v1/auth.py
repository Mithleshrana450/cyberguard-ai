"""
Auth routes.

Notice how thin these are - each route is basically:
  1. Take validated input (Pydantic schema does the validation)
  2. Call a service function
  3. Return the result

All the actual logic (password checks, token generation, error handling)
lives in app/services/auth_service.py. This is the "thin routes, fat
services" pattern mentioned in the architecture doc.
"""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.redis_client import get_redis
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import RefreshRequest, TokenResponse, UserCreate, UserLogin, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    user = auth_service.register_user(db, payload.email, payload.password, payload.full_name)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db), redis_client=Depends(get_redis)):
    # request.client.host gives the direct connecting IP. Behind a reverse
    # proxy (e.g. the Nginx setup in a later DevOps module), this would
    # need to read X-Forwarded-For instead - noted here as a real
    # production gap, not silently ignored.
    ip_address = request.client.host if request.client else "unknown"
    tokens = auth_service.authenticate_and_issue_tokens(
        db, payload.email, payload.password, ip_address, redis_client
    )
    return tokens


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    tokens = auth_service.refresh_access_token(db, payload.refresh_token)
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: RefreshRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    # Requires a valid access token (via get_current_user) AND the refresh
    # token to revoke - you can't log someone else out just by knowing
    # their refresh token, since you'd also need a valid access token.
    auth_service.revoke_refresh_token(db, payload.refresh_token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
