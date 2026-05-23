import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import oauth01 from './oauth-01';
import oauth02 from './oauth-02';
import oauth03 from './oauth-03';
import oauth04 from './oauth-04';

const router = Router();

router.use('/01', challengeChecker('oauth-01'), oauth01);
router.use('/02', challengeChecker('oauth-02'), oauth02);
router.use('/03', challengeChecker('oauth-03'), oauth03);
router.use('/04', challengeChecker('oauth-04'), oauth04);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'oauth-01: Missing state parameter',
      'oauth-02: Open redirect via redirect_uri',
      'oauth-03: Weak redirect URI validation',
      'oauth-04: Scope escalation',
    ]
  });
});

export default router;
