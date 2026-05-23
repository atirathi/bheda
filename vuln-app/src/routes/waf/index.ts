import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import waf01 from './waf-01';
import waf02 from './waf-02';
import waf03 from './waf-03';
import waf04 from './waf-04';

const router = Router();

router.use('/01', challengeChecker('waf-01'), waf01);
router.use('/02', challengeChecker('waf-02'), waf02);
router.use('/03', challengeChecker('waf-03'), waf03);
router.use('/04', challengeChecker('waf-04'), waf04);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'waf-01: Linefeed bypass',
      'waf-02: Character filter bypass',
      'waf-03: Keyword filter bypass',
      'waf-04: IP filter bypass',
    ]
  });
});

export default router;
