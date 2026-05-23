import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const logoUrl = req.query.logo_uri as string;
    if (!logoUrl) return res.status(400).json({ error: 'logo_uri parameter required' });
    const response = await axios.get(logoUrl, { timeout: 5000, responseType: 'arraybuffer' });
    return res.json({
      message: 'Logo fetched for OAuth provider',
      size: response.data.length,
      contentType: response.headers['content-type'],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
