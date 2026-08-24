import pytest
from types import SimpleNamespace
from fastapi import HTTPException
from app.usecases import rank_jobs as rj

def fake_point(job_id, score):
    return SimpleNamespace(payload={"job_id": job_id}, score=score)

def test_rank_builds_ranked_matches(monkeypatch):
    monkeypatch.setattr(rj, "get_latest_cv", lambda: {"id": 1, "embedding": [0.1] * 1536, "content": "cv"})
    monkeypatch.setattr(rj, "search_jobs", lambda vec, top_k, query_filter: [fake_point(10, 0.9), fake_point(20, 0.8)])
    saved = {}
    monkeypatch.setattr(rj, "save_matches", lambda cv_id, matches: saved.update(cv_id=cv_id, matches=matches))

    result = rj.rank_jobs(top_k=2)

    assert result["cv_id"] == 1
    assert [m["rank"] for m in result["matches"]] == [1, 2]  
    assert result["matches"][0]["job_id"] == 10
    assert result["matches"][0]["score"] == 0.9
    assert saved["cv_id"] == 1                                 

def test_rank_without_cv_raises(monkeypatch):
    monkeypatch.setattr(rj, "get_latest_cv", lambda: None)
    with pytest.raises(HTTPException):
        rj.rank_jobs()