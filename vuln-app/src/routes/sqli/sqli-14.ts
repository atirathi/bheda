import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const ua = req.headers['user-agent'] || 'unknown';
    await query(`INSERT INTO logs (user_agent, ip, path) VALUES ('${ua}', '${req.ip}', '${req.path}')`);
    return res.json({ message: 'Logged' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/logs', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM logs ORDER BY created_at DESC LIMIT 100');
    return res.json({ logs: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
