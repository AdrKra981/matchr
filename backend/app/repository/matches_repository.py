from app.db import get_connection

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