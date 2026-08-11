from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

qdrant = QdrantClient(host="qdrant", port=6333)
COLLECTION = "jobs"

def ensure_collection():
    if not qdrant.collection_exists(COLLECTION):
        qdrant.create_collection(
            COLLECTION,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )

def search_jobs(vector: list[float], top_k: int = 10):
    response = qdrant.query_points(collection_name=COLLECTION, query=vector, limit=top_k)
    return response.points