from psycopg.types.json import Json

from app.db import get_connection


def save_cv(user_id: int,filename: str, content: str, embedding: list[float]) -> int:
    conn = get_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO cv (user_id, filename, content, embedding) VALUES (%s, %s, %s, %s) RETURNING id",
                (user_id, filename, content, Json(embedding)),
            )
            return cur.fetchone()[0]
    finally:
        conn.close()

def get_latest_cv(user_id: int) -> dict | None:
    conn = get_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("SELECT id, embedding, content FROM cv WHERE user_id = %s ORDER BY created_at DESC LIMIT 1", (user_id,))
            row = cur.fetchone()
            if row is None:
                return None
            return {"id": row[0], "embedding": row[1], "content": row[2]}
    finally:
        conn.close()