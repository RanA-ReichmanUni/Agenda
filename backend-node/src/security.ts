import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { getDbPool } from './database';

const SECRET_KEY = process.env.SECRET_KEY || "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7";
const ALGORITHM = "HS256";
const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "30", 10);

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
}

export async function getPasswordHash(password: string): Promise<string> {
    const saltRounds = 12; // passlib auto default equivalent
    return bcrypt.hash(password, saltRounds);
}

export function createAccessToken(data: Record<string, any>, expiresInMinutes?: number): string {
    const payload = { ...data };
    
    if (payload.sub !== undefined) {
        payload.sub = String(payload.sub);
    }
    
    const minutes = expiresInMinutes || ACCESS_TOKEN_EXPIRE_MINUTES;
    
    return jwt.sign(payload, SECRET_KEY, {
        algorithm: ALGORITHM as jwt.Algorithm,
        expiresIn: `${minutes}m`
    });
}

// User type definition
export interface User {
    id: number;
    email: string;
    name: string;
    created_at: Date;
}

// Express Request extension for authenticated routes
export interface AuthRequest extends Request {
    user?: User;
}

export async function getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ detail: "Not authenticated" });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
        
        const userIdStr = decoded.sub;
        if (!userIdStr) {
            return res.status(401).json({ detail: "Could not validate credentials" });
        }
        
        const userId = parseInt(userIdStr, 10);
        
        const pool = getDbPool();
        const result = await pool.query(
            "SELECT id, email, name, created_at FROM users WHERE id = $1",
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ detail: "Could not validate credentials" });
        }
        
        const userRow = result.rows[0];
        req.user = {
            id: userRow.id,
            email: userRow.email,
            name: userRow.name,
            created_at: userRow.created_at
        };
        
        next();
    } catch (e) {
        console.error(`Token validation error: ${e}`);
        return res.status(401).json({ detail: "Could not validate credentials" });
    }
}
