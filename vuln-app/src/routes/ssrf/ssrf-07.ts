import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const endpoint = req.query.endpoint as string;
    if (!endpoint) return res.status(400).json({ error: 'endpoint parameter required' });
    const query = `query { __schema { types { name fields { name } } } }`;
    const response = await axios.post(endpoint, { query }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    return res.json({ introspection: response.data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
