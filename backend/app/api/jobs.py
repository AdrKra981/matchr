from app.usecases.index_jobs import index_jobs
from fastapi import APIRouter
from app.usecases.fetch_jobs import fetch_and_store_jobs
from app.auth.deps import get_current_user
from app.domain.user import User
from fastapi import APIRouter, Depends

router = APIRouter(prefix='/jobs', tags=['jobs'])

@router.post("/fetch")
def fetch_jobs_api(what: str = "frontend developer", current_user: User = Depends(get_current_user)):
    result = fetch_and_store_jobs(what)
    return result

@router.post("/index")
def index_jobs_api(current_user: User = Depends(get_current_user)):
    result = index_jobs()
    return result
