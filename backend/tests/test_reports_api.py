from tests.test_auth import TEST_USER


def _get_access_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    return response.json()["access_token"]


def test_summary_requires_auth(client):
    response = client.get("/api/v1/reports/summary")
    assert response.status_code == 401


def test_summary_returns_expected_shape_for_new_user(client):
    token = _get_access_token(client)
    response = client.get("/api/v1/reports/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["total_scans"] == 0
    assert data["average_security_score"] is None
    assert data["recent_scans"] == []


def test_csv_export_requires_auth(client):
    response = client.get("/api/v1/reports/csv/scans")
    assert response.status_code == 401


def test_csv_export_rejects_unknown_report_type(client):
    token = _get_access_token(client)
    response = client.get(
        "/api/v1/reports/csv/not-a-real-type", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404


def test_csv_export_returns_csv_content_type(client):
    token = _get_access_token(client)
    response = client.get("/api/v1/reports/csv/scans", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]


def test_csv_export_works_for_every_report_type(client):
    token = _get_access_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    for report_type in ["scans", "alerts", "threat-intel", "phishing", "network", "incidents"]:
        response = client.get(f"/api/v1/reports/csv/{report_type}", headers=headers)
        assert response.status_code == 200, f"failed for report_type={report_type}"


def test_pdf_export_requires_auth(client):
    response = client.get("/api/v1/reports/pdf")
    assert response.status_code == 401


def test_pdf_export_returns_valid_pdf(client):
    token = _get_access_token(client)
    response = client.get("/api/v1/reports/pdf", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content[:5] == b"%PDF-"
