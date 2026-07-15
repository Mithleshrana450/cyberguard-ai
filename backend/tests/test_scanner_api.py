"""
Scanner API tests.

Why the network call is mocked: real unit/integration tests should not
depend on an external website being up and reachable - that makes tests
flaky (fail due to network issues, not code bugs) and slow. We use
unittest.mock to replace `requests.get` with a fake response we control
completely, so the test is fast, deterministic, and runs the same way
whether or not the sandbox/CI machine has real internet access.
"""

from unittest.mock import MagicMock, patch

from tests.test_auth import TEST_USER


def _get_access_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    return response.json()["access_token"]


def _mock_response(headers=None, text="", status_code=200):
    mock = MagicMock()
    mock.headers = headers or {}
    mock.text = text
    mock.status_code = status_code
    return mock


def test_create_scan_requires_auth(client):
    response = client.post("/api/v1/scanner/scans", json={"target_url": "https://example.com"})
    assert response.status_code == 401


def test_create_scan_rejects_invalid_url(client):
    token = _get_access_token(client)
    response = client.post(
        "/api/v1/scanner/scans",
        json={"target_url": "not-a-url"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 422


@patch("app.services.scanner_service.requests.get")
@patch("app.services.scanner_service.check_tls_certificate")
def test_create_scan_returns_findings_for_missing_headers(mock_tls, mock_get, client):
    mock_tls.return_value = []  # skip real TLS handshake in tests
    mock_get.side_effect = [
        _mock_response(headers={}, status_code=200),  # main page fetch - no security headers at all
        _mock_response(text="User-agent: *\nDisallow: /admin\n", status_code=200),  # robots.txt
    ]

    token = _get_access_token(client)
    response = client.post(
        "/api/v1/scanner/scans",
        json={"target_url": "https://example.com"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "completed"
    assert data["security_score"] < 100
    assert len(data["findings"]) > 0


@patch("app.services.scanner_service.requests.get")
@patch("app.services.scanner_service.check_tls_certificate")
def test_create_scan_perfect_score_with_all_headers_present(mock_tls, mock_get, client):
    mock_tls.return_value = []
    good_headers = {
        "Strict-Transport-Security": "max-age=31536000",
        "Content-Security-Policy": "default-src 'self'",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=()",
        "Server": "nginx",
    }
    mock_get.side_effect = [
        _mock_response(headers=good_headers, status_code=200),
        _mock_response(text="", status_code=404),
    ]

    token = _get_access_token(client)
    response = client.post(
        "/api/v1/scanner/scans",
        json={"target_url": "https://example.com"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    assert response.json()["security_score"] == 100


def test_list_scans_returns_users_own_scans_only(client):
    token = _get_access_token(client)
    response = client.get("/api/v1/scanner/scans", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == []


def test_get_nonexistent_scan_returns_404(client):
    token = _get_access_token(client)
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/v1/scanner/scans/{fake_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404
