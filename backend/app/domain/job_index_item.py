from dataclasses import dataclass


@dataclass
class JobIndexItem:
    id: int
    title: str
    description: str | None = None
    search_query: str | None = None
    city: str | None = None
    salary_from: int | None = None
    