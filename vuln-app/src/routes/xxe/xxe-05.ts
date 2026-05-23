import { Router, Request, Response } from 'express';
import { parseStringPromise } from 'xml2js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const soap = req.body.soap;
    if (!soap) return res.status(400).json({ error: 'soap envelope required' });
    const result = await parseStringPromise(soap);
    return res.json({ parsed: result, note: 'SOAP XXE can target internal services' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
