"""
Auth endpoint tests.

Why SQLite in-memory for tests instead of hitting the real Postgres
container: tests should run fast and in isolation, without needing Docker
running. We override the get_db dependency to point at a throwaway
in-memory database that's created fresh and destroyed after each test run.
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

# StaticPool: without it, each new connection to "sqlite:///:memory:" gets
# its OWN separate in-memory database - so tables created by one connection
# are invisible to the next, causing "no such table" errors. StaticPool
# forces every connection to share one underlying SQLite connection.
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


client = TestClient(app)

TEST_USER = {"email": "student@example.com", "password": "SecurePass123", "full_name": "Test Student"}


def test_register_creates_user():
    response = client.post("/api/v1/auth/register", json=TEST_USER)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == TEST_USER["email"]
    assert "hashed_password" not in data  # proves the response schema excludes it


def test_register_duplicate_email_fails():
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post("/api/v1/auth/register", json=TEST_USER)
    assert response.status_code == 409


def test_login_with_correct_credentials():
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_with_wrong_password_fails():
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_me_requires_valid_token():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401  # no Authorization header at all


def test_me_returns_user_with_valid_token():
    client.post("/api/v1/auth/register", json=TEST_USER)
    login_response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    access_token = login_response.json()["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json()["email"] == TEST_USER["email"]


def test_refresh_token_issues_new_access_token():
    client.post("/api/v1/auth/register", json=TEST_USER)
    login_response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    refresh_token = login_response.json()["refresh_token"]

    response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_logout_revokes_refresh_token():
    client.post("/api/v1/auth/register", json=TEST_USER)
    login_response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    tokens = login_response.json()

    client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": tokens["refresh_token"]},
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )

    # The revoked refresh token should no longer work
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert response.status_code == 401
