from fastapi import HTTPException
from app.repository.cv_repository import get_latest_cv
from app.repository.jobs_repository import get_job
from app.repository.matches_repository import get_matches_for_cv, update_explanation
from app.ai.explain import explain_match
import hashlib
import json
from app.cache import redis_client

def _explain_cached(cv_text: str, job_title: str, job_description: str) -> dict:
    raw = f"{cv_text}|{job_title}|{job_description}"
    key = "explain:" + hashlib.sha256(raw.encode()).hexdigest()

    cached = redis_client.get(key)
    if cached:
        return json.loads(cached)         

    result = explain_match(cv_text, job_title, job_description).model_dump()
    redis_client.setex(key, 86400, json.dumps(result)) 
    return result

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
        key_exists = redis_client.exists(
            "explain:" + hashlib.sha256(f"{cv['content']}|{job['title']}|{job['description'] or ''}".encode()).hexdigest()
        )
        result = _explain_cached(cv["content"], job["title"], job["description"] or "")
        update_explanation(m["id"], result)
        explained += 1
        if key_exists:
            hits += 1

    return {"explained": explained, "from_cache": hits}