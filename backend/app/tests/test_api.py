from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import app.api.matches as matches_api
from app.auth.deps import get_current_user
from app.domain.user import User
from app.main import app

client = TestClient(app)

TEST_USER = User(id=7, email="tester@example.com")

@pytest.fixture
def signed_in():
    """
    Stands in for a valid token so these stay endpoint tests.

    Overriding the dependency keeps JWTs and the users table out of it; the
    token check itself is covered in test_auth.py.
    """
    app.dependency_overrides[get_current_user] = lambda: TEST_USER
    yield TEST_USER
    app.dependency_overrides.pop(get_current_user, None)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}

def test_rank_endpoint_enqueues(monkeypatch, signed_in):
    seen = {}

    def fake_enqueue(func, *args, **kwargs):
        seen["func"] = func
        seen["args"] = args
        return SimpleNamespace(id="job-123")

    # CV exists → endpoint proceeds to enqueue (no real DB)
    monkeypatch.setattr(matches_api, "get_latest_cv", lambda user_id: {"id": 1})
    monkeypatch.setattr(matches_api.task_queue, "enqueue", fake_enqueue)
    r = client.post("/matches/rank?top_k=5")
    assert r.status_code == 200
    assert r.json() == {"job_id": "job-123", "status": "queued"}
    # ranking is enqueued, not run inline; user_id comes from the token
    assert seen["func"] is matches_api.rank_jobs
    assert seen["args"][0] == TEST_USER.id
    assert seen["args"][1] == 5

def test_rank_endpoint_no_cv(monkeypatch, signed_in):
    # No CV → endpoint returns 400 immediately, without enqueuing
    monkeypatch.setattr(matches_api, "get_latest_cv", lambda user_id: None)
    r = client.post("/matches/rank?top_k=5")
    assert r.status_code == 400

def test_rank_endpoint_requires_a_signed_in_user():
    assert client.post("/matches/rank?top_k=5").status_code in (401, 403)
