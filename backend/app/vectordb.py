from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, Filter, FieldCondition, MatchValue, Range

qdrant = QdrantClient(host="qdrant", port=6333)
COLLECTION = "jobs"

def ensure_collection():
    if not qdrant.collection_exists(COLLECTION):
        qdrant.create_collection(
            COLLECTION,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )

def build_filter(
    search_query: str | None = None,
    city: str | None = None,
    min_salary: int | None = None,
) -> Filter | None:
    conditions = []
    if search_query:
        conditions.append(FieldCondition(key="search_query", match=MatchValue(value=search_query)))
    if city:
        conditions.append(FieldCondition(key="city", match=MatchValue(value=city)))
    if min_salary is not None:
        conditions.append(FieldCondition(key="salary_from", range=Range(gte=min_salary)))
    
    if not conditions:
        return None
    return Filter(must=conditions)


def search_jobs(vector: list[float], top_k: int = 10, query_filter: Filter | None = None):
    response = qdrant.query_points(
        collection_name=COLLECTION,
        query=vector,
        limit=top_k,
        query_filter=query_filter,
    )
    return response.points