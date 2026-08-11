from fastapi import FastAPI
from app.api.jobs import router as jobs_router

app = FastAPI()

@app.get("/health")
async def healthcheck():
    return {"status": "ok"}

app.include_router(jobs_router)

