import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const data = req.body.data;
    if (!data) return res.status(400).json({ error: 'data required' });
    const parsed = JSON.parse(JSON.stringify(data), (key, value) => {
      if (typeof value === 'string' && value.startsWith('__proto__.')) {
        const prop = value.replace('__proto__.', '');
        // @ts-ignore
        this[prop] = 'injected';
      }
      return value;
    });
    return res.json({ parsed, note: 'Prototype pollution via JSON reviver' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
