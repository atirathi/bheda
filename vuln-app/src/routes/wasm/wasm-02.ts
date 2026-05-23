import { Router, Request, Response } from 'express';

const router = Router();

router.post('/imports', (req: Request, res: Response) => {
  const { imports } = req.body;
  res.json({
    receivedImports: imports,
    note: 'WASM imports can call native functions - supply malicious imports',
  });
});

export default router;
