import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.user_id || '1';
    const result = await query(`SELECT * FROM users WHERE id = '${userId}'`);
    return res.json({ user: result.rows[0] || null });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
