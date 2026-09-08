from app.ai.embeddings import embed
from app.ai.rerank import rerank
from app.ai.sparse import embed_sparse
from app.repository.jobs_repository import get_descriptions
from app.vectordb import COLLECTION, get_client
from qdrant_client.models import Fusion, FusionQuery, Prefetch


def retrieve_dense(cv_text: str, k: int) -> list[int]:
    dense = embed(cv_text)
    res = get_client().query_points(
        collection_name=COLLECTION,
        query=dense,
        using="dense",          
        limit=k,
    )
    return [p.payload["job_id"] for p in res.points]


def retrieve_hybrid(cv_text: str, k: int) -> list[int]:
    dense = embed(cv_text)
    sparse = embed_sparse(cv_text)
    res = get_client().query_points(
        collection_name=COLLECTION,
        prefetch=[
            Prefetch(query=dense, using="dense", limit=k * 3),
            Prefetch(query=sparse, using="bm25", limit=k * 3),
        ],
        query=FusionQuery(fusion=Fusion.RRF),
        limit=k,
    )
    return [p.payload["job_id"] for p in res.points]


def retrieve_hybrid_rerank(cv_text: str, candidate_pool: int, k: int) -> list[int]:
    candidate_ids = retrieve_hybrid(cv_text, candidate_pool)
    descriptions = get_descriptions(candidate_ids)
    candidates = [
        {"job_id": jid, "text": descriptions.get(jid, "")[:800]}
        for jid in candidate_ids
    ]
    reranked = rerank(cv_text[:1000], candidates, k)
    return [c["job_id"] for c in reranked]
