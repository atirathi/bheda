import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({
        error: 'url parameter required',
        hint: 'Try: ?url=http://169.254.169.254/latest/meta-data/'
      });
    }
    const response = await axios.get(url, { timeout: 5000 });
    return res.json({
      status: response.status,
      headers: response.headers,
      data: response.data,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
