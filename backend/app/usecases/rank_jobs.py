from fastapi import HTTPException

from app.repository.cv_repository import get_latest_cv
from app.repository.matches_repository import save_matches
from app.vectordb import build_filter, search_jobs


def rank_jobs(
    user_id: int,
    top_k: int = 10,
    search_query: str | None = None,
    city: str | None = None,
    min_salary: int | None = None,
) -> dict:
    cv = get_latest_cv(user_id)
    if cv is None:
        raise HTTPException(status_code=400, detail="No CV uploaded")
    
    query_filter = build_filter(search_query, city, min_salary)
    points = search_jobs(cv["embedding"], top_k, query_filter)

    matches = []
    for rank, point in enumerate(points, start=1):
        matches.append({
            "job_id": point.payload["job_id"],
            "score": point.score,
            "rank": rank,
        })

    save_matches(cv["id"], matches, user_id)
    return {"cv_id": cv["id"], "matches": matches}