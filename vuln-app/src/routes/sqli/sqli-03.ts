import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: 'id parameter required' });
    const start = Date.now();
    await query(`SELECT * FROM products WHERE id = '${id}'`);
    const elapsed = Date.now() - start;
    return res.json({ elapsed, message: 'Query executed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
