import { Router, Request, Response } from 'express';

const router = Router();

router.get('/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type } = req.query;
  if (!client_id || !redirect_uri) {
    return res.status(400).json({ error: 'Missing required OAuth parameters' });
  }
  const code = Math.random().toString(36).substring(2, 15);
  res.json({
    message: 'OAuth authorization code generated (no state parameter - vulnerable to CSRF)',
    code,
    client_id,
    redirect_uri,
    missing_state: true,
    warning: 'No state parameter means an attacker can swap authorization codes',
  });
});

router.post('/token', (req: Request, res: Response) => {
  const { code, client_id } = req.body;
  if (!code || !client_id) return res.status(400).json({ error: 'Missing parameters' });
  const accessToken = Math.random().toString(36).substring(2);
  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
  });
});

export default router;
