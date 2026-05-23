import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

const router = Router();

router.post('/vote', async (req: Request, res: Response) => {
  try {
    const db = await getMongoDb();
    const { pollId, option } = req.body;
    const poll = await db.collection('polls').findOne({ id: pollId });
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    const update = {};
    // @ts-ignore
    update[`votes.${option}`] = (poll.votes?.[option] || 0) + 1;
    await db.collection('polls').updateOne({ id: pollId }, { $set: update });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
