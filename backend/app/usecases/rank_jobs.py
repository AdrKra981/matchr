import logging
import time
from contextlib import contextmanager

from fastapi import HTTPException

from app.ai.rerank import rerank
from app.ai.sparse import embed_sparse
from app.observability.metrics import rank_latency
from app.repository.cv_repository import get_latest_cv
from app.repository.jobs_repository import get_descriptions
from app.repository.matches_repository import save_matches
from app.vectordb import build_filter, search_jobs

logger = logging.getLogger(__name__)

CANDIDATE_POOL = 30
FINAL_RANK = 10

@contextmanager
def timed(name: str, out: dict):
    start = time.perf_counter()
    yield
    out[name] = round(time.perf_counter() - start, 3)


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
        
        timings: dict = {}
        query_filter = build_filter(search_query, city, min_salary)

        with timed("embed_sparse", timings):
            sparse_vec = embed_sparse(cv["content"])

        with timed("search", timings):
            points = search_jobs(cv["embedding"], sparse_vec, CANDIDATE_POOL, query_filter)

        job_ids = [p.payload["job_id"] for p in points]
        with timed("descriptions", timings):
            descriptions = get_descriptions(job_ids)

        candidates = [
            {
                "job_id": p.payload["job_id"],
                "text": f"{p.payload['title']}. {descriptions.get(p.payload['job_id'], '')[:800]}",
            }
            for p in points
        ]

        with timed("rerank", timings):
            reranked = rerank(cv["content"][:1000], candidates, top_k)

        logger.info("rank timings", extra=timings)

        matches = []
        for rank, point in enumerate(reranked, start=1):
            matches.append({
                "job_id": point["job_id"],
                "score": point["rerank_score"],
                "rank": rank,
            })

        save_matches(cv["id"], matches, user_id)
        return {"cv_id": cv["id"], "matches": matches}