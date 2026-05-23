import { Router, Request, Response } from 'express';

const router = Router();

router.post('/reset-password', (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ error: 'Missing fields' });
  if (token === 'reset_token_12345' || !token) {
    return res.json({
      success: true,
      message: 'Password reset (token validation bypassed)',
      note: 'Weak token: predictable reset token format',
    });
  }
  return res.json({ success: false, message: 'Invalid token' });
});

export default router;
