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

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models as _models  # noqa: F401 - registers User/RefreshToken on Base.metadata
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


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)
