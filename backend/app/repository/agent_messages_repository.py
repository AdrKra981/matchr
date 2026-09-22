from app.db import get_connection

VALID_ROLES = {"user", "assistant"}


def save_message(user_id: int, role: str, content: str) -> None:
    if role not in VALID_ROLES:
        raise ValueError(f"Invalid role: {role!r}")
    conn = get_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO agent_messages (user_id, role, content) VALUES (%s, %s, %s)",
                (user_id, role, content),
            )
    finally:
        conn.close()


def get_messages(user_id: int, limit: int = 50) -> list[dict]:
    conn = get_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT role, content, created_at FROM (
                    SELECT id, role, content, created_at
                    FROM agent_messages
                    WHERE user_id = %s
                    ORDER BY created_at DESC, id DESC
                    LIMIT %s
                ) recent
                ORDER BY created_at, id
            """, (user_id, limit))
            return [
                {"role": r[0], "content": r[1], "created_at": r[2]}
                for r in cur.fetchall()
            ]
    finally:
        conn.close()
