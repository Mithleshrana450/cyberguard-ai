from unittest.mock import MagicMock, patch

from tests.test_auth import TEST_USER
from tests.test_siem import _get_admin_token


def _get_viewer_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    return response.json()["access_token"]


def test_analytics_requires_auth(client):
    response = client.get("/api/v1/analytics/summary")
    assert response.status_code == 401


def test_analytics_rejects_viewer_role(client):
    token = _get_viewer_token(client)
    response = client.get("/api/v1/analytics/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_analytics_allows_admin(client):
    admin_token = _get_admin_token(client)
    response = client.get("/api/v1/analytics/summary", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200


def test_analytics_returns_expected_shape_with_no_data(client):
    admin_token = _get_admin_token(client)
    response = client.get("/api/v1/analytics/summary", headers={"Authorization": f"Bearer {admin_token}"})
    data = response.json()
    assert "alert_trend" in data
    assert "executive_summary" in data
    assert data["executive_summary"]["total_scans"] == 0
    assert data["executive_summary"]["average_security_score"] is None


def test_days_parameter_is_clamped_to_sane_bounds(client):
    admin_token = _get_admin_token(client)
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.get("/api/v1/analytics/summary?days=9999", headers=headers)
    assert response.status_code == 200
    assert len(response.json()["alert_trend"]) == 90


@patch("app.services.scanner_service.requests.get")
@patch("app.services.scanner_service.check_tls_certificate")
def test_analytics_reflects_real_scan_data_end_to_end(mock_tls, mock_get, client):
    mock_tls.return_value = []
    good_headers = {
        "Strict-Transport-Security": "max-age=31536000",
        "Content-Security-Policy": "default-src 'self'",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=()",
    }
    mock_response = MagicMock()
    mock_response.headers = good_headers
    mock_response.status_code = 200
    mock_response.text = ""
    mock_get.return_value = mock_response

    admin_token = _get_admin_token(client)
    headers = {"Authorization": f"Bearer {admin_token}"}

    client.post("/api/v1/scanner/scans", json={"target_url": "https://example.com"}, headers=headers)

    response = client.get("/api/v1/analytics/summary", headers=headers)
    data = response.json()

    assert data["executive_summary"]["total_scans"] == 1
    assert data["executive_summary"]["average_security_score"] == 100
    assert data["scan_score_distribution"]["good_71_100"] == 1
