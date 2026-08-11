from fastapi import HTTPException
from app.repository.cv_repository import get_latest_cv
from app.repository.jobs_repository import get_job
from app.repository.matches_repository import get_matches_for_cv, update_explanation
from app.ai.explain import explain_match

def explain_matches() -> dict:
    cv = get_latest_cv()
    if cv is None:
        raise HTTPException(status_code=400, detail="Najpierw wgraj CV i odpal ranking")

    matches = get_matches_for_cv(cv["id"])

    explained = 0
    for m in matches:
        job = get_job(m["job_id"])
        if job is None:
            continue
        result = explain_match(cv["content"], job["title"], job["description"] or "")
        update_explanation(m["id"], result.model_dump())
        explained += 1

    return {"explained": explained}