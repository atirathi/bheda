import { Router, Request, Response } from 'express';
import { parseStringPromise } from 'xml2js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const config = req.body.config;
    if (!config) return res.status(400).json({ error: 'config xml required' });
    const result = await parseStringPromise(config);
    return res.json({ parsed: result, note: 'Configuration XXE can expose internal config files' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
