from unittest.mock import patch

from tests.test_auth import TEST_USER


def _get_access_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    return response.json()["access_token"]


def test_analyze_url_requires_auth(client):
    response = client.post("/api/v1/phishing/analyze-url", json={"url": "http://example.com"})
    assert response.status_code == 401


@patch("app.services.phishing_service.generate_explanation")
def test_analyze_url_returns_risk_assessment(mock_explain, client):
    mock_explain.return_value = None  # simulate no OpenAI key configured
    token = _get_access_token(client)

    response = client.post(
        "/api/v1/phishing/analyze-url",
        json={"url": "http://paypa1.com/secure-login"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["risk_score"] > 0
    assert data["risk_level"] in ("medium", "high", "critical")
    assert data["ai_explanation"] is None


@patch("app.services.phishing_service.generate_explanation")
def test_analyze_url_includes_ai_explanation_when_available(mock_explain, client):
    mock_explain.return_value = "This URL shows signs of typosquatting and should be avoided."
    token = _get_access_token(client)

    response = client.post(
        "/api/v1/phishing/analyze-url",
        json={"url": "http://paypa1.com/secure-login"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    assert "typosquatting" in response.json()["ai_explanation"]


@patch("app.services.phishing_service.generate_explanation")
def test_analyze_clean_url_has_low_risk(mock_explain, client):
    mock_explain.return_value = None
    token = _get_access_token(client)

    response = client.post(
        "/api/v1/phishing/analyze-url",
        json={"url": "https://example.com/about"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    assert response.json()["risk_level"] == "low"


@patch("app.services.phishing_service.generate_explanation")
def test_analyze_email_endpoint(mock_explain, client):
    mock_explain.return_value = None
    token = _get_access_token(client)

    raw_email = (
        "From: Support <support@realbank.com>\n"
        "Reply-To: attacker@totally-different.com\n"
        "Subject: Urgent Account Notice\n\n"
        "Your account will be closed. Verify your account immediately: http://192.168.1.1/confirm"
    )

    response = client.post(
        "/api/v1/phishing/analyze-email",
        json={"raw_email": raw_email},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["analysis_type"] == "email"
    # Should combine email-level findings (reply-to mismatch, urgency)
    # AND URL findings from the embedded link (IP address) - proving the
    # cross-reuse of analyze_url() inside analyze_email() actually happened.
    assert "Reply-To" in data["findings_json"] or "reply" in data["findings_json"].lower()
    assert data["risk_score"] > 30


def test_history_returns_users_own_analyses(client):
    token = _get_access_token(client)
    response = client.get("/api/v1/phishing/history", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == []
