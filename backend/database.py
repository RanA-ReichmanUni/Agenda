import psycopg2
from psycopg2 import pool
import os
from dotenv import load_dotenv
from urllib.parse import urlparse
load_dotenv()

# Global connection pool
_db_pool = None

def _get_env(name: str, default: str | None = None) -> str | None:
    """Small helper to read env vars consistently."""
    value = os.getenv(name)
    return value if value not in (None, "") else default

def _create_pool():
    """Create a new connection pool."""
    database_url = _get_env("DATABASE_URL")
    min_conn = 1
    max_conn = 20
    
    if database_url:
        return psycopg2.pool.ThreadedConnectionPool(min_conn, max_conn, database_url)

    # Fallback: discrete variables (local setup)
    host = _get_env("DB_HOST", "localhost")
    port = _get_env("DB_PORT", "5432")
    dbname = _get_env("DB_NAME", "postgres")
    user = _get_env("DB_USER", "postgres")
    password = _get_env("DB_PASSWORD", "postgres")

    return psycopg2.pool.ThreadedConnectionPool(
        min_conn,
        max_conn,
        host=host,
        port=int(port) if port else 5432,
        dbname=dbname,
        user=user,
        password=password,
    )

class PooledConnection:
    """Wrapper to return connection to pool instead of closing it."""
    def __init__(self, pool, conn):
        self._pool = pool
        self._conn = conn

    def close(self):
        """Return connection to pool."""
        if self._conn:
            try:
                self._conn.rollback() # Ensure no open transaction
                self._pool.putconn(self._conn)
            except Exception as e:
                print(f"Error returning connection to pool: {e}")
                # Try to force close if it fails (it might be broken)
                try:
                    self._pool.putconn(self._conn, close=True)
                except:
                    pass
            finally:
                self._conn = None

    def __getattr__(self, name):
        """Delegate everything else to the real connection."""
        if not self._conn:
            raise Exception("Connection is closed")
        return getattr(self._conn, name)

def get_db_connection():
    """
    Get a connection from the pool.
    Returns a wrapped connection object that returns to pool on close().
    """
    global _db_pool
    if _db_pool is None:
        try:
            _db_pool = _create_pool()
            print("✅ Database connection pool created")
        except Exception as e:
            print(f"❌ Failed to create connection pool: {e}")
            # Fallback to direct connection if pool fails
            return _create_direct_connection()

    try:
        conn = _db_pool.getconn()
        return PooledConnection(_db_pool, conn)
    except Exception as e:
        print(f"⚠️ Pool exhausted or error, creating temporary connection: {e}")
        return _create_direct_connection()

def _create_direct_connection():
    """Fallback: Create a direct connection without pooling."""
    database_url = _get_env("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url)

    host = _get_env("DB_HOST", "localhost")
    port = _get_env("DB_PORT", "5432")
    dbname = _get_env("DB_NAME", "postgres")
    user = _get_env("DB_USER", "postgres")
    password = _get_env("DB_PASSWORD", "postgres")

    return psycopg2.connect(
        host=host,
        port=int(port) if port else 5432,
        dbname=dbname,
        user=user,
        password=password,
    )

def init_db():
    """
    Initialize the database by creating necessary tables.
    This runs on application startup.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Core tables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agendas (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                share_token VARCHAR(36) UNIQUE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS articles (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                description TEXT,
                image TEXT,
                agenda_id INTEGER REFERENCES agendas(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Backward-compatible migrations for existing databases
        cursor.execute("""
            ALTER TABLE agendas
            ADD COLUMN IF NOT EXISTS share_token VARCHAR(36) UNIQUE
        """)
        cursor.execute("""
            ALTER TABLE agendas
            ADD COLUMN IF NOT EXISTS analysis_score VARCHAR(10)
        """)
        cursor.execute("""
            ALTER TABLE agendas
            ADD COLUMN IF NOT EXISTS analysis_reasoning TEXT
        """)
        cursor.execute("""
            ALTER TABLE agendas
            ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP
        """)
        cursor.execute("""
            ALTER TABLE agendas
            ADD COLUMN IF NOT EXISTS analysis_article_count INTEGER
        """)

        # Performance indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_agendas_user_id ON agendas(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_agenda_id ON articles(agenda_id)")

        conn.commit()
        print("✅ Database schema initialized successfully")

    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()
