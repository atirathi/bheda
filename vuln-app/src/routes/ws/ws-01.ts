import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    challenge: 'WebSocket message injection',
    hint: 'Connect to /ws and send: {"admin":true}',
  });
});

export default router;
