"""
Database session management.

Why this pattern:
FastAPI is request-based - each HTTP request should get its own database
session, use it, then close it. Sharing one global session across requests
causes hard-to-debug bugs (data leaking between unrelated requests, stale
transactions). `get_db()` is a generator used as a FastAPI dependency: it
yields a fresh session per request and guarantees cleanup via `finally`,
even if the request raises an exception.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# pool_pre_ping=True: checks that a pooled connection is still alive before
# handing it out. Without this, connections that time out on the DB side
# (common with cloud Postgres) cause silent failures.

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
