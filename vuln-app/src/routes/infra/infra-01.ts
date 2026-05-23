import { Router, Request, Response } from 'express';
import { getRedis } from '../../services/redis';

const router = Router();

router.get('/get', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key) return res.status(400).json({ error: 'key required' });
    const redis = await getRedis();
    const value = await redis.get(key);
    return res.json({ key, value });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/set', async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key || !value) return res.status(400).json({ error: 'key and value required' });
    const redis = await getRedis();
    await redis.set(key, value);
    return res.json({ success: true, message: `Key ${key} set` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/info', async (_req: Request, res: Response) => {
  try {
    const redis = await getRedis();
    const info = await redis.info();
    return res.json({ info: info.substring(0, 2000) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
