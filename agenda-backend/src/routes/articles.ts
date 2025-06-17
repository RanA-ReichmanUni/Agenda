import { Router } from 'express';
import pool from '../db';

const router = Router();

/** GET /agendas/:id/articles - Get all articles for an agenda */
router.get('/agendas/:id/articles', async (req, res) => {
  const agendaId = Number(req.params.id);
  if (isNaN(agendaId)) return res.status(400).json({ error: 'Invalid agenda ID' });

  try {
    const result = await pool.query(
    //$1 is a single parameter, representing each value in the array at the bottom 
      'SELECT * FROM articles WHERE agenda_id = $1 ORDER BY created_at DESC', 
      [agendaId] // Array of values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/** POST /agendas/:id/articles - Create a new article for an agenda */
router.post('/agendas/:id/articles', async (req, res) => {
  const agendaId = Number(req.params.id);
  const { title, url, description, image } = req.body;

  if (isNaN(agendaId) || !title || !url || !description) {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO articles (title, url, description, image, agenda_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, url, description, image || null, agendaId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating article:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/** DELETE /articles/:id - Delete an article by ID */
router.delete('/articles/:id', async (req, res) => {
  const articleId = Number(req.params.id);
  if (isNaN(articleId)) return res.status(400).json({ error: 'Invalid article ID' });

  try {
    const result = await pool.query(
      'DELETE FROM articles WHERE id = $1 RETURNING *',
      [articleId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json({ message: 'Article deleted', article: result.rows[0] });
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
