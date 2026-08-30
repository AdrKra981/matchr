import logging

from fastapi import APIRouter, Depends, File, UploadFile

from app.auth.deps import get_current_user
from app.domain.user import User
from app.usecases.analyze_cv import analyze_cv

router = APIRouter(prefix="/cv", tags=["cv"])
logger = logging.getLogger(__name__)

@router.post("/upload")
async def upload_cv(current_user: User = Depends(get_current_user), file: UploadFile = File(...)):
    file_bytes = await file.read()
    logger.info("CV upload requested", extra={"user_id": current_user.id, "cv_filename": file.filename, "bytes": len(file_bytes)})
    return analyze_cv(current_user.id, file_bytes, file.filename)