import { Router, Request, Response } from 'express';

const router = Router();

router.post('/buffer-overflow', (req: Request, res: Response) => {
  const { data } = req.body;
  const buffer = Buffer.alloc(64);
  if (data && data.length > 64) {
    data.copy(buffer, 0, 0, buffer.length);
    return res.json({
      overflow: true,
      note: 'Buffer overflow attempt detected - WASM linear memory can be corrupted',
    });
  }
  return res.json({ message: 'No overflow' });
});

export default router;
