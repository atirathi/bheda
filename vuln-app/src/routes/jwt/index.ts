import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import jwt01 from './jwt-01';
import jwt02 from './jwt-02';
import jwt03 from './jwt-03';
import jwt04 from './jwt-04';
import jwt05 from './jwt-05';
import jwt06 from './jwt-06';
import jwt07 from './jwt-07';
import jwt08 from './jwt-08';
import jwt09 from './jwt-09';
import jwt10 from './jwt-10';

const router = Router();

router.use('/01', challengeChecker('jwt-01'), jwt01);
router.use('/02', challengeChecker('jwt-02'), jwt02);
router.use('/03', challengeChecker('jwt-03'), jwt03);
router.use('/04', challengeChecker('jwt-04'), jwt04);
router.use('/05', challengeChecker('jwt-05'), jwt05);
router.use('/06', challengeChecker('jwt-06'), jwt06);
router.use('/07', challengeChecker('jwt-07'), jwt07);
router.use('/08', challengeChecker('jwt-08'), jwt08);
router.use('/09', challengeChecker('jwt-09'), jwt09);
router.use('/10', challengeChecker('jwt-10'), jwt10);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'jwt-01: none algorithm accepted',
      'jwt-02: RS256 to HS256 confusion',
      'jwt-03: kid path traversal',
      'jwt-04: jku spoofing',
      'jwt-05: Weak HMAC secret',
      'jwt-06: sub confusion',
      'jwt-07: Expired token accepted',
      'jwt-08: WS upgrade JWT injection',
      'jwt-09: OAuth state missing',
      'jwt-10: Redirect URI path traversal',
    ]
  });
});

export default router;
