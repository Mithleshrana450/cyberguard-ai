from unittest.mock import MagicMock, patch

from tests.test_auth import TEST_USER


def _get_access_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    return response.json()["access_token"]


def _mock_vt_response(status_code=200, stats=None):
    mock = MagicMock()
    mock.status_code = status_code
    if stats is not None:
        mock.json.return_value = {"data": {"attributes": {"last_analysis_stats": stats}}}
    return mock


def test_lookup_requires_auth(client):
    response = client.post("/api/v1/threat-intel/lookup", json={"lookup_type": "ip", "value": "1.2.3.4"})
    assert response.status_code == 401


@patch("app.services.threat_intel_service.settings")
def test_lookup_returns_503_when_api_key_not_configured(mock_settings, client):
    mock_settings.VIRUSTOTAL_API_KEY = ""
    token = _get_access_token(client)
    response = client.post(
        "/api/v1/threat-intel/lookup",
        json={"lookup_type": "ip", "value": "1.2.3.4"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 503


@patch("app.services.threat_intel_service.settings")
@patch("app.services.threat_intel_service.requests.get")
def test_lookup_returns_malicious_verdict(mock_get, mock_settings, client):
    mock_settings.VIRUSTOTAL_API_KEY = "fake-key-for-testing"
    mock_get.return_value = _mock_vt_response(
        stats={"malicious": 5, "suspicious": 0, "harmless": 60, "undetected": 5, "timeout": 0}
    )

    token = _get_access_token(client)
    response = client.post(
        "/api/v1/threat-intel/lookup",
        json={"lookup_type": "ip", "value": "1.2.3.4"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["verdict"] == "malicious"
    assert data["malicious_count"] == 5


@patch("app.services.threat_intel_service.settings")
@patch("app.services.threat_intel_service.requests.get")
def test_lookup_returns_unknown_on_404(mock_get, mock_settings, client):
    mock_settings.VIRUSTOTAL_API_KEY = "fake-key-for-testing"
    mock_get.return_value = _mock_vt_response(status_code=404)

    token = _get_access_token(client)
    response = client.post(
        "/api/v1/threat-intel/lookup",
        json={"lookup_type": "domain", "value": "never-seen-before-xyz.com"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    assert response.json()["verdict"] == "unknown"


@patch("app.services.threat_intel_service.settings")
@patch("app.services.threat_intel_service.requests.get")
def test_second_identical_lookup_uses_cache_not_second_api_call(mock_get, mock_settings, client):
    mock_settings.VIRUSTOTAL_API_KEY = "fake-key-for-testing"
    mock_get.return_value = _mock_vt_response(
        stats={"malicious": 1, "suspicious": 0, "harmless": 60, "undetected": 9, "timeout": 0}
    )

    token = _get_access_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    client.post("/api/v1/threat-intel/lookup", json={"lookup_type": "ip", "value": "8.8.8.8"}, headers=headers)
    client.post("/api/v1/threat-intel/lookup", json={"lookup_type": "ip", "value": "8.8.8.8"}, headers=headers)

    # Two lookups of the SAME value should only hit the external API once -
    # the second is served from the Redis cache, proving the caching logic
    # (not just that both calls "worked").
    assert mock_get.call_count == 1


def test_lookup_history_returns_users_own_lookups(client):
    token = _get_access_token(client)
    response = client.get(
        "/api/v1/threat-intel/history", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json() == []
