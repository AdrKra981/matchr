import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from app.api.auth import router as auth_router
from app.api.cv import router as cv_routes
from app.api.jobs import router as jobs_router
from app.api.matches import router as matches_router
from app.observability.logging_config import setup_logging
from app.observability.request_id import RequestIdMiddleware

setup_logging(os.getenv("LOG_LEVEL", "INFO"))

app = FastAPI()

app.add_middleware(RequestIdMiddleware)

@app.get("/health")
async def healthcheck():
    return {"status": "ok"}

app.mount("/metrics", make_asgi_app())

app.include_router(jobs_router)
app.include_router(cv_routes)
app.include_router(matches_router)
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.0.59:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)