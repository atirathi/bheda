import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const db = await getMongoDb();
  const clients = await db.collection('oauth_clients').find({}).toArray();
  let html = '<h1>OAuth Clients</h1><table><tr><th>Name</th><th>Redirect URI</th></tr>';
  for (const c of clients) {
    html += `<tr><td>${c.client_name}</td><td>${c.redirect_uri}</td></tr>`;
  }
  html += '</table>';
  res.type('html').send(html);
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const { client_name, redirect_uri } = req.body;
    await db.collection('oauth_clients').insertOne({
      client_name,
      redirect_uri,
      client_id: Math.random().toString(36).substring(2),
      client_secret: Math.random().toString(36).substring(2),
    });
    return res.redirect('/api/v1/xss/13');
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
