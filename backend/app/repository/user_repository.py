from app.db import get_connection


def create_user(email: str, password_hash: str) -> int:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id", (email, password_hash))
            user_id = cur.fetchone()[0]
            conn.commit()
            return user_id
    finally:
        conn.close()

def get_user_by_email(email: str) -> dict | None:
    conn = get_connection()
    try: 
        with conn.cursor() as cur:
            cur.execute("SELECT id, email, password_hash FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if not row:
                return None
            return {"id": row[0], "email": row[1], "password_hash": row[2]}
    finally:
        conn.close()

def get_user_by_id(user_id: int) -> dict | None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, email FROM users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                return None
            return {"id": row[0], "email": row[1]}
    finally:
        conn.close()