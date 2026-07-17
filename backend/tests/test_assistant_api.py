from unittest.mock import patch

from tests.test_auth import TEST_USER


def _get_access_token(client):
    client.post("/api/v1/auth/register", json=TEST_USER)
    response = client.post(
        "/api/v1/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    return response.json()["access_token"]


def test_chat_requires_auth(client):
    response = client.post("/api/v1/assistant/chat", json={"message": "hello"})
    assert response.status_code == 401


@patch("app.services.assistant_service.generate_assistant_reply")
def test_chat_returns_user_and_assistant_messages(mock_reply, client):
    mock_reply.return_value = "Here's an explanation of that vulnerability."
    token = _get_access_token(client)

    response = client.post(
        "/api/v1/assistant/chat",
        json={"message": "What is a SQL injection?"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["user_message"]["role"] == "user"
    assert data["user_message"]["content"] == "What is a SQL injection?"
    assert data["assistant_message"]["role"] == "assistant"
    assert "vulnerability" in data["assistant_message"]["content"]


@patch("app.services.assistant_service.generate_assistant_reply")
def test_chat_persists_to_history(mock_reply, client):
    mock_reply.return_value = "Response."
    token = _get_access_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    client.post("/api/v1/assistant/chat", json={"message": "First message"}, headers=headers)
    client.post("/api/v1/assistant/chat", json={"message": "Second message"}, headers=headers)

    history_response = client.get("/api/v1/assistant/history", headers=headers)
    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history) == 4
    assert history[0]["content"] == "First message"


@patch("app.services.assistant_service.generate_assistant_reply")
def test_chat_propagates_service_unavailable_error(mock_reply, client):
    from fastapi import HTTPException

    mock_reply.side_effect = HTTPException(503, "The AI assistant is not configured.")
    token = _get_access_token(client)

    response = client.post(
        "/api/v1/assistant/chat",
        json={"message": "hello"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 503


@patch("app.services.assistant_service.generate_assistant_reply")
def test_clear_history_removes_messages(mock_reply, client):
    mock_reply.return_value = "Response."
    token = _get_access_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    client.post("/api/v1/assistant/chat", json={"message": "Hello"}, headers=headers)

    delete_response = client.delete("/api/v1/assistant/history", headers=headers)
    assert delete_response.status_code == 204

    history_response = client.get("/api/v1/assistant/history", headers=headers)
    assert history_response.json() == []


def test_history_empty_for_new_user(client):
    token = _get_access_token(client)
    response = client.get("/api/v1/assistant/history", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == []


@patch("app.services.assistant_service.generate_assistant_reply")
def test_chat_passes_context_summary_to_ai_call(mock_reply, client):
    """Proves the context-gathering function's output actually reaches the
    AI call, not just that both exist independently."""
    mock_reply.return_value = "Response."
    token = _get_access_token(client)

    client.post(
        "/api/v1/assistant/chat",
        json={"message": "What's my risk?"},
        headers={"Authorization": f"Bearer {token}"},
    )

    call_args = mock_reply.call_args
    context_summary_arg = call_args[0][0]
    assert "security context" in context_summary_arg.lower()
