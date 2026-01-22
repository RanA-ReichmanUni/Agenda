import psycopg2
import os
from dotenv import load_dotenv
from urllib.parse import urlparse
load_dotenv()

def _get_env(name: str, default: str | None = None) -> str | None:
    """Small helper to read env vars consistently."""
    value = os.getenv(name)
    return value if value not in (None, "") else default

def get_db_connection():
    """
    Connection strategy:
    1) Prefer DATABASE_URL (Render, Railway, Heroku, etc.)
    2) Fallback to DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD (local / docker-compose)
    """

    database_url = _get_env("DATABASE_URL")
    if database_url:
        # psycopg2 accepts a connection URL directly
        return psycopg2.connect(database_url)

    # Fallback: discrete variables (local setup)
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
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create agendas table (with user_id foreign key)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agendas (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                share_token VARCHAR(36) UNIQUE
            )
        """)

        # Migration: Add share_token if it doesn't exist (for existing databases)
        try:
            cursor.execute("""
                ALTER TABLE agendas 
                ADD COLUMN IF NOT EXISTS share_token VARCHAR(36) UNIQUE;
            """)
            conn.commit()
        except Exception as e:
            print(f"⚠️  Migration note (share_token): {e}")
            conn.rollback()

        # Migration: Add analysis columns if they don't exist
        try:
            cursor.execute("""
                ALTER TABLE agendas 
                ADD COLUMN IF NOT EXISTS analysis_score VARCHAR(10);
            """)
            cursor.execute("""
                ALTER TABLE agendas 
                ADD COLUMN IF NOT EXISTS analysis_reasoning TEXT;
            """)
            cursor.execute("""
                ALTER TABLE agendas 
                ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP;
            """)
            cursor.execute("""
                ALTER TABLE agendas 
                ADD COLUMN IF NOT EXISTS analysis_article_count INTEGER;
            """)
            conn.commit()
            print("✅ Analysis columns added/verified")
        except Exception as e:
            print(f"⚠️  Migration note (analysis columns): {e}")
            conn.rollback()
        
        # Create articles table
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
        
        conn.commit()
        print("✅ Database tables created successfully")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        conn.rollback()
    finally:
        conn.close()
