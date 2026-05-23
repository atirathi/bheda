import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const router = Router();

router.get('/token', (_req: Request, res: Response) => {
  res.json({
    note: 'Create a JWT with jku pointing to an attacker-controlled JWKS endpoint',
    example: 'Header: {"alg":"RS256","jku":"https://attacker.com/jwks.json"}'
  });
});

router.get('/verify', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    const decoded = jwt.decode(token, { complete: true }) as any;
    if (!decoded) throw new Error('Invalid token');
    const jku = decoded.header.jku;
    if (jku) {
      axios.get(jku, { timeout: 5000 }).then(jwksRes => {
        try {
          const verified = jwt.verify(token, jwksRes.data.keys[0], { algorithms: ['RS256'] });
          return res.json({ verified: true, decoded: verified });
        } catch (err: any) {
          return res.status(401).json({ error: err.message });
        }
      }).catch(() => {
        return res.status(401).json({ error: 'Failed to fetch JKU' });
      });
    } else {
      return res.status(400).json({ error: 'No jku header' });
    }
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

export default router;
