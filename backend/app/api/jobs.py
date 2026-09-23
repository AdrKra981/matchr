import logging

from fastapi import APIRouter, Depends
from rq.job import Retry

from app.auth.deps import get_current_user
from app.domain.user import User
from app.tasks.queue import fetch_job, task_queue
from app.usecases.fetch_jobs import fetch_and_store_jobs
from app.usecases.index_jobs import index_jobs

router = APIRouter(prefix='/jobs', tags=['jobs'])
logger = logging.getLogger(__name__)

@router.post("/fetch")
def fetch_jobs_api(what: str = "frontend developer", current_user: User = Depends(get_current_user)):
    logger.info("Jobs fetch requested", extra={"what": what, "user_id": current_user.id})
    result = fetch_and_store_jobs(what)
    return result

@router.post("/index")
def index_jobs_api(current_user: User = Depends(get_current_user)):
    job = task_queue.enqueue(index_jobs, retry=Retry(max=3, interval=[10, 30, 60]))  
    logger.info("index job queued", extra={"user_id": current_user.id, "job_id": job.id})
    return {"job_id": job.id, "status": "queued"}

@router.get("/index/{job_id}")
def index_status(job_id: str, current_user: User = Depends(get_current_user)):
    job = fetch_job(job_id)
    return {"status": job.get_status(), "result": job.result}
