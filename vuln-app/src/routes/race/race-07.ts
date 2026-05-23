import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

const router = Router();

router.post('/signup-bonus', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const { userId } = req.body;
    const user = await db.collection('users').findOne({ id: userId });
    if (user?.bonusClaimed) {
      return res.json({ success: false, message: 'Bonus already claimed' });
    }
    await db.collection('users').updateOne({ id: userId }, { $set: { bonusClaimed: true }, $inc: { balance: 500 } });
    await db.collection('transactions').insertOne({ userId, type: 'signup_bonus', amount: 500 });
    return res.json({ success: true, message: 'Bonus claimed: +500' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
