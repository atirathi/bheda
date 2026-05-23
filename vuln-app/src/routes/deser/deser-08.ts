import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const obj = req.body;
    if (obj && obj.__proto__) {
      // @ts-ignore
      Object.prototype.polluted = true;
    }
    // @ts-ignore
    const isPolluted = ({}).polluted === true;
    return res.json({
      parsed: obj,
      prototypePolluted: isPolluted,
      note: 'Prototype pollution via __proto__ in JSON body',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
