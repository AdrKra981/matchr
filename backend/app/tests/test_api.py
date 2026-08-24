from fastapi.testclient import TestClient
from app.main import app
import app.api.matches as matches_api

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}

def test_rank_endpoint_happy(monkeypatch):
    monkeypatch.setattr(
        matches_api, "rank_jobs",
        lambda top_k=10, what=None, city=None, min_salary=None: {"cv_id": 1, "matches": []},
    )
    r = client.post("/matches/rank?top_k=5")
    assert r.status_code == 200
    assert r.json()["cv_id"] == 1

def test_rank_endpoint_no_cv(monkeypatch):
    monkeypatch.setattr(
        matches_api, "rank_jobs",
        lambda top_k=10, what=None, city=None, min_salary=None: {"cv_id": None, "matches": []},
    )
    r = client.post("/matches/rank?top_k=5")
    assert r.status_code == 200
    assert r.json()["cv_id"] is None
    assert r.json()["matches"] == []