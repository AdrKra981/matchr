from fastapi import FastAPI
from app.api.jobs import router as jobs_router
from app.api.cv import router as cv_routes
from app.api.matches import router as matches_router

app = FastAPI()

@app.get("/health")
async def healthcheck():
    return {"status": "ok"}

app.include_router(jobs_router)
app.include_router(cv_routes)
app.include_router(matches_router)

