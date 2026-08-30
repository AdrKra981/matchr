import logging

from fastapi import APIRouter, Depends

from app.auth.deps import get_current_user
from app.domain.user import User
from app.repository.matches_repository import get_ranking
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
    logger.info("ranking requested", extra={"user_id": current_user.id, "what": what, "city": city, "min_salary": min_salary})
    result = rank_jobs(current_user.id, top_k, what, city, min_salary)
    matches = result.get("matches", [])
    logger.info("ranking done", extra={
        "user_id": current_user.id,
        "returned": len(matches),
        "top_score": matches[0]["score"] if matches else None,
    })
    return result

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