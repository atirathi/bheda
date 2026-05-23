import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

router.get('/hash', (req: Request, res: Response) => {
  const password = req.query.password as string || 'test';
  const md5 = crypto.createHash('md5').update(password).digest('hex');
  const sha1 = crypto.createHash('sha1').update(password).digest('hex');
  res.json({
    original: password,
    md5,
    sha1,
    note: 'MD5 and SHA1 are cryptographically broken',
  });
});

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const hash = crypto.createHash('md5').update(password || '').digest('hex');
  if (username === 'admin' && hash === 'e2b6a4e1e0a2c9e7f8b4d6c3a9f1b8c0') {
    return res.json({ success: true, token: 'admin_md5_token' });
  }
  return res.json({ success: false, message: 'Invalid credentials' });
});

export default router;
