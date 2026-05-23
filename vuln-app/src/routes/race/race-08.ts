import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

const router = Router();

router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const { userId, amount } = req.body;
    const user = await db.collection('users').findOne({ id: userId });
    if (!user || (user.balance || 0) < amount) {
      return res.json({ success: false, message: 'Insufficient balance' });
    }
    await db.collection('users').updateOne({ id: userId }, { $inc: { balance: -amount } });
    await db.collection('transactions').insertOne({ userId, type: 'withdraw', amount });
    return res.json({ success: true, message: `Withdrawn: ${amount}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
