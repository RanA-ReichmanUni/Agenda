import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

function getEnv(name: string, defaultValue?: string): string | undefined {
    const value = process.env[name];
    return (value !== undefined && value !== '') ? value : defaultValue;
}

let dbPool: Pool | null = null;

function createPool(): Pool {
    const databaseUrl = getEnv('DATABASE_URL');
    
    if (databaseUrl) {
        return new Pool({ connectionString: databaseUrl, min: 1, max: 20 });
    }

    const host = getEnv('DB_HOST', 'localhost');
    const port = getEnv('DB_PORT', '5432');
    const dbname = getEnv('DB_NAME', 'postgres');
    const user = getEnv('DB_USER', 'postgres');
    const password = getEnv('DB_PASSWORD', 'postgres');

    return new Pool({
        host: host,
        port: parseInt(port || '5432', 10),
        database: dbname,
        user: user,
        password: password,
        min: 1,
        max: 20
    });
}

export function getDbPool(): Pool {
    if (!dbPool) {
        try {
            dbPool = createPool();
            console.log("✅ Database connection pool created");
        } catch (e) {
            console.error(`❌ Failed to create connection pool: ${e}`);
            throw e;
        }
    }
    return dbPool;
}

export async function initDb(): Promise<void> {
    const pool = getDbPool();
    const client = await pool.connect();
    
    try {
        await client.query("BEGIN");

        // Core tables
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS agendas (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                share_token VARCHAR(36) UNIQUE
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS articles (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                description TEXT,
                image TEXT,
                agenda_id INTEGER REFERENCES agendas(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Backward-compatible migrations for existing databases
        await client.query(`
            ALTER TABLE agendas ADD COLUMN IF NOT EXISTS share_token VARCHAR(36) UNIQUE
        `);
        await client.query(`
            ALTER TABLE agendas ADD COLUMN IF NOT EXISTS analysis_score VARCHAR(10)
        `);
        await client.query(`
            ALTER TABLE agendas ADD COLUMN IF NOT EXISTS analysis_reasoning TEXT
        `);
        await client.query(`
            ALTER TABLE agendas ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP
        `);
        await client.query(`
            ALTER TABLE agendas ADD COLUMN IF NOT EXISTS analysis_article_count INTEGER
        `);
        await client.query(`
            ALTER TABLE agendas ADD COLUMN IF NOT EXISTS analysis_numeric_score INTEGER
        `);

        // Performance indexes
        await client.query("CREATE INDEX IF NOT EXISTS idx_agendas_user_id ON agendas(user_id)");
        await client.query("CREATE INDEX IF NOT EXISTS idx_articles_agenda_id ON articles(agenda_id)");

        await client.query("COMMIT");
        console.log("✅ Database schema initialized successfully");

    } catch (e) {
        await client.query("ROLLBACK");
        console.error(`❌ Error initializing database: ${e}`);
        throw e;
    } finally {
        client.release();
    }
}
