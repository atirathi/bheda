import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    await query(`INSERT INTO users (username, password, email) VALUES ('${username}', 'temp123', '${username}@test.com')`);
    return res.json({ success: true, message: 'User registered' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/admin-panel', async (req: Request, res: Response) => {
  try {
    const username = req.query.username as string;
    if (!username) return res.status(400).json({ error: 'username required' });
    const result = await query(`SELECT * FROM users WHERE username = '${username}'`);
    return res.json({ users: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
