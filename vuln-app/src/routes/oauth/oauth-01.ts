import { Router, Request, Response } from 'express';

const router = Router();

router.get('/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type } = req.query;
  const code = Math.random().toString(36).substring(2, 15);
  res.json({
    code,
    client_id,
    redirect_uri,
    message: 'No state parameter - CSRF in OAuth flow',
  });
});

router.post('/token', (req: Request, res: Response) => {
  const { code, client_id, client_secret } = req.body;
  if (code && client_id) {
    return res.json({
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret_token',
      token_type: 'Bearer',
      expires_in: 3600,
    });
  }
  return res.status(400).json({ error: 'Invalid request' });
});

export default router;
