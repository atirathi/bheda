import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const SECRET = 'bheda_jwt_sub_secret';

router.get('/token', (_req: Request, res: Response) => {
  const token = jwt.sign({ sub: 'user_123', role: 'user' }, SECRET, { algorithm: 'HS256' });
  res.json({ token, note: 'Try forging a token with sub=admin or sub=admin_*' });
});

router.get('/verify', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] }) as any;
    if (decoded.sub && decoded.sub.startsWith('admin')) {
      return res.json({ verified: true, decoded, flag: 'BHEDA{jwt_sub_confusion_demo}' });
    }
    return res.json({ verified: true, decoded, message: 'Regular user access' });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

export default router;
