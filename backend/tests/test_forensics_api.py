import io
from unittest.mock import patch

from tests.test_auth import TEST_USER


def _get_access_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    return response.json()["access_token"]


def test_analyze_requires_auth(client):
    response = client.post(
        "/api/v1/forensics/analyze", files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
    )
    assert response.status_code == 401


@patch("app.services.forensics_service._check_threat_intel")
def test_analyze_returns_hashes_for_uploaded_file(mock_threat_check, client):
    mock_threat_check.return_value = None  # simulate threat-intel not configured
    token = _get_access_token(client)

    response = client.post(
        "/api/v1/forensics/analyze",
        files={"file": ("notes.txt", io.BytesIO(b"evidence file contents"), "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "notes.txt"
    assert len(data["sha256_hash"]) == 64
    assert data["mime_type"] == "text/plain"
    assert data["threat_verdict"] is None


@patch("app.services.forensics_service._check_threat_intel")
def test_analyze_rejects_empty_file(mock_threat_check, client):
    mock_threat_check.return_value = None
    token = _get_access_token(client)

    response = client.post(
        "/api/v1/forensics/analyze",
        files={"file": ("empty.txt", io.BytesIO(b""), "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 422


@patch("app.services.forensics_service._check_threat_intel")
def test_analyze_includes_threat_verdict_when_available(mock_threat_check, client):
    from app.models.threat_intel import Verdict

    mock_threat_check.return_value = Verdict.MALICIOUS
    token = _get_access_token(client)

    response = client.post(
        "/api/v1/forensics/analyze",
        files={"file": ("suspicious.exe", io.BytesIO(b"fake malware bytes"), "application/octet-stream")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    assert response.json()["threat_verdict"] == "malicious"


@patch("app.services.forensics_service._check_threat_intel")
def test_verify_integrity_matches_identical_file(mock_threat_check, client):
    mock_threat_check.return_value = None
    token = _get_access_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    original = client.post(
        "/api/v1/forensics/analyze",
        files={"file": ("evidence.txt", io.BytesIO(b"original evidence content"), "text/plain")},
        headers=headers,
    ).json()

    verify_response = client.post(
        f"/api/v1/forensics/analyses/{original['id']}/verify",
        files={"file": ("evidence.txt", io.BytesIO(b"original evidence content"), "text/plain")},
        headers=headers,
    )

    assert verify_response.status_code == 200
    assert verify_response.json()["is_match"] is True


@patch("app.services.forensics_service._check_threat_intel")
def test_verify_integrity_detects_tampering(mock_threat_check, client):
    mock_threat_check.return_value = None
    token = _get_access_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    original = client.post(
        "/api/v1/forensics/analyze",
        files={"file": ("evidence.txt", io.BytesIO(b"original evidence content"), "text/plain")},
        headers=headers,
    ).json()

    verify_response = client.post(
        f"/api/v1/forensics/analyses/{original['id']}/verify",
        files={"file": ("evidence.txt", io.BytesIO(b"TAMPERED evidence content"), "text/plain")},
        headers=headers,
    )

    assert verify_response.status_code == 200
    assert verify_response.json()["is_match"] is False


def test_verify_integrity_404_for_nonexistent_record(client):
    token = _get_access_token(client)
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.post(
        f"/api/v1/forensics/analyses/{fake_id}/verify",
        files={"file": ("x.txt", io.BytesIO(b"data"), "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_list_analyses_returns_users_own_records(client):
    token = _get_access_token(client)
    response = client.get("/api/v1/forensics/analyses", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == []
