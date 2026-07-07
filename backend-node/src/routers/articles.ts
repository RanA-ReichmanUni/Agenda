import { Router, Response } from 'express';
import { getDbPool } from '../database';
import { getCurrentUser, AuthRequest } from '../security';

const router = Router();

async function verifyAgendaOwnership(agendaId: number, userId: number): Promise<boolean> {
    const pool = getDbPool();
    const result = await pool.query(
        "SELECT id FROM agendas WHERE id = $1 AND user_id = $2",
        [agendaId, userId]
    );
    return result.rows.length > 0;
}

router.post('/agendas/:agenda_id/articles', getCurrentUser, async (req: AuthRequest, res: Response) => {
    const agendaId = parseInt(req.params.agenda_id as string, 10);
    const { title, url, description, image } = req.body;
    const userId = req.user!.id;

    if (!await verifyAgendaOwnership(agendaId, userId)) {
        return res.status(404).json({ detail: "Agenda not found" });
    }

    const pool = getDbPool();
    try {
        const result = await pool.query(
            `INSERT INTO articles (agenda_id, title, url, description, image) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, agenda_id, title, url, description, image, created_at`,
            [agendaId, title, url, description, image]
        );
        
        const row = result.rows[0];
        return res.status(201).json({
            id: row.id,
            agenda_id: row.agenda_id,
            title: row.title,
            url: row.url,
            description: row.description,
            image: row.image,
            createdAt: row.created_at
        });
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    }
});

router.get('/agendas/:agenda_id/articles', getCurrentUser, async (req: AuthRequest, res: Response) => {
    const agendaId = parseInt(req.params.agenda_id as string, 10);
    const userId = req.user!.id;

    if (!await verifyAgendaOwnership(agendaId, userId)) {
        return res.status(404).json({ detail: "Agenda not found" });
    }

    const pool = getDbPool();
    try {
        const result = await pool.query(
            `SELECT id, agenda_id, title, url, description, image, created_at 
             FROM articles 
             WHERE agenda_id = $1 
             ORDER BY created_at DESC`,
            [agendaId]
        );
        
        return res.json(result.rows.map(r => ({
            id: r.id,
            agenda_id: r.agenda_id,
            title: r.title,
            url: r.url,
            description: r.description,
            image: r.image,
            createdAt: r.created_at
        })));
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    }
});

router.delete('/articles/:article_id', getCurrentUser, async (req: AuthRequest, res: Response) => {
    const articleId = parseInt(req.params.article_id as string, 10);
    const userId = req.user!.id;

    const pool = getDbPool();
    try {
        const result = await pool.query(
            `SELECT articles.id 
             FROM articles 
             JOIN agendas ON articles.agenda_id = agendas.id 
             WHERE articles.id = $1 AND agendas.user_id = $2`,
            [articleId, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ detail: "Article not found" });
        }
        
        await pool.query("DELETE FROM articles WHERE id = $1", [articleId]);
        return res.status(204).send();
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    }
});

export default router;
