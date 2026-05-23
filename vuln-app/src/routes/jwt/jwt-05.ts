import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const WEAK_SECRET = 'secret';

router.get('/token', (_req: Request, res: Response) => {
  const token = jwt.sign({ user: 'user', role: 'user' }, WEAK_SECRET, { algorithm: 'HS256' });
  res.json({ token, hint: 'Secret is a common weak password' });
});

router.get('/verify', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    const decoded = jwt.verify(token, WEAK_SECRET, { algorithms: ['HS256'] });
    return res.json({ verified: true, decoded });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

export default router;
