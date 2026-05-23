import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

const router = Router();

router.post('/review', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const { userId, productId, rating, review } = req.body;
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
    await db.collection('reviews').insertOne({
      userId,
      productId,
      rating,
      review,
      created_at: new Date(),
    });
    const avgResult = await db.collection('reviews').aggregate([
      { $match: { productId } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]).toArray();
    const avgRating = avgResult[0]?.avg || rating;
    await db.collection('products').updateOne({ id: productId }, { $set: { rating: avgRating } });
    return res.json({ success: true, newAverage: avgRating });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
