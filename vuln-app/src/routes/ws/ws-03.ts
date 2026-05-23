import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    challenge: 'WebSocket CSRF - no origin check on WS upgrade',
    hint: 'Create a page that connects to /ws to exfiltrate data',
  });
});

export default router;
