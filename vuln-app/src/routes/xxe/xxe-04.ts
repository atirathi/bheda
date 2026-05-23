import { Router, Request, Response } from 'express';
import { parseStringPromise } from 'xml2js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const svg = req.body.svg;
    if (!svg) return res.status(400).json({ error: 'svg required' });
    const result = await parseStringPromise(svg);
    return res.json({ parsed: result, note: 'SVG XXE can read local files' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
