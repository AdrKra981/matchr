import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.agent.runner import run_agent
from app.auth.deps import get_current_user
from app.domain.user import User

router = APIRouter(prefix='/agent', tags=['agent'])
logger = logging.getLogger(__name__)

class AgentRequest(BaseModel):
    query: str
    steps: int = 6

MAX_STEPS_ALLOWED = 8

@router.post("/")
def agent_run(body: AgentRequest, current_user: User = Depends(get_current_user)):
    logger.debug("Agent run requested", extra={"user_id": current_user.id})
    result = run_agent(body.query, user_id=current_user.id, max_steps=min(body.steps, MAX_STEPS_ALLOWED))
    return {"response": result}