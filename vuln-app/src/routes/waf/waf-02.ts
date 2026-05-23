import { Router, Request, Response } from 'express';
import { exec } from 'child_process';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  let cmd = req.query.cmd as string || '';
  cmd = cmd.replace(/[<>|;&$]/g, '');
  if (!cmd) return res.status(400).json({ error: 'cmd required' });
  exec(cmd, (error, stdout) => {
    if (error) return res.json({ error: error.message });
    return res.json({ output: stdout });
  });
});

export default router;
