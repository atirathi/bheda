import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import biz01 from './biz-01';
import biz02 from './biz-02';
import biz03 from './biz-03';
import biz04 from './biz-04';
import biz05 from './biz-05';
import biz06 from './biz-06';
import biz07 from './biz-07';
import biz08 from './biz-08';

const router = Router();

router.use('/01', challengeChecker('biz-01'), biz01);
router.use('/02', challengeChecker('biz-02'), biz02);
router.use('/03', challengeChecker('biz-03'), biz03);
router.use('/04', challengeChecker('biz-04'), biz04);
router.use('/05', challengeChecker('biz-05'), biz05);
router.use('/06', challengeChecker('biz-06'), biz06);
router.use('/07', challengeChecker('biz-07'), biz07);
router.use('/08', challengeChecker('biz-08'), biz08);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'biz-01: Negative quantity',
      'biz-02: Balance transfer bypass',
      'biz-03: Coupon stacking',
      'biz-04: Rating manipulation',
      'biz-05: Weak password reset',
      'biz-06: Price override',
      'biz-07: 2FA bypass',
      'biz-08: CSV injection',
    ]
  });
});

export default router;
