from functools import lru_cache

from openai import OpenAI
from pydantic import BaseModel, Field

from app.observability.metrics import llm_calls

MODEL = "gpt-4o-mini"

@lru_cache(maxsize=1)
def get_client() -> OpenAI:
    return OpenAI()


class MatchExplanation(BaseModel):
    match_score: int = Field(description="Match of CV to the job offer on a scale of 0-100")
    strengths: list[str] = Field(description="Elements of the CV that match the offer")
    gaps: list[str] = Field(description="What is missing in the CV compared to the offer")      


def explain_match(cv_text: str, job_title: str, job_description: str) -> MatchExplanation:
    llm_calls.inc()
    completion = get_client().beta.chat.completions.parse(
        model=MODEL,
        messages=[
            {"role": "system", "content": (
                "You are a career counselor. Assess the candidate's fit (based on their resume) "
                "for the job opening. Note: fit on a scale of 0-100, strengths (what matches the job description) "
                "and weaknesses. IMPORTANT: List weaknesses ONLY for requirements that are explicitly stated in the job posting, "
                "and which are missing from the resume. Do not invent requirements that are not in the job posting. Strengths and weaknesses "
                "must be based on the provided information, not on general knowledge. Respond in Polish, and be specific."
            )},
            {"role": "user", "content": (
                f"CANDIDATE'S CV:\n{cv_text}\n\n"
                f"JOB OFFER: {job_title}\n{job_description}"
            )},
        ],
        response_format=MatchExplanation,
        temperature=0.0,
    )
    return completion.choices[0].message.parsed