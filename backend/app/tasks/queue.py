from fastapi import HTTPException
from redis import Redis
from rq import Queue
from rq.exceptions import NoSuchJobError
from rq.job import Job

redis_conn = Redis(
    host="redis",
    port=6379,
)

task_queue = Queue("matchr", connection=redis_conn)


def fetch_job(job_id: str, user_id: int | None = None) -> Job:
    """Loads a job, or 404s if it never existed or its result has expired.

    With `user_id`, someone else's job 404s too, so a caller can't tell a
    job that belongs to another user from one that doesn't exist.
    """
    try:
        job = Job.fetch(job_id, connection=redis_conn)
    except NoSuchJobError:
        raise HTTPException(status_code=404, detail="Job not found") from None
    if user_id is not None and job.meta.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
