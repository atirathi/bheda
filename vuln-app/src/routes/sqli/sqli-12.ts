import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit as string || '10';
    const offset = req.query.offset as string || '0';
    const result = await query(`SELECT * FROM products LIMIT ${limit} OFFSET ${offset}`);
    return res.json({ products: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
