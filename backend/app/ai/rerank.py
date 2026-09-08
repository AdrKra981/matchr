from functools import lru_cache

from fastembed.rerank.cross_encoder import TextCrossEncoder


@lru_cache(maxsize=1)
def get_encoder() -> TextCrossEncoder:
    return TextCrossEncoder(model_name="jinaai/jina-reranker-v2-base-multilingual")


def rerank(query: str, candidates: list[dict], top_k: int = 10) -> list[dict]: 
    scores = get_encoder().rerank(query, [c["text"] for c in candidates])
    ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    result = []
    for c, s in ranked[:top_k]:
        c["rerank_score"] = float(s) 
        result.append(c)
    return result