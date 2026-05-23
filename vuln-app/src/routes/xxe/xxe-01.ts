import { Router, Request, Response } from 'express';
import { parseStringPromise } from 'xml2js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const xml = req.body.xml || req.body;
    if (typeof xml !== 'string') {
      return res.status(400).json({ error: 'XML body required as string' });
    }
    const result = await parseStringPromise(xml);
    return res.json({ parsed: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
