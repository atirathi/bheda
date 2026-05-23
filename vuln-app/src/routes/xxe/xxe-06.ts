import { Router, Request, Response } from 'express';
import { parseStringPromise } from 'xml2js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const xml = req.body.xml;
    if (!xml) return res.status(400).json({ error: 'xml content required' });
    const result = await parseStringPromise(xml);
    return res.json({
      parsed: result,
      note: 'DOCX files are ZIP archives containing XML - XXE can extract files from server',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
