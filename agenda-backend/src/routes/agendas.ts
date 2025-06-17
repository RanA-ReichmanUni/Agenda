import { Router } from 'express';
import pool from '../db';

const router = Router();

/** GET /agendas - Fetch all agendas */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agendas ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching agendas:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/** GET /agendas/:id - Fetch single agenda by ID */
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    const result = await pool.query('SELECT * FROM agendas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Agenda not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching agenda:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/** POST /agendas - Create a new agenda */
router.post('/', async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid title' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO agendas (title) VALUES ($1) RETURNING *',
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating agenda:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/** DELETE /agendas/:id - Delete an agenda */
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    const result = await pool.query('DELETE FROM agendas WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Agenda not found' });
    res.json({ message: 'Agenda deleted', agenda: result.rows[0] });
  } catch (err) {
    console.error('Error deleting agenda:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
