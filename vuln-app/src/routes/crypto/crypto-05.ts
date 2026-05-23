import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const seed = parseInt(req.query.seed as string || '12345');
  const rng = crypto.createHash('md5').update(String(seed)).digest();
  const random1 = rng.readUInt32BE(0);
  const random2 = crypto.createHash('md5').update(Buffer.concat([rng, Buffer.from('1')])).digest().readUInt32BE(0);
  res.json({
    seed,
    random_numbers: [random1, random2],
    note: 'Predictable RNG based on MD5 of seed',
  });
});

export default router;
