import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

const router = Router();

router.post('/store', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const { data } = req.body;
    await db.collection('json_store').insertOne({ payload: data, created_at: new Date() });
    return res.json({ success: true, message: 'Stored' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/eval', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const stored = await db.collection('json_store').find({}).toArray();
    const results = [];
    for (const item of stored) {
      const cursor = db.collection('users').find(item.payload || {});
      const users = await cursor.toArray();
      if (users.length > 0) results.push({ stored_id: item._id, users });
    }
    return res.json({ results });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
