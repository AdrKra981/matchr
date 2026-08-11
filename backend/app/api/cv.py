from fastapi import APIRouter, UploadFile, File
from app.usecases.analyze_cv import analyze_cv

router = APIRouter(prefix="/cv", tags=["cv"])

@router.post("/upload")
async def upload_cv(file: UploadFile = File(...)):
    file_bytes = await file.read()
    return analyze_cv(file_bytes, file.filename)