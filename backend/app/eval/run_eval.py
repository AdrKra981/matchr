from statistics import mean

from app.eval.golden_set import GOLDEN_SET
from app.eval.metrics import recall_at_k, reciprocal_rank
from app.eval.retrieval import retrieve_dense, retrieve_hybrid, retrieve_hybrid_rerank

K = 10
CANDIDATE_POOL = 30

MODES = {
    "dense": lambda cv: retrieve_dense(cv, K),
    "hybrid": lambda cv: retrieve_hybrid(cv, K),
    "hybrid+rerank": lambda cv: retrieve_hybrid_rerank(cv, CANDIDATE_POOL, K),
}


def run():
    for name, retrieve in MODES.items():
        recalls, rrs = [], []
        for entry in GOLDEN_SET:
            retrieved = retrieve(entry["cv_text"])
            recalls.append(recall_at_k(retrieved, entry["relevant_job_ids"], K))
            rrs.append(reciprocal_rank(retrieved, entry["relevant_job_ids"]))
        print(f"{name:15} recall@{K}={mean(recalls):.3f}  MRR={mean(rrs):.3f}")


if __name__ == "__main__":
    run()