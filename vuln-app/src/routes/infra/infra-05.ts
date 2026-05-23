import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.get('/tables', async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    `);
    return res.json({ tables: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/schema', async (req: Request, res: Response) => {
  try {
    const table = req.query.table as string;
    if (!table) return res.status(400).json({ error: 'table required' });
    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = '${table}'
    `);
    return res.json({ table, columns: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
