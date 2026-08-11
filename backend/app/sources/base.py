from abc import ABC, abstractmethod
from app.domain.job import Job


class JobSource(ABC):
    @abstractmethod
    def fetch(self, what: str) -> list[Job]:
         """Pobiera oferty pasujące do zapytania `what`.
        Zwraca listę słowników w formacie zgodnym z kolumnami tabeli `jobs`.
        """