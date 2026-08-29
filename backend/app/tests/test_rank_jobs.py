from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.usecases import rank_jobs as rj

USER_ID = 7

def fake_point(job_id, score):
    return SimpleNamespace(payload={"job_id": job_id}, score=score)

def test_rank_builds_ranked_matches(monkeypatch):
    asked_for = {}

    def fake_get_latest_cv(user_id):
        asked_for["user_id"] = user_id
        return {"id": 1, "embedding": [0.1] * 1536, "content": "cv"}

    saved = {}

    monkeypatch.setattr(rj, "get_latest_cv", fake_get_latest_cv)
    monkeypatch.setattr(rj, "search_jobs", lambda vec, top_k, query_filter: [fake_point(10, 0.9), fake_point(20, 0.8)])
    monkeypatch.setattr(
        rj, "save_matches",
        lambda cv_id, matches, user_id: saved.update(cv_id=cv_id, matches=matches, user_id=user_id),
    )

    result = rj.rank_jobs(USER_ID, top_k=2)

    assert result["cv_id"] == 1
    assert [m["rank"] for m in result["matches"]] == [1, 2]  
    assert result["matches"][0]["job_id"] == 10
    assert result["matches"][0]["score"] == 0.9
    assert saved["cv_id"] == 1                                 
    assert asked_for["user_id"] == USER_ID
    assert saved["user_id"] == USER_ID

def test_rank_without_cv_raises(monkeypatch):
    monkeypatch.setattr(rj, "get_latest_cv", lambda user_id: None)
    with pytest.raises(HTTPException):
        rj.rank_jobs(USER_ID)
