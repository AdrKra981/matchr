import logging

from fastapi import APIRouter, Depends, HTTPException
from rq import Retry

from app.auth.deps import get_current_user
from app.domain.user import User
from app.repository.cv_repository import get_latest_cv
from app.repository.matches_repository import get_ranking
from app.tasks.queue import fetch_job, task_queue
from app.usecases.explain_matches import explain_matches
from app.usecases.rank_jobs import rank_jobs

router = APIRouter(prefix="/matches", tags=["matches"])
logger = logging.getLogger(__name__)

@router.post("/rank")
def rank_jobs_api(
    current_user: User = Depends(get_current_user),
    top_k: int = 10,
    what: str | None = None,
    city: str | None = None,
    min_salary: int | None = None,
):
    # Checked here, not only in the worker: an HTTPException raised inside the
    # job just marks it "failed" and the message never reaches the user.
    if get_latest_cv(current_user.id) is None:
        raise HTTPException(status_code=400, detail="No CV uploaded")

    job = task_queue.enqueue(
        rank_jobs, current_user.id, top_k, what, city, min_salary,
        retry=Retry(max=2),
        meta={"user_id": current_user.id},
    )
    logger.info("ranking queued", extra={"user_id": current_user.id, "job_id": job.id})
    return {"job_id": job.id, "status": "queued"}

@router.get("/rank/{job_id}")
def rank_status(job_id: str, current_user: User = Depends(get_current_user)):
    job = fetch_job(job_id, user_id=current_user.id)
    return {"status": job.get_status(), "result": job.result}

@router.post("/explain")
def explain_matches_api(current_user: User = Depends(get_current_user)):
    logger.info("explain requested", extra={"user_id": current_user.id})
    result = explain_matches(current_user.id)
    logger.info("explain done", extra={"user_id": current_user.id, "count": len(result) if isinstance(result, list) else None})
    return result

@router.get("")
def get_matches_api(current_user: User = Depends(get_current_user)):
    result = get_ranking(current_user.id)
    logger.info("matches read", extra={"user_id": current_user.id, "count": len(result)})
    return result