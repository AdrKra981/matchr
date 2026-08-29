import requests

from app.domain.job import Job
from app.sources.base import JobSource


class AdzunaSource(JobSource):
    def __init__(self, app_id: str, app_key: str):
        self.app_id = app_id
        self.app_key = app_key

    def _map(self, r) -> Job:
        return Job(
            external_id=str(r.get("id")),
            slug=None,
            title=r.get("title"),
            company_name=r.get("company", {}).get("display_name"),
            city=r.get("location", {}).get("display_name"),
            workplace_type=None,
            experience_level=None,
            salary_from=r.get("salary_min"),
            salary_to=r.get("salary_max"),
            salary_currency="PLN",
            employment_type=None,
            url=r.get("redirect_url"),
            description=r.get("description"),
            skills=None,
            raw=r,
            published_at=r.get("created"),
            expires_at=None,
        )
    
    def fetch(self, what: str) -> list[Job]:
        url = "https://api.adzuna.com/v1/api/jobs/pl/search/1"
        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "results_per_page": 50,
            "what": what,
            "content-type": "application/json",
        }
        
        response = requests.get(url, params=params, timeout=15)

        response.raise_for_status()

        data = response.json()

        offers = []
        for r in data.get("results", []):
            offer = self._map(r)
            offers.append(offer)
        
        return offers
        

        
        

        