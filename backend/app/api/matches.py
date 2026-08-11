from fastapi import APIRouter
from app.usecases.rank_jobs import rank_jobs
from app.usecases.explain_matches import explain_matches

router = APIRouter(prefix="/matches", tags=["matches"])

@router.post("/rank")
def rank_jobs_api(top_k: int = 10):
    return rank_jobs(top_k)

@router.post("/explain")
def explain_matches_api():
    return explain_matches()