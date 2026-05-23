import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

const FIXED_IV = crypto.randomBytes(16);

router.post('/encrypt', (req: Request, res: Response) => {
  const { plaintext } = req.body;
  if (!plaintext) return res.status(400).json({ error: 'plaintext required' });
  const cipher = crypto.createCipheriv('aes-128-cbc', crypto.randomBytes(16), FIXED_IV);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  res.json({ encrypted, iv: FIXED_IV.toString('hex'), note: 'Fixed IV allows CBC bit-flipping attacks' });
});

router.post('/decrypt', (req: Request, res: Response) => {
  const { ciphertext } = req.body;
  if (!ciphertext) return res.status(400).json({ error: 'ciphertext required' });
  const decipher = crypto.createDecipheriv('aes-128-cbc', crypto.randomBytes(16), FIXED_IV);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  res.json({ decrypted });
});

export default router;
