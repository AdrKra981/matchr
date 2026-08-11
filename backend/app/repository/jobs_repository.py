from app.domain.job_index_item import JobIndexItem
from dataclasses import asdict
from app.domain.job import Job
from psycopg.types.json import Json
from app.db import get_connection

INSERT_SQL = """
    INSERT INTO jobs (
        external_id, slug, title, company_name, city, workplace_type,
        experience_level, salary_from, salary_to, salary_currency,
        employment_type, url, description, skills, raw, published_at, expires_at
    )
    VALUES (
        %(external_id)s, %(slug)s, %(title)s, %(company_name)s, %(city)s,
        %(workplace_type)s, %(experience_level)s, %(salary_from)s, %(salary_to)s,
        %(salary_currency)s, %(employment_type)s, %(url)s, %(description)s,
        %(skills)s, %(raw)s, %(published_at)s, %(expires_at)s
    )
    ON CONFLICT (external_id) DO UPDATE SET
        title = EXCLUDED.title,
        salary_from = EXCLUDED.salary_from,
        salary_to = EXCLUDED.salary_to,
        description = EXCLUDED.description,
        raw = EXCLUDED.raw,
        fetched_at = now();
"""


def save_jobs(jobs: list[Job]) -> int:
    saved = 0
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                for job in jobs:
                    params = {
                        **asdict(job),
                        "raw": Json(job.raw),
                        "skills": Json(job.skills) if job.skills is not None else None,
                    }
                    cur.execute(INSERT_SQL, params)
                    saved += 1
    finally:
        conn.close()
    return saved

def get_jobs_for_indexing() -> list[JobIndexItem]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title, description FROM jobs")
            rows = cur.fetchall()
            return [JobIndexItem(id=r[0], title=r[1], description=r[2]) for r in rows]
    finally:
        conn.close()

def get_job(job_id: int) -> dict | None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title, description FROM jobs WHERE id = %s", (job_id,))
            row = cur.fetchone()
            if row is None:
                return None
            return {"id": row[0], "title": row[1], "description": row[2]}
    finally:
        conn.close()
