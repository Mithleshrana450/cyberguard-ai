from tests.test_auth import TEST_USER
from tests.test_siem import _get_admin_token


def _get_viewer_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    return response.json()["access_token"]


def _get_admin_id(client, admin_token):
    users = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
    return next(u["id"] for u in users if u["email"] == "admin@example.com")


def test_admin_endpoints_reject_viewer(client):
    token = _get_viewer_token(client)
    response = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_admin_endpoints_allow_admin(client):
    admin_token = _get_admin_token(client)
    response = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_admin_cannot_demote_own_role(client):
    admin_token = _get_admin_token(client)
    admin_id = _get_admin_id(client, admin_token)

    response = client.patch(
        f"/api/v1/admin/users/{admin_id}",
        json={"role": "viewer"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400


def test_admin_cannot_deactivate_own_account(client):
    admin_token = _get_admin_token(client)
    admin_id = _get_admin_id(client, admin_token)

    response = client.patch(
        f"/api/v1/admin/users/{admin_id}",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400


def test_admin_can_change_another_users_role(client):
    admin_token = _get_admin_token(client)
    _get_viewer_token(client)
    users = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
    other_user_id = next(u["id"] for u in users if u["email"] == TEST_USER["email"])

    response = client.patch(
        f"/api/v1/admin/users/{other_user_id}",
        json={"role": "analyst"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "analyst"


def test_admin_can_deactivate_another_users_account(client):
    admin_token = _get_admin_token(client)
    _get_viewer_token(client)
    users = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
    other_user_id = next(u["id"] for u in users if u["email"] == TEST_USER["email"])

    response = client.patch(
        f"/api/v1/admin/users/{other_user_id}",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_user_update_creates_audit_log_entry(client):
    admin_token = _get_admin_token(client)
    _get_viewer_token(client)
    headers = {"Authorization": f"Bearer {admin_token}"}
    users = client.get("/api/v1/admin/users", headers=headers).json()
    other_user_id = next(u["id"] for u in users if u["email"] == TEST_USER["email"])

    client.patch(f"/api/v1/admin/users/{other_user_id}", json={"role": "analyst"}, headers=headers)

    logs = client.get("/api/v1/admin/audit-logs", headers=headers).json()
    assert len(logs) == 1
    assert logs[0]["action"] == "user.updated"
    assert "viewer -> analyst" in logs[0]["details"]


def test_no_op_update_does_not_create_audit_log(client):
    admin_token = _get_admin_token(client)
    admin_id = _get_admin_id(client, admin_token)
    headers = {"Authorization": f"Bearer {admin_token}"}

    client.patch(f"/api/v1/admin/users/{admin_id}", json={"role": "admin"}, headers=headers)

    logs = client.get("/api/v1/admin/audit-logs", headers=headers).json()
    assert logs == []


def test_settings_are_seeded_and_listable(client):
    admin_token = _get_admin_token(client)
    response = client.get("/api/v1/admin/settings", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    keys = [s["key"] for s in response.json()]
    assert "brute_force_threshold" in keys


def test_changing_brute_force_threshold_actually_changes_siem_behavior(client):
    admin_token = _get_admin_token(client)
    headers = {"Authorization": f"Bearer {admin_token}"}

    client.patch("/api/v1/admin/settings/brute_force_threshold", json={"value": "2"}, headers=headers)

    client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "wrong"})
    client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "wrong"})

    alerts = client.get("/api/v1/siem/alerts", headers=headers).json()
    assert len(alerts) == 1


def test_settings_update_creates_audit_log(client):
    admin_token = _get_admin_token(client)
    headers = {"Authorization": f"Bearer {admin_token}"}

    client.patch("/api/v1/admin/settings/brute_force_threshold", json={"value": "10"}, headers=headers)

    logs = client.get("/api/v1/admin/audit-logs", headers=headers).json()
    assert any(log["action"] == "setting.updated" for log in logs)
