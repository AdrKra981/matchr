from statistics import mean

from app.ai.explain import explain_match
from app.eval.golden_set import GOLDEN_SET
from app.eval.judge import judge_faithfulness
from app.eval.retrieval import retrieve_hybrid_rerank
from app.repository.jobs_repository import get_job


def run():
    scores = []
    for entry in GOLDEN_SET:
        top_ids = retrieve_hybrid_rerank(entry["cv_text"], 30, 1)
        if not top_ids:
            continue
        job = get_job(top_ids[0])
        explanation = explain_match(entry["cv_text"], job["title"], job["description"])
        verdict = judge_faithfulness(entry["cv_text"], job["title"], job["description"], explanation)
        scores.append(verdict.faithfulness)

    if not scores:
        print("No results!")
        return
    print(f"Faithfulness mean: {mean(scores)}")


if __name__ == "__main__":
    run()