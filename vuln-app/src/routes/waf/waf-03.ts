import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  let id = req.query.id as string || '1';
  if (id.includes('union') || id.includes('select') || id.includes('or')) {
    return res.status(403).json({ error: 'SQLi detected' });
  }
  try {
    const result = await query(`SELECT * FROM products WHERE id = '${id}'`);
    return res.json({ products: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
