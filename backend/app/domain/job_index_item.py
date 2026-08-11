from dataclasses import dataclass

@dataclass
class JobIndexItem:
    id: int
    title: str
    description: str | None = None