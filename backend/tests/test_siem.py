"""
SIEM tests.

test_siem_service tests use the SAME FakeRedis class defined in
conftest.py (via the client fixture's app-level override) by importing it
directly, so the brute-force COUNTING LOGIC itself gets tested in
isolation from the API layer - same "test the logic directly" principle
as Module 3's scan_analysis tests.
"""

from app.services import siem_service
from tests.conftest import FakeRedis
from tests.test_auth import TEST_USER


def _get_tokens(client, email=None):
    email = email or TEST_USER["email"]
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": TEST_USER["password"], "full_name": TEST_USER["full_name"]},
    )
    response = client.post("/api/v1/auth/login", json={"email": email, "password": TEST_USER["password"]})
    return response.json()


def _get_admin_token(client, db_session_factory=None):
    """Registers a user then promotes them to admin directly via DB, since
    there's no public 'become admin' endpoint (by design - see RBAC notes)."""
    from tests.conftest import TestingSessionLocal
    from app.models.user import User, UserRole

    admin_email = "admin@example.com"
    client.post(
        "/api/v1/auth/register",
        json={"email": admin_email, "password": "AdminPass123", "full_name": "Admin User"},
    )
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == admin_email).first()
    user.role = UserRole.ADMIN
    db.commit()
    db.close()

    response = client.post("/api/v1/auth/login", json={"email": admin_email, "password": "AdminPass123"})
    return response.json()["access_token"]


# --- Pure brute-force counting logic (no HTTP layer involved) ---


def test_record_login_attempt_logs_event(client):
    from tests.conftest import TestingSessionLocal
    from app.models.security_event import LoginEvent

    db = TestingSessionLocal()
    fake_redis = FakeRedis()

    siem_service.record_login_attempt(db, fake_redis, "attacker@example.com", "1.2.3.4", success=False)

    events = db.query(LoginEvent).all()
    assert len(events) == 1
    assert events[0].success is False
    assert events[0].ip_address == "1.2.3.4"
    db.close()


def test_brute_force_alert_fires_at_threshold(client):
    from tests.conftest import TestingSessionLocal
    from app.models.security_event import SecurityAlert

    db = TestingSessionLocal()
    fake_redis = FakeRedis()

    alert = None
    for _ in range(siem_service.FAILED_LOGIN_THRESHOLD):
        alert = siem_service.record_login_attempt(
            db, fake_redis, "attacker@example.com", "9.9.9.9", success=False
        )

    assert alert is not None
    assert alert.source_ip == "9.9.9.9"
    assert db.query(SecurityAlert).count() == 1
    db.close()


def test_brute_force_alert_does_not_fire_below_threshold(client):
    from tests.conftest import TestingSessionLocal

    db = TestingSessionLocal()
    fake_redis = FakeRedis()

    alert = None
    for _ in range(siem_service.FAILED_LOGIN_THRESHOLD - 1):
        alert = siem_service.record_login_attempt(
            db, fake_redis, "attacker@example.com", "9.9.9.9", success=False
        )

    assert alert is None
    db.close()


def test_brute_force_alert_does_not_duplicate_past_threshold(client):
    from tests.conftest import TestingSessionLocal
    from app.models.security_event import SecurityAlert

    db = TestingSessionLocal()
    fake_redis = FakeRedis()

    for _ in range(siem_service.FAILED_LOGIN_THRESHOLD + 3):
        siem_service.record_login_attempt(db, fake_redis, "attacker@example.com", "9.9.9.9", success=False)

    # Only ONE alert should exist even though failures kept happening past
    # the threshold - this is the dedup behavior described in the
    # service's docstring.
    assert db.query(SecurityAlert).count() == 1
    db.close()


def test_successful_login_clears_failed_counter(client):
    fake_redis = FakeRedis()
    from tests.conftest import TestingSessionLocal

    db = TestingSessionLocal()
    siem_service.record_login_attempt(db, fake_redis, "user@example.com", "5.5.5.5", success=False)
    siem_service.record_login_attempt(db, fake_redis, "user@example.com", "5.5.5.5", success=False)
    siem_service.record_login_attempt(db, fake_redis, "user@example.com", "5.5.5.5", success=True)

    assert fake_redis._store.get("failed_login_ip:5.5.5.5", 0) == 0
    db.close()


# --- API-level tests ---


def test_siem_endpoints_require_auth(client):
    assert client.get("/api/v1/siem/alerts").status_code == 401
    assert client.get("/api/v1/siem/events").status_code == 401


def test_siem_endpoints_reject_viewer_role(client):
    tokens = _get_tokens(client)
    response = client.get(
        "/api/v1/siem/alerts", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert response.status_code == 403


def test_siem_endpoints_allow_admin_role(client):
    admin_token = _get_admin_token(client)
    response = client.get("/api/v1/siem/alerts", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json() == []


def test_repeated_failed_logins_via_api_creates_alert(client):
    admin_token = _get_admin_token(client)

    for _ in range(siem_service.FAILED_LOGIN_THRESHOLD):
        client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@example.com", "password": "wrong-password"},
        )

    response = client.get("/api/v1/siem/alerts", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) == 1
    assert alerts[0]["alert_type"] == "brute_force_login"
