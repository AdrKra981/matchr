from functools import lru_cache

from fastembed import SparseTextEmbedding
from qdrant_client.models import SparseVector


@lru_cache(maxsize=1)
def get_model() -> SparseTextEmbedding:
    return SparseTextEmbedding(model_name="Qdrant/bm25")


def embed_sparse(text: str) -> SparseVector:
    embedding = next(iter(get_model().embed([text])))
    return SparseVector(indices=embedding.indices.tolist(), values=embedding.values.tolist())