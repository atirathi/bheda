import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const db = await getMongoDb();
  const profiles = await db.collection('profiles').find({}).toArray();
  let html = '<h1>Profiles</h1>';
  for (const p of profiles) {
    html += `<div class="profile"><h3>${p.name}</h3><p>Bio: ${p.bio || ''}</p></div>`;
  }
  html += '<form method="POST" action="/api/v1/xss/05/update"><input name="name" placeholder="Name"><textarea name="bio"></textarea><button>Update Profile</button></form>';
  res.type('html').send(html);
});

router.post('/update', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const { name, bio } = req.body;
    await db.collection('profiles').insertOne({ name, bio, created_at: new Date() });
    return res.redirect('/api/v1/xss/05');
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
