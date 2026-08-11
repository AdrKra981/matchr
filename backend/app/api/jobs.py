from fastapi import APIRouter
from app.usecases.fetch_jobs import fetch_and_store_jobs

router = APIRouter(prefix='/jobs', tags=['jobs'])

@router.post("/fetch")
def fetch_jobs_api(what: str = "frontend developer"):
    result = fetch_and_store_jobs(what)
    return result