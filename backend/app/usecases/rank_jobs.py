from fastapi import HTTPException
from app.repository.cv_repository import get_latest_cv
from app.repository.matches_repository import save_matches
from app.vectordb import search_jobs

def rank_jobs(top_k: int = 10, search_query: str | None = None) -> dict:
    cv = get_latest_cv()
    if cv is None:
        raise HTTPException(status_code=400, detail="Najpierw wgraj CV (POST /cv/upload)")

    points = search_jobs(cv["embedding"], top_k, search_query)

    matches = []
    for rank, point in enumerate(points, start=1):
        matches.append({
            "job_id": point.payload["job_id"],
            "score": point.score,
            "rank": rank,
        })

    save_matches(cv["id"], matches)
    return {"cv_id": cv["id"], "matches": matches}