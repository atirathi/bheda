import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const wasmUrl = req.query.url as string;
    if (!wasmUrl) return res.status(400).json({ error: 'url parameter required' });
    const response = await axios.get(wasmUrl, { timeout: 5000, responseType: 'arraybuffer' });
    return res.json({
      message: 'WASM module fetched',
      size: response.data.length,
      note: 'WASM imports could call internal functions',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
