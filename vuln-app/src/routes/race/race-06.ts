import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

const router = Router();

router.post('/like', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const { postId, userId } = req.body;
    const post = await db.collection('posts').findOne({ id: postId });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const likes = (post.likes || 0) + 1;
    await db.collection('posts').updateOne({ id: postId }, { $set: { likes } });
    return res.json({ success: true, likes });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
