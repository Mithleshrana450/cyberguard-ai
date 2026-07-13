"""
Test for the /health endpoint.

Why we start testing from module 0:
Building the habit of writing a test alongside every endpoint - even a
trivial one - means testing becomes normal, not an afterthought bolted on
at the end. This also proves the test infrastructure itself (pytest +
TestClient) works before we build anything more complex.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_root():
    response = client.get("/")
    assert response.status_code == 200
