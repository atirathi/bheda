import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

const RSA_PRIVATE_KEY = crypto.generateKeyPairSync('rsa', {
  modulusLength: 1024,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
}).privateKey;

router.post('/sign', (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  const sign = crypto.createSign('MD5');
  sign.update(message);
  const signature = sign.sign(RSA_PRIVATE_KEY, 'hex');
  res.json({ signature, algorithm: 'MD5withRSA', note: 'MD5 with RSA is vulnerable to collision attacks' });
});

export default router;
