import { Router, Request, Response } from 'express';

const router = Router();

const coupons: Record<string, number> = {
  'WELCOME10': 10,
  'SAVE20': 20,
  'FREESHIP': 5,
};

router.post('/apply', (req: Request, res: Response) => {
  const { code, cartTotal } = req.body;
  if (!code || !cartTotal) return res.status(400).json({ error: 'Missing fields' });
  if (coupons[code] !== undefined) {
    const discount = coupons[code];
    if (cartTotal - discount < 0) {
      return res.json({ success: true, message: 'Negative total via coupon stacking', finalTotal: cartTotal - discount });
    }
    return res.json({ success: true, discount, finalTotal: cartTotal - discount });
  }
  return res.json({ success: false, message: 'Invalid coupon' });
});

export default router;
