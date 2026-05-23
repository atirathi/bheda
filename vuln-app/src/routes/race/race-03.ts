import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

const router = Router();

router.post('/purchase', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const { userId, productId, quantity } = req.body;
    const product = await db.collection('products').findOne({ id: productId });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.stock < quantity) return res.json({ success: false, message: 'Insufficient stock' });
    await db.collection('products').updateOne({ id: productId }, { $inc: { stock: -quantity } });
    await db.collection('orders').insertOne({ userId, productId, quantity, total: product.price * quantity });
    return res.json({ success: true, total: product.price * quantity });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
