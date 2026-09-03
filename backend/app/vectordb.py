from functools import lru_cache

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    Range,
    VectorParams,
    Modifier,
    SparseVectorParams,
    FusionQuery,
    Fusion,
    Prefetch
)

COLLECTION = "jobs"

@lru_cache(maxsize=1)
def get_client() -> QdrantClient:
    return QdrantClient(host="qdrant", port=6333)

def ensure_collection():
    if not get_client().collection_exists(COLLECTION):
        get_client().create_collection(
            COLLECTION,
            vectors_config={"dense": VectorParams(size=1536, distance=Distance.COSINE),},
            sparse_vectors_config={
                "bm25": SparseVectorParams(modifier=Modifier.IDF)
            }
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


def search_jobs(dense_vec: list[float], sparse_vec, top_k: int = 10, query_filter: Filter | None = None):
    response = get_client().query_points(
        collection_name=COLLECTION,
        limit=top_k,
        prefetch=[
            Prefetch(query=dense_vec, using='dense', limit=top_k * 3, filter=query_filter),
            Prefetch(query=sparse_vec, using='bm25', limit=top_k * 3, filter=query_filter),
        ],
        query=FusionQuery(fusion=Fusion.RRF),
    )
    return response.points