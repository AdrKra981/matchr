from functools import lru_cache

from app.ai.explain import MatchExplanation
from openai import OpenAI
from pydantic import BaseModel, Field

JUDGE_MODEL = "gpt-4o"

@lru_cache(maxsize=1)
def get_client() -> OpenAI:
    return OpenAI()

class FaithfulnessVerdict(BaseModel):
    faithfulness: float = Field(description="0.0 - 1.0: faithfulness of claims in generated explanation and summary with respect to source cv and job offer")
    unsupported_claims: list[str] = Field(description="list of claims made in explanation/summary which are not supported by the cv or job offer")
    reasoning: str = Field(description="short reasoning of faithfulness score")

def judge_faithfulness(cv_text: str, job_title: str, job_description: str, explanation: MatchExplanation) -> FaithfulnessVerdict:
    claims = explanation.strengths + explanation.gaps
    if not claims:
        return FaithfulnessVerdict(
            faithfulness=1.0,
            unsupported_claims=[],
            reasoning="no claims to check"
        )
    completion = get_client().beta.chat.completions.parse(
        model=JUDGE_MODEL,
        messages=[
            {"role": "system", "content": (
                "You evaluate two types of statements, EACH using a different rule:\n"
                "1. A STRENGTH is TRUE if it is evident from the content of the resume.\n"
                "2. AN ABSENCE is TRUE if the job posting requires it, and it is NOT listed on the resume.\n"
                "Absence from the resume confirms the lack; it is NOT a hallucination.\n"
                "Hallucination = a strength not mentioned in the resume, or a lack regarding something, that the job posting does not require.\n"
                "faithfulness = accurate / all\n\n"
                "STRICT RULES:\n"
                "1. strength: is the claim true according to the CV?\n"
                "2. absence: does the job offer require this and the claim is not in the CV?\n"
                "Any other case is an hallucination."
            )},
            {"role": "user", "content": (
                f"CV:\n{cv_text}\n\n"
                f"OFFER: {job_title}\n{job_description}\n\n"
                f"CLAIMS TO CHECK:\n" + "\n".join(f"- {c}" for c in claims)
            )},
        ],
        response_format=FaithfulnessVerdict,
        temperature=0.0,
    )

    return completion.choices[0].message.parsed
