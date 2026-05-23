import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const router = Router();

router.get('/token', (_req: Request, res: Response) => {
  res.json({
    note: 'Create a JWT with kid pointing to an arbitrary file path',
    example: 'Header: {"alg":"HS256","kid":"../../etc/passwd"}'
  });
});

router.get('/verify', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    const decoded = jwt.decode(token, { complete: true }) as any;
    if (!decoded) throw new Error('Invalid token');
    const kid = decoded.header.kid || '';
    let secret = 'default_secret';
    if (kid) {
      try {
        secret = fs.readFileSync(kid, 'utf8');
      } catch { }
    }
    const verified = jwt.verify(token, secret, { algorithms: ['HS256'] });
    return res.json({ verified: true, decoded: verified });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

export default router;
