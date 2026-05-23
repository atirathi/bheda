import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.post('/order', async (req: Request, res: Response) => {
  try {
    const { productId, quantity, userId } = req.body;
    const product = await query(`SELECT * FROM products WHERE id = ${productId}`);
    if (!product.rows.length) return res.status(404).json({ error: 'Product not found' });
    const total = product.rows[0].price * quantity;
    if (total < 0) {
      return res.json({ success: true, message: 'Negative total - free money!', total });
    }
    return res.json({ success: true, total, product: product.rows[0].name, quantity });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
