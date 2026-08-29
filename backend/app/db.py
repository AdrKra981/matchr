import os

import psycopg


def get_connection():
    return psycopg.connect(
        host="postgres",
        port=5432,
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
    )
