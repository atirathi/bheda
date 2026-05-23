import { Router, Request, Response } from 'express';
import { exec } from 'child_process';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const cmd = req.query.cmd as string;
  if (!cmd) return res.status(400).json({ error: 'cmd required' });
  if (cmd.includes('cat') || cmd.includes('flag') || cmd.includes('etc')) {
    return res.status(403).json({ error: 'Blocked by WAF' });
  }
  exec(cmd, (error, stdout) => {
    if (error) return res.json({ error: error.message });
    return res.json({ output: stdout });
  });
});

export default router;
