import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const order = req.query.order as string || 'name';
    const result = await query(`SELECT * FROM products ORDER BY ${order}`);
    return res.json({ products: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
