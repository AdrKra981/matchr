from fastapi import HTTPException

from app.observability.metrics import rank_latency
from app.repository.cv_repository import get_latest_cv
from app.repository.jobs_repository import get_description
from app.repository.matches_repository import save_matches
from app.vectordb import build_filter, search_jobs
from app.ai.rerank import rerank
from app.ai.sparse import embed_sparse

CANDIDATE_POOL = 30
FINAL_RANK = 10

def rank_jobs(
    user_id: int,
    top_k: int = FINAL_RANK,
    search_query: str | None = None,
    city: str | None = None,
    min_salary: int | None = None,
) -> dict:
    with rank_latency.time():
        cv = get_latest_cv(user_id)
        if cv is None:
            raise HTTPException(status_code=400, detail="No CV uploaded")
        
        query_filter = build_filter(search_query, city, min_salary)
        sparse_vec = embed_sparse(cv["content"])
        points = search_jobs(cv["embedding"], sparse_vec, CANDIDATE_POOL, query_filter)

        job_ids = [p.payload["job_id"] for p in points]
        descriptions = get_description(job_ids)
        candidates = [
            {
                "job_id": p.payload["job_id"],
                "text": f"{p.payload['title']}. {descriptions.get(p.payload['job_id'], '')[:800]}",
            }
            for p in points
        ]
        
        reranked = rerank(cv["content"][:1000], candidates, top_k)

        matches = []
        for rank, point in enumerate(reranked, start=1):
            matches.append({
                "job_id": point["job_id"],
                "score": point["rerank_score"],
                "rank": rank,
            })

        save_matches(cv["id"], matches, user_id)
        return {"cv_id": cv["id"], "matches": matches}