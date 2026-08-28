from app.auth.deps import get_current_user
from app.domain.user import User
from fastapi import APIRouter, Depends
from app.usecases.rank_jobs import rank_jobs
from app.usecases.explain_matches import explain_matches
from app.repository.matches_repository import get_ranking

router = APIRouter(prefix="/matches", tags=["matches"])

@router.post("/rank")
def rank_jobs_api(
    current_user: User = Depends(get_current_user),
    top_k: int = 10,
    what: str | None = None,
    city: str | None = None,
    min_salary: int | None = None,
):
    return rank_jobs(current_user.id, top_k, what, city, min_salary)

@router.post("/explain")
def explain_matches_api(current_user: User = Depends(get_current_user)):
    return explain_matches(current_user.id)

@router.get("")
def get_matches_api(current_user: User = Depends(get_current_user)):
    return get_ranking(current_user.id)