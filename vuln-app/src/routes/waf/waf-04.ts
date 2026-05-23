import { Router, Request, Response } from 'express';
import { exec } from 'child_process';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'url required' });
  const blocked = ['127', '172', '192', '169', '10.', 'localhost', 'internal'];
  if (blocked.some(b => url.includes(b))) {
    return res.status(403).json({ error: 'Internal IPs blocked' });
  }
  exec(`curl -s "${url}"`, { timeout: 5000 }, (error, stdout) => {
    if (error) return res.json({ error: error.message });
    return res.json({ output: stdout });
  });
});

export default router;
