import { Router, Request, Response } from 'express';

const clients: Record<string, any> = {
  'app1': { client_secret: 'secret1', redirect_uris: ['https://app1.com/callback'] },
};

const router = Router();

router.get('/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type } = req.query;
  const client = clients[client_id as string];
  if (!client) return res.status(400).json({ error: 'Invalid client' });
  if (!client.redirect_uris.includes(redirect_uri as string)) {
    return res.status(400).json({ error: 'Invalid redirect URI' });
  }
  const code = Math.random().toString(36).substring(2);
  const redirectUrl = `${redirect_uri}?code=${code}`;
  res.json({ redirect: redirectUrl, code });
});

router.post('/token', (req: Request, res: Response) => {
  const { code, client_id, client_secret, redirect_uri } = req.body;
  if (clients[client_id]?.client_secret !== client_secret) {
    return res.status(401).json({ error: 'Invalid client credentials' });
  }
  res.json({
    access_token: 'valid_token',
    token_type: 'Bearer',
    expires_in: 3600,
  });
});

export default router;
