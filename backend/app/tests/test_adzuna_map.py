import pytest
from app.sources.adzuna import AdzunaSource

SAMPLE = {
    "id": "5796896201",
    "title": "Frontend Developer",
    "company": {"display_name": "BEST S.A."},
    "location": {"display_name": "Łódź, łódzkie", "area": ["Polska", "łódzkie", "Łódź"]},
    "salary_min": 120000,
    "salary_max": 162000,
    "redirect_url": "https://www.adzuna.pl/land/ad/123",
    "description": "Opis oferty...",
    "created": "2026-07-11T12:44:08Z",
}

@pytest.fixture
def source():
    return AdzunaSource("app_id", "app_key")

def test_map_basic_fields(source):
    job = source._map(SAMPLE)
    assert job.external_id == "5796896201"
    assert job.title == "Frontend Developer"
    assert job.company_name == "BEST S.A."
    assert job.salary_from == 120000
    assert job.salary_to == 162000
    assert job.salary_currency == "PLN"

def test_map_missing_fields_are_safe(source):
    job = source._map({"id": 42, "title": "X"})
    assert job.external_id == "42"
    assert job.company_name is None
    assert job.salary_from is None

def test_map_city(source):
    job = source._map(SAMPLE)
    assert job.city == "Łódź, łódzkie"
    assert job.workplace_type is None

@pytest.mark.parametrize("raw_id, expected", [
    (42, "42"),
    ("5796896201", "5796896201"),
    (0, "0"),
])

def test_external_id_is_always_str(source, raw_id, expected):
    job = source._map({"id": raw_id, "title": "X"})
    assert job.external_id == expected
