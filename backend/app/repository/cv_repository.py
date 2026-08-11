from psycopg.types.json import Json
from app.db import get_connection

def save_cv(filename: str, content: str, embedding: list[float]) -> int:
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO cv (filename, content, embedding) VALUES (%s, %s, %s) RETURNING id",
                    (filename, content, Json(embedding)),
                )
                return cur.fetchone()[0]
    finally:
        conn.close()

def get_latest_cv() -> dict | None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, embedding, content FROM cv ORDER BY created_at DESC LIMIT 1")
            row = cur.fetchone()
            if row is None:
                return None
            return {"id": row[0], "embedding": row[1], "content": row[2]}
    finally:
        conn.close()