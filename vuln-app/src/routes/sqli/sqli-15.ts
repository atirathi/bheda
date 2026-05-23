import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { query: gqlQuery, variables } = req.body;
    if (gqlQuery && gqlQuery.includes('user(id:')) {
      const match = gqlQuery.match(/user\(id:\s*"([^"]+)"\)/);
      if (match) {
        const id = match[1];
        const result = await query(`SELECT * FROM users WHERE id = '${id}'`);
        return res.json({ data: { user: result.rows[0] || null } });
      }
    }
    return res.json({ data: null, message: 'Use GraphQL query format: { user(id: \"value\") { id username password } }' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
