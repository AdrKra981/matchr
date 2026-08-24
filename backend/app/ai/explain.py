from functools import lru_cache
from pydantic import BaseModel, Field
from openai import OpenAI

MODEL = "gpt-4o-mini"

@lru_cache(maxsize=1)
def get_client() -> OpenAI:
    return OpenAI()


class MatchExplanation(BaseModel):
    match_score: int = Field(description="Dopasowanie CV do oferty w skali 0-100")
    strengths: list[str] = Field(description="Elementy CV pasujące do oferty")
    gaps: list[str] = Field(description="Czego brakuje w CV względem oferty")      


def explain_match(cv_text: str, job_title: str, job_description: str) -> MatchExplanation:
    completion = get_client().beta.chat.completions.parse(
        model=MODEL,
        messages=[
            {"role": "system", "content": (
                "Jesteś doradcą kariery. Oceń dopasowanie kandydata (na podstawie CV) "
                "do oferty pracy. Zwróć: dopasowanie 0-100, mocne strony (co z CV pasuje) "
                "i braki (czego brakuje w CV względem oferty). Odpowiadaj po polsku, konkretnie."
            )},
            {"role": "user", "content": (
                f"CV KANDYDATA:\n{cv_text}\n\n"
                f"OFERTA: {job_title}\n{job_description}"
            )},
        ],
        response_format=MatchExplanation,
    )
    return completion.choices[0].message.parsed