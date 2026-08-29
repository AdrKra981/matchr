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

def test_rank_endpoint_happy(monkeypatch, signed_in):
    seen = {}

    def fake_rank_jobs(user_id, top_k=10, what=None, city=None, min_salary=None):
        seen.update(user_id=user_id, top_k=top_k)
        return {"cv_id": 1, "matches": []}

    monkeypatch.setattr(matches_api, "rank_jobs", fake_rank_jobs)
    r = client.post("/matches/rank?top_k=5")
    assert r.status_code == 200
    assert r.json()["cv_id"] == 1
    assert seen["user_id"] == TEST_USER.id
    assert seen["top_k"] == 5

def test_rank_endpoint_no_cv(monkeypatch, signed_in):
    monkeypatch.setattr(
        matches_api, "rank_jobs",
        lambda user_id, top_k=10, what=None, city=None, min_salary=None: {"cv_id": None, "matches": []},
    )
    r = client.post("/matches/rank?top_k=5")
    assert r.status_code == 200
    assert r.json()["cv_id"] is None
    assert r.json()["matches"] == []

def test_rank_endpoint_requires_a_signed_in_user():
    assert client.post("/matches/rank?top_k=5").status_code in (401, 403)
