import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: 'id parameter required' });
    const result = await query(`SELECT * FROM products WHERE id = '${id}'`);
    return res.json({ products: result.rows, note: 'MSSQL xp_cmdshell simulated - use ; EXEC xp_cmdshell command' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
