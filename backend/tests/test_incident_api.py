from tests.test_auth import TEST_USER
from tests.test_siem import _get_admin_token


def _get_viewer_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    return response.json()["access_token"]


def _create_incident(client, token, **overrides):
    payload = {
        "title": "Suspicious login pattern",
        "description": "Multiple failed logins from one IP.",
        "severity": "high",
        **overrides,
    }
    response = client.post(
        "/api/v1/incidents", json=payload, headers={"Authorization": f"Bearer {token}"}
    )
    return response


def test_create_requires_auth(client):
    response = client.post(
        "/api/v1/incidents", json={"title": "x", "description": "y", "severity": "low"}
    )
    assert response.status_code == 401


def test_viewer_can_create_incident(client):
    token = _get_viewer_token(client)
    response = _create_incident(client, token)
    assert response.status_code == 201
    assert response.json()["status"] == "open"


def test_viewer_can_list_and_view_incidents(client):
    token = _get_viewer_token(client)
    _create_incident(client, token)

    list_response = client.get("/api/v1/incidents", headers={"Authorization": f"Bearer {token}"})
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_viewer_can_add_notes(client):
    token = _get_viewer_token(client)
    incident = _create_incident(client, token).json()

    response = client.post(
        f"/api/v1/incidents/{incident['id']}/notes",
        json={"content": "Investigating this now."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201


def test_viewer_cannot_change_status(client):
    token = _get_viewer_token(client)
    incident = _create_incident(client, token).json()

    response = client.patch(
        f"/api/v1/incidents/{incident['id']}",
        json={"status": "investigating"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_admin_can_change_status_through_valid_workflow(client):
    admin_token = _get_admin_token(client)
    incident = _create_incident(client, admin_token).json()
    headers = {"Authorization": f"Bearer {admin_token}"}

    r1 = client.patch(f"/api/v1/incidents/{incident['id']}", json={"status": "investigating"}, headers=headers)
    assert r1.status_code == 200
    assert r1.json()["status"] == "investigating"

    r2 = client.patch(f"/api/v1/incidents/{incident['id']}", json={"status": "resolved"}, headers=headers)
    assert r2.status_code == 200

    r3 = client.patch(f"/api/v1/incidents/{incident['id']}", json={"status": "closed"}, headers=headers)
    assert r3.status_code == 200
    assert r3.json()["closed_at"] is not None


def test_admin_cannot_skip_from_open_to_closed(client):
    admin_token = _get_admin_token(client)
    incident = _create_incident(client, admin_token).json()

    response = client.patch(
        f"/api/v1/incidents/{incident['id']}",
        json={"status": "closed"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400


def test_reopening_closed_incident_clears_closed_at(client):
    admin_token = _get_admin_token(client)
    incident = _create_incident(client, admin_token).json()
    headers = {"Authorization": f"Bearer {admin_token}"}

    client.patch(f"/api/v1/incidents/{incident['id']}", json={"status": "resolved"}, headers=headers)
    client.patch(f"/api/v1/incidents/{incident['id']}", json={"status": "closed"}, headers=headers)
    reopened = client.patch(f"/api/v1/incidents/{incident['id']}", json={"status": "open"}, headers=headers)

    assert reopened.status_code == 200
    assert reopened.json()["closed_at"] is None


def test_get_nonexistent_incident_returns_404(client):
    token = _get_viewer_token(client)
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/v1/incidents/{fake_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404


def test_status_filter_on_list(client):
    admin_token = _get_admin_token(client)
    _create_incident(client, admin_token, title="First")
    incident2 = _create_incident(client, admin_token, title="Second").json()
    client.patch(
        f"/api/v1/incidents/{incident2['id']}",
        json={"status": "investigating"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    response = client.get(
        "/api/v1/incidents?status_filter=investigating",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Second"
