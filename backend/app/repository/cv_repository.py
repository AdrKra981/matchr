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