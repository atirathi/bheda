import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: 'url parameter required' });
    try {
      await axios.get(url, { timeout: 3000 });
    } catch (err: any) {
      return res.json({
        message: 'Request attempted',
        note: 'Blind SSRF via DNS - check your DNS logs for callback',
        dnsCallback: url,
      });
    }
    return res.json({ message: 'Request completed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
