from app.db import get_connection
from psycopg.types.json import Json  

def save_matches(cv_id: int, matches: list[dict]) -> int:
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM matches WHERE cv_id = %s", (cv_id,))
                for m in matches:
                    cur.execute(
                        "INSERT INTO matches (cv_id, job_id, score, rank) VALUES (%s, %s, %s, %s)",
                        (cv_id, m["job_id"], m["score"], m["rank"]),
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