import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const wasm = Buffer.from([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  ]);
  res.type('application/wasm').send(wasm);
});

router.post('/load', (req: Request, res: Response) => {
  const { wasmBase64 } = req.body;
  if (!wasmBase64) return res.status(400).json({ error: 'wasm base64 required' });
  const wasmBuffer = Buffer.from(wasmBase64, 'base64');
  res.json({
    size: wasmBuffer.length,
    note: 'WASM loaded - vulnerable modules could allow UAF or memory corruption',
  });
});

export default router;
