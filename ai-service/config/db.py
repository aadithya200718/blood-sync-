import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv

load_dotenv()

db_config = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "root"),
    "database": os.getenv("DB_NAME", "bloodsync"),
}

pool = pooling.MySQLConnectionPool(
    pool_name="bloodsync_ai",
    pool_size=5,
    **db_config
)


def get_connection():
    """Get a connection from the pool."""
    return pool.get_connection()


def execute_query(query: str, params: tuple = ()) -> list[dict]:
    """Execute a read-only SELECT query and return rows as dicts."""
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        cursor.close()
        return rows
    finally:
        conn.close()
