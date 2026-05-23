import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const SECRET = 'bheda_jwt_exp_secret';

router.get('/token', (_req: Request, res: Response) => {
  const expired = jwt.sign({ user: 'admin', role: 'admin', exp: Math.floor(Date.now() / 1000) - 3600 }, SECRET, { algorithm: 'HS256' });
  res.json({ expiredToken: expired, note: 'This token is expired but still accepted' });
});

router.get('/verify', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'], ignoreExpiration: true });
    return res.json({ verified: true, decoded });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

export default router;
