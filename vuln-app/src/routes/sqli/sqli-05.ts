import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const { username, password } = req.body;
    const user = await db.collection('users').findOne({
      username,
      password,
    });
    if (user) {
      return res.json({ success: true, user: { username: user.username, role: user.role } });
    }
    return res.json({ success: false, message: 'Invalid credentials' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
