"""
Shared test fixtures.

Why this file exists (and why it fixes the "no such table" bug):
pytest only auto-discovers `autouse` fixtures within the SAME file, or in
a conftest.py that applies to the whole test directory. Previously, the
setup_db fixture lived inside test_auth.py, so it only ran for tests in
that file - any other test file (like test_dashboard.py) that imported
`client` from test_auth.py got a client pointed at a database with no
tables created, causing "no such table: users" errors.

Moving the test engine, session override, and setup_db fixture here makes
them apply automatically to every test file in tests/, regardless of
which file the test lives in.
"""

import time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models as _models  # noqa: F401 - registers User/RefreshToken on Base.metadata
from app.core.redis_client import get_redis
from app.db.base import Base
from app.db.session import get_db
from app.main import app

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class FakeRedis:
    """
    Minimal in-memory stand-in for redis-py's client, implementing just the
    operations this project actually uses: incr/expire/delete (Module 4's
    brute-force counter) and get/setex (Module 5's lookup cache). Good
    enough for tests without needing a real Redis server, and without
    adding a heavier third-party fake-redis dependency to the project.

    Real redis-py, with decode_responses=True, stores everything as
    strings internally (even integers get returned as string digits) - we
    mirror that here with a single dict so callers can't accidentally rely
    on Python type distinctions real Redis wouldn't give them either.
    """

    def __init__(self):
        self._store: dict[str, str] = {}
        self._expiry: dict[str, float] = {}

    def _check_expired(self, key: str):
        if key in self._expiry and time.time() > self._expiry[key]:
            self._store.pop(key, None)
            self._expiry.pop(key, None)

    def incr(self, key: str) -> int:
        self._check_expired(key)
        current = int(self._store.get(key, 0))
        self._store[key] = str(current + 1)
        return current + 1

    def expire(self, key: str, seconds: int) -> None:
        self._expiry[key] = time.time() + seconds

    def delete(self, key: str) -> None:
        self._store.pop(key, None)
        self._expiry.pop(key, None)

    def get(self, key: str):
        self._check_expired(key)
        return self._store.get(key)

    def setex(self, key: str, seconds: int, value: str) -> None:
        self._store[key] = value
        self._expiry[key] = time.time() + seconds


fake_redis = FakeRedis()


def override_get_redis():
    return fake_redis


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_redis] = override_get_redis


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    fake_redis._store.clear()
    fake_redis._expiry.clear()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)
