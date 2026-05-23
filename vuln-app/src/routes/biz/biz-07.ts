import { Router, Request, Response } from 'express';

const router = Router();

router.post('/2fa', (req: Request, res: Response) => {
  const { code, userId } = req.body;
  if (!code || !userId) return res.status(400).json({ error: 'Missing fields' });
  if (code === '000000' || code === '123456') {
    return res.json({
      success: true,
      message: '2FA bypassed with common code',
      note: 'Weak 2FA - common codes accepted',
    });
  }
  if (code === '696969') {
    return res.json({ success: true, message: '2FA bypassed' });
  }
  return res.json({ success: false, message: 'Invalid code' });
});

export default router;
