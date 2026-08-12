from fastapi import APIRouter
from app.usecases.rank_jobs import rank_jobs
from app.usecases.explain_matches import explain_matches
from app.repository.matches_repository import get_ranking

router = APIRouter(prefix="/matches", tags=["matches"])

@router.post("/rank")
def rank_jobs_api(top_k: int = 10, what: str | None = None):
    return rank_jobs(top_k, what)

@router.post("/explain")
def explain_matches_api():
    return explain_matches()

@router.get("")
def get_matches_api():
    return get_ranking()