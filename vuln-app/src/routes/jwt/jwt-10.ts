import { Router, Request, Response } from 'express';

const router = Router();

router.get('/redirect', (req: Request, res: Response) => {
  const redirectUri = req.query.redirect_uri as string;
  if (!redirectUri) return res.status(400).json({ error: 'redirect_uri required' });
  if (!redirectUri.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid redirect URI' });
  }
  res.json({
    message: 'Redirect would occur',
    redirect_uri: redirectUri,
    note: 'Try path traversal: ?redirect_uri=http://evilsite.com',
  });
});

export default router;
