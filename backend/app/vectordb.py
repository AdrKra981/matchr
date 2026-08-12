from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, Filter, FieldCondition, MatchValue

qdrant = QdrantClient(host="qdrant", port=6333)
COLLECTION = "jobs"

def ensure_collection():
    if not qdrant.collection_exists(COLLECTION):
        qdrant.create_collection(
            COLLECTION,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )

def search_jobs(vector: list[float], top_k: int = 10, search_query: str | None = None):
    query_filter = None
    if search_query is not None:
        query_filter = Filter(
            must=[FieldCondition(key="search_query", match=MatchValue(value=search_query))]
        )
    response = qdrant.query_points(collection_name=COLLECTION, query=vector, limit=top_k, query_filter=query_filter,)
    return response.points