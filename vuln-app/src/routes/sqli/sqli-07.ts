import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

function waf(input: string): string {
  const blocked = /\b(union|select|or|and|drop|insert|delete|update)\b/i;
  if (blocked.test(input)) {
    return '1';
  }
  return input;
}

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const id = waf(req.query.id as string || '');
    const result = await query(`SELECT * FROM products WHERE id = '${id}'`);
    return res.json({ products: result.rows, wafTriggered: id !== req.query.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
