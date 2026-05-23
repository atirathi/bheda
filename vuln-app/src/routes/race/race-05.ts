import { Router, Request, Response } from 'express';
import { getMongoDb } from '../../services/db';

let currentAuction: any = null;

const router = Router();

router.post('/bid', async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;
    if (!currentAuction) {
      currentAuction = { highestBid: 0, highestBidder: null };
    }
    if (amount <= currentAuction.highestBid) {
      return res.json({ success: false, message: 'Bid too low' });
    }
    currentAuction.highestBid = amount;
    currentAuction.highestBidder = userId;
    return res.json({ success: true, currentBid: currentAuction.highestBid });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/state', (_req: Request, res: Response) => {
  return res.json(currentAuction || { highestBid: 0, highestBidder: null });
});

export default router;
