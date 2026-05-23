import { Router, Request, Response } from 'express';
import { parseStringPromise } from 'xml2js';
import axios from 'axios';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const xml = req.body.xml;
    if (!xml) return res.status(400).json({ error: 'xml body required' });
    const result = await parseStringPromise(xml);
    if (result?.root?.fetch) {
      const url = result.root.fetch[0].$.url;
      if (url) {
        try {
          const data = await axios.get(url, { timeout: 3000 });
          return res.json({ data: data.data });
        } catch { }
      }
    }
    return res.json({ parsed: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
