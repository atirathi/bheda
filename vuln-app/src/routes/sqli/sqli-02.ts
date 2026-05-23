import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: 'id parameter required' });
    const result = await query(`SELECT * FROM products WHERE id = '${id}'`);
    if (result.rows.length > 0) {
      return res.json({ exists: true, product: result.rows[0] });
    }
    return res.json({ exists: false, message: 'No product found' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
