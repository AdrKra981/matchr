from app.db import get_connection
from psycopg.types.json import Json  

def save_matches(cv_id: int, matches: list[dict], user_id: int) -> int:
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM matches WHERE cv_id = %s", (cv_id,))
                for m in matches:
                    cur.execute(
                        "INSERT INTO matches (cv_id, job_id, score, rank, user_id) VALUES (%s, %s, %s, %s, %s)",
                        (cv_id, m["job_id"], m["score"], m["rank"], user_id),
                    )
        return len(matches)
    finally:
        conn.close()


def get_matches_for_cv(cv_id: int) -> list[dict]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, job_id FROM matches WHERE cv_id = %s ORDER BY rank", (cv_id,))
            return [{"id": r[0], "job_id": r[1]} for r in cur.fetchall()]
    finally:
        conn.close()

def update_explanation(match_id: int, explanation: dict) -> None:
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE matches SET explanation = %s WHERE id = %s",
                    (Json(explanation), match_id),
                )
    finally:
        conn.close()

def get_ranking(user_id: int) -> list[dict]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT m.rank, m.score, m.explanation,
                       j.title, j.company_name, j.city, j.url,
                       j.salary_from, j.salary_to, j.salary_currency
                FROM matches m
                JOIN jobs j ON j.id = m.job_id
                WHERE m.cv_id = (SELECT id FROM cv WHERE user_id = %s ORDER BY created_at DESC LIMIT 1)
                ORDER BY m.rank
            """, (user_id,))
            rows = cur.fetchall()
            return [
                {
                    "rank": r[0], "score": r[1], "explanation": r[2],
                    "title": r[3], "company_name": r[4], "city": r[5], "url": r[6],
                    "salary_from": r[7], "salary_to": r[8], "salary_currency": r[9],
                }
                for r in rows
            ]
    finally:
        conn.close()