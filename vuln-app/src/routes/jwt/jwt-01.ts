import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const SECRET = 'bheda_jwt_secret';

router.get('/token', (_req: Request, res: Response) => {
  const token = jwt.sign({ user: 'admin', role: 'admin' }, SECRET, { algorithm: 'HS256' });
  const noneToken = jwt.sign({ user: 'admin', role: 'admin' }, '', { algorithm: 'none' });
  res.json({ hs256: token, none: noneToken, note: 'Try verifying the "none" token' });
});

router.get('/verify', (req: Request, res: Response) => {
  const token = (req.query.token || req.headers.authorization?.replace('Bearer ', '')) as string;
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256', 'none'] });
    return res.json({ verified: true, decoded });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

export default router;
