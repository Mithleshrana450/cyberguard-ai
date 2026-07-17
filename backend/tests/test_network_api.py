from unittest.mock import patch

from tests.test_auth import TEST_USER
from tests.test_siem import _get_admin_token


def _get_viewer_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    return response.json()["access_token"]


def test_scan_requires_auth(client):
    response = client.post("/api/v1/network/scan", json={"target_range": "192.168.1.0/28"})
    assert response.status_code == 401


def test_scan_rejects_viewer_role(client):
    token = _get_viewer_token(client)
    response = client.post(
        "/api/v1/network/scan",
        json={"target_range": "192.168.1.0/28"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_scan_rejects_public_ip_even_for_admin(client):
    admin_token = _get_admin_token(client)
    response = client.post(
        "/api/v1/network/scan",
        json={"target_range": "8.8.8.8/32"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 403
    assert "private" in response.json()["detail"].lower()


def test_scan_rejects_oversized_range(client):
    admin_token = _get_admin_token(client)
    response = client.post(
        "/api/v1/network/scan",
        json={"target_range": "192.168.1.0/20"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 403
    assert "too large" in response.json()["detail"].lower()


@patch("app.services.network_service.scan_network")
def test_scan_authorized_range_succeeds(mock_scan, client):
    from app.services.network_scanner import HostResult

    mock_scan.return_value = [
        HostResult(ip_address="192.168.1.1", is_up=True, open_ports=[80, 443], hostname="router.local"),
        HostResult(ip_address="192.168.1.2", is_up=False, open_ports=[], hostname=None),
    ]

    admin_token = _get_admin_token(client)
    response = client.post(
        "/api/v1/network/scan",
        json={"target_range": "192.168.1.0/30"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "completed"
    assert data["hosts_up"] == 1
    assert len(data["hosts"]) == 2


@patch("app.services.network_service.scan_network")
def test_scan_handles_scanner_exception_gracefully(mock_scan, client):
    mock_scan.side_effect = RuntimeError("simulated network failure")

    admin_token = _get_admin_token(client)
    response = client.post(
        "/api/v1/network/scan",
        json={"target_range": "192.168.1.0/30"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "failed"
    assert "simulated network failure" in data["error_message"]


def test_list_scans_rejects_viewer(client):
    token = _get_viewer_token(client)
    response = client.get("/api/v1/network/scans", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_list_scans_allows_admin(client):
    admin_token = _get_admin_token(client)
    response = client.get("/api/v1/network/scans", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json() == []
