from qdrant_client.models import PointStruct

from app.ai.embeddings import embed
from app.repository.jobs_repository import get_jobs_for_indexing
from app.vectordb import COLLECTION, ensure_collection, get_client


def index_jobs() -> dict:
    ensure_collection()
    items = get_jobs_for_indexing()

    points = []
    for item in items:
        text = f"{item.title}\n{item.description or ''}"
        vector = embed(text)
        points.append(PointStruct(
            id=item.id,
            vector=vector,
            payload={"job_id": item.id, "title": item.title, "search_query": item.search_query, "salary_from": item.salary_from, "city": item.city},
        ))

    if points:
        get_client().upsert(collection_name=COLLECTION, points=points)

    return {"indexed": len(points)}