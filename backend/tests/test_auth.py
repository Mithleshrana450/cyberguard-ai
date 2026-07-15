"""
Auth endpoint tests.

Test database setup (engine, session override, table creation) now lives
in conftest.py, shared across all test files - see conftest.py's
docstring for why that fix was necessary.
"""

TEST_USER = {"email": "student@example.com", "password": "SecurePass123", "full_name": "Test Student"}


def test_register_creates_user(client):
    response = client.post("/api/v1/auth/register", json=TEST_USER)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == TEST_USER["email"]
    assert "hashed_password" not in data  # proves the response schema excludes it


def test_register_duplicate_email_fails(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post("/api/v1/auth/register", json=TEST_USER)
    assert response.status_code == 409


def test_login_with_correct_credentials(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_with_wrong_password_fails(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_me_requires_valid_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401  # no Authorization header at all


def test_me_returns_user_with_valid_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    login_response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    access_token = login_response.json()["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json()["email"] == TEST_USER["email"]


def test_refresh_token_issues_new_access_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    login_response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    refresh_token = login_response.json()["refresh_token"]

    response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_logout_revokes_refresh_token(client):
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
