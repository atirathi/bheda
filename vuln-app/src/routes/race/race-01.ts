import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

const router = Router();

router.post('/apply-coupon', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const { userId, couponCode } = req.body;
    const coupon = await db.collection('coupons').findOne({ code: couponCode, used: false });
    if (!coupon) {
      return res.json({ success: false, message: 'Coupon invalid or already used' });
    }
    await db.collection('coupons').updateOne({ _id: coupon._id }, { $set: { used: true } });
    await db.collection('users').updateOne({ id: userId }, { $inc: { balance: coupon.value } });
    return res.json({ success: true, message: `Coupon applied: +${coupon.value}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
