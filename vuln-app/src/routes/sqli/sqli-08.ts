import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

function waf(input: string): string {
  const blocked = /\b(union|select|or|and|drop|insert|delete|update)\b/i;
  if (blocked.test(input)) return '1';
  return input;
}

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const ids = req.query.id;
    let finalId = '1';
    if (Array.isArray(ids)) {
      finalId = (ids as string[]).map(waf).join(' ');
    } else if (typeof ids === 'string') {
      finalId = waf(ids);
    }
    const result = await query(`SELECT * FROM products WHERE id = '${finalId}'`);
    return res.json({ products: result.rows, finalQuery: finalId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
