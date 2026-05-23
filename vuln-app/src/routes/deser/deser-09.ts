import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const input = req.body.input;
    if (!input) return res.status(400).json({ error: 'input string required' });
    const parsed = JSON.parse(input);
    return res.json({ parsed, note: 'JSON parsing - try prototype pollution via __proto__' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
