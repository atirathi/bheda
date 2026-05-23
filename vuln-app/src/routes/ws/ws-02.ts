import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    challenge: 'WebSocket origin bypass',
    hint: 'Connect from a different origin to test CORS WS bypass',
  });
});

export default router;
