import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

router.get('/token', (_req: Request, res: Response) => {
  const token = jwt.sign({ user: 'user', role: 'user' }, privateKey, { algorithm: 'RS256' });
  res.json({
    token,
    publicKey: publicKey.export({ type: 'pkcs1', format: 'pem' }),
    note: 'Try changing alg from RS256 to HS256 using the public key as HMAC secret'
  });
});

router.get('/verify', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256', 'HS256'] });
    return res.json({ verified: true, decoded });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

export default router;
