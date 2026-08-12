from dataclasses import dataclass


@dataclass
class Job:
    external_id: str
    title: str 
    slug: str | None = None
    company_name: str | None = None
    city: str | None = None
    salary_from: int | None = None
    salary_to: int | None = None
    salary_currency: str | None = None
    url: str | None = None
    description: str | None = None
    raw: dict | None = None
    published_at: str | None = None
    skills: list[str] | None = None
    experience_level: str | None = None
    workplace_type: str | None = None
    employment_type: str | None = None
    search_query: str | None = None
    expires_at: str | None = None

    