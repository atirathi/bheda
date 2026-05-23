import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

const router = Router();

router.post('/transfer', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const { from, to, amount } = req.body;
    if (amount < 0) {
      return res.status(400).json({ error: 'Amount cannot be negative' });
    }
    const fromUser = await db.collection('users').findOne({ id: from });
    if (!fromUser || (fromUser.balance || 0) < amount) {
      return res.json({ success: false, message: 'Insufficient funds' });
    }
    await db.collection('users').updateOne({ id: from }, { $inc: { balance: -amount } });
    await db.collection('users').updateOne({ id: to }, { $inc: { balance: amount } });
    const updated = await db.collection('users').findOne({ id: from });
    return res.json({ success: true, from_balance: updated?.balance || 0 });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
