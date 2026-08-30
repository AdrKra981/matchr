import logging
import os

from fastapi import HTTPException

from app.cache import redis_client
from app.observability.metrics import cache_hits
from app.repository.jobs_repository import save_jobs
from app.sources.adzuna import AdzunaSource

logger = logging.getLogger(__name__)


def check_rate_limit(max_calls: int = 30, window_seconds: int = 3600):
    key = "adzuna:calls"
    calls = redis_client.incr(key)
    if calls == 1:
        redis_client.expire(key, window_seconds)
    if calls > max_calls:
        logger.warning("Rate limit exceeded", extra={"limit": max_calls, "calls": calls})
        raise HTTPException(status_code=429, detail=f"Limit {max_calls}/h exceeded, try again")

def fetch_and_store_jobs(what: str) -> dict:
    cache_key = f"jobs:fetched:{what.lower()}"

    if redis_client.get(cache_key):
        cache_hits.labels(kind="jobs").inc()
        logger.info("jobs fetch cache hit", extra={"what": what})
        return {"cached": True, "message": "Fresh data, not fetched."}

    check_rate_limit()

    source = AdzunaSource(os.getenv("ADZUNA_APP_ID"), os.getenv("ADZUNA_APP_KEY"))
    
    try:
        offers = source.fetch(what)
    except Exception:
        logger.exception("adzuna fetch failed", extra={"what": what})
        raise HTTPException(status_code=502, detail="Job source unavailable")

    for job in offers:
        job.search_query = what
    saved = save_jobs(offers)
    logger.info("jobs fetched", extra={"what": what, "fetched": len(offers), "saved": saved})

    redis_client.setex(cache_key, 3600, "1")
    return {"fetched": len(offers), "saved": saved, "cached": False}