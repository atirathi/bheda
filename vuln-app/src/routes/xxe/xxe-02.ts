import { Router, Request, Response } from 'express';
import { parseStringPromise } from 'xml2js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const xml = req.body.xml;
    if (!xml) return res.status(400).json({ error: 'xml required' });
    const result = await parseStringPromise(xml);
    return res.json({ parsed: result, note: 'OOB via HTTP - check your HTTP listener' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
