import os
from app.sources.adzuna import AdzunaSource
from app.repository.jobs_repository import save_jobs
from app.cache import redis_client
from fastapi import HTTPException


def check_rate_limit(max_calls: int = 30, window_seconds: int = 3600):
    key = "adzuna:calls"
    calls = redis_client.incr(key)
    if calls == 1:
        redis_client.expire(key, window_seconds)
    if calls > max_calls:
        raise HTTPException(status_code=429, detail=f"Limit {max_calls}/h przekroczony, spróbuj później")

def fetch_and_store_jobs(what: str) -> dict:
    cache_key = f"jobs:fetched:{what.lower()}"

    if redis_client.get(cache_key):
        return {"cached": True, "message": "Pobrano niedawno"}

    check_rate_limit()

    source = AdzunaSource(os.getenv("ADZUNA_APP_ID"), os.getenv("ADZUNA_APP_KEY"))
    offers = source.fetch(what)
    saved = save_jobs(offers)

    redis_client.setex(cache_key, 3600, "1")
    return {"fetched": len(offers), "saved": saved, "cached": False}