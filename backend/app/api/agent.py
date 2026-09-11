import logging

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agent.runner import run_agent_stream
from app.auth.deps import get_current_user
from app.domain.user import User

router = APIRouter(prefix='/agent', tags=['agent'])
logger = logging.getLogger(__name__)

MAX_STEPS_ALLOWED = 8

class AgentRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    steps: int = Field(default=6, ge=1, le=MAX_STEPS_ALLOWED)


@router.post("/")
def agent_run(body: AgentRequest, current_user: User = Depends(get_current_user)):
    logger.debug("Agent run requested", extra={"user_id": current_user.id})
    result = run_agent_stream(body.query, user_id=current_user.id, max_steps=min(body.steps, MAX_STEPS_ALLOWED))
    return StreamingResponse(result, media_type="text/plain; charset=utf-8")
