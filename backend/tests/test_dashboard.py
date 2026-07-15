from tests.test_auth import TEST_USER


def _get_access_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    return response.json()["access_token"]


def test_dashboard_summary_requires_auth(client):
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 401


def test_dashboard_summary_returns_data_for_authenticated_user(client):
    token = _get_access_token(client)
    response = client.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "security_score" in data
    assert "active_alerts" in data
    assert isinstance(data["recent_activity"], list)
