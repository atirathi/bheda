import { Router, Request, Response } from 'express';

const router = Router();

router.post('/price-override', (req: Request, res: Response) => {
  const { item, price } = req.body;
  if (!item || !price) return res.status(400).json({ error: 'Missing fields' });
  return res.json({
    success: true,
    message: `Price for ${item} set to ${price}`,
    note: 'Price manipulation - set any price without authorization',
  });
});

export default router;
