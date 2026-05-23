import { Router, Request, Response } from 'express';
import dns from 'dns';
import axios from 'axios';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const hostname = req.query.host as string;
    if (!hostname) return res.status(400).json({ error: 'host parameter required' });
    const url = `http://${hostname}/latest/meta-data/`;
    const response = await axios.get(url, { timeout: 5000 });
    return res.json({ data: response.data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
