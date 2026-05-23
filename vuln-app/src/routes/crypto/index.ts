import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import crypto01 from './crypto-01';
import crypto02 from './crypto-02';
import crypto03 from './crypto-03';
import crypto04 from './crypto-04';
import crypto05 from './crypto-05';

const router = Router();

router.use('/01', challengeChecker('crypto-01'), crypto01);
router.use('/02', challengeChecker('crypto-02'), crypto02);
router.use('/03', challengeChecker('crypto-03'), crypto03);
router.use('/04', challengeChecker('crypto-04'), crypto04);
router.use('/05', challengeChecker('crypto-05'), crypto05);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'crypto-01: MD5 passwords',
      'crypto-02: ECB mode',
      'crypto-03: Fixed IV CBC',
      'crypto-04: Weak RSA signature',
      'crypto-05: Predictable RNG',
    ]
  });
});

export default router;
