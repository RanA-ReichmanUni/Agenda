import { Router, Request, Response } from 'express';
import { getDbPool } from '../database';
import { getPasswordHash, verifyPassword, createAccessToken, getCurrentUser, AuthRequest } from '../security';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ detail: "Email and password are required" });
    }

    const pool = getDbPool();
    const client = await pool.connect();
    
    try {
        if (Buffer.from(password, 'utf8').length > 72) {
            return res.status(400).json({ detail: "Password too long. Maximum 72 characters." });
        }
        
        const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ detail: "Email already registered" });
        }
        
        const hashedPassword = await getPasswordHash(password);
        
        const result = await client.query(
            "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id",
            [email, hashedPassword, name || null]
        );
        
        const userId = result.rows[0].id;
        await client.query('COMMIT');
        
        const accessToken = createAccessToken({ sub: userId });
        
        return res.status(201).json({
            access_token: accessToken,
            token_type: "bearer"
        });
        
    } catch (e: any) {
        await client.query('ROLLBACK');
        console.error(`Registration failed: ${e}`);
        return res.status(500).json({ detail: `Registration failed: ${e.message}` });
    } finally {
        client.release();
    }
});

router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ detail: "Email and password are required" });
    }

    const pool = getDbPool();
    const client = await pool.connect();
    
    try {
        const result = await client.query(
            "SELECT id, password_hash FROM users WHERE email = $1",
            [email]
        );
        
        const userRow = result.rows[0];
        
        if (!userRow || !(await verifyPassword(password, userRow.password_hash))) {
            res.setHeader('WWW-Authenticate', 'Bearer');
            return res.status(401).json({ detail: "Incorrect email or password" });
        }
        
        const userId = userRow.id;
        const accessToken = createAccessToken({ sub: userId });
        
        return res.json({
            access_token: accessToken,
            token_type: "bearer"
        });
        
    } catch (e: any) {
        console.error(`Login failed: ${e}`);
        return res.status(500).json({ detail: `Login failed: ${e.message}` });
    } finally {
        client.release();
    }
});

router.get('/me', getCurrentUser, (req: AuthRequest, res: Response) => {
    return res.json(req.user);
});

export default router;
