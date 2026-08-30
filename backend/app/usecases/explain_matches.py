import hashlib
import json
import logging

from fastapi import HTTPException

from app.ai.explain import explain_match
from app.cache import redis_client
from app.observability.metrics import cache_hits
from app.repository.cv_repository import get_latest_cv
from app.repository.jobs_repository import get_job
from app.repository.matches_repository import get_matches_for_cv, update_explanation

logger = logging.getLogger(__name__)

def _explain_cached(cv_text: str, job_title: str, job_description: str) -> tuple[dict, bool]:
    raw = f"{cv_text}|{job_title}|{job_description}"
    key = "explain:" + hashlib.sha256(raw.encode()).hexdigest()

    cached = redis_client.get(key)
    if cached:
        cache_hits.labels(kind="explain").inc()
        logger.info("Explain cache hit", extra={"job_title": job_title})
        return (json.loads(cached), True)         

    result = explain_match(cv_text, job_title, job_description).model_dump()
    redis_client.setex(key, 86400, json.dumps(result)) 
    return (result, False)

def explain_matches(user_id: int) -> dict:
    cv = get_latest_cv(user_id)
    if cv is None:
        raise HTTPException(status_code=400, detail="No CV uploaded")

    matches = get_matches_for_cv(cv["id"])

    explained = 0
    hits = 0
    for m in matches:
        job = get_job(m["job_id"])
        if job is None:
            continue
        result, was_cached = _explain_cached(cv["content"], job["title"], job["description"] or "")
        update_explanation(m["id"], result)
        explained += 1
        if was_cached:
            hits += 1   

    return {"explained": explained, "from_cache": hits}