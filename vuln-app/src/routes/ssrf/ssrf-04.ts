import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const fontUrl = req.query.font as string;
    if (!fontUrl) return res.status(400).json({ error: 'font URL required' });
    const response = await axios.get(fontUrl, { timeout: 5000, responseType: 'arraybuffer' });
    return res.json({
      message: 'Font fetched',
      size: response.data.length,
      type: response.headers['content-type'],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
