import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import WebSocket from 'ws';

const router = Router();

const SECRET = 'bheda_ws_jwt_secret';

router.get('/token', (_req: Request, res: Response) => {
  const token = jwt.sign({ user: 'guest', role: 'guest' }, SECRET, { algorithm: 'HS256' });
  res.json({ token, note: 'Connect to ws://host/ws?token=YOUR_TOKEN to test' });
});

router.get('/verify', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] }) as any;
    if (decoded.role === 'admin') {
      return res.json({ adminAccess: true, flag: 'BHEDA{ws_jwt_injection_demo}' });
    }
    return res.json({ adminAccess: false, message: 'Guest access only' });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

export default router;
