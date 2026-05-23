import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import race01 from './race-01';
import race02 from './race-02';
import race03 from './race-03';
import race04 from './race-04';
import race05 from './race-05';
import race06 from './race-06';
import race07 from './race-07';
import race08 from './race-08';

const router = Router();

router.use('/01', challengeChecker('race-01'), race01);
router.use('/02', challengeChecker('race-02'), race02);
router.use('/03', challengeChecker('race-03'), race03);
router.use('/04', challengeChecker('race-04'), race04);
router.use('/05', challengeChecker('race-05'), race05);
router.use('/06', challengeChecker('race-06'), race06);
router.use('/07', challengeChecker('race-07'), race07);
router.use('/08', challengeChecker('race-08'), race08);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'race-01: Coupon stacking race',
      'race-02: Balance transfer race',
      'race-03: Inventory depletion race',
      'race-04: Vote manipulation race',
      'race-05: Auction bid race',
      'race-06: Like counter race',
      'race-07: Signup bonus race',
      'race-08: Withdraw race',
    ]
  });
});

export default router;
