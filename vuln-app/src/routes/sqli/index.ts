import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import sqli01 from './sqli-01';
import sqli02 from './sqli-02';
import sqli03 from './sqli-03';
import sqli04 from './sqli-04';
import sqli05 from './sqli-05';
import sqli06 from './sqli-06';
import sqli07 from './sqli-07';
import sqli08 from './sqli-08';
import sqli09 from './sqli-09';
import sqli10 from './sqli-10';
import sqli11 from './sqli-11';
import sqli12 from './sqli-12';
import sqli13 from './sqli-13';
import sqli14 from './sqli-14';
import sqli15 from './sqli-15';
import sqli16 from './sqli-16';

const router = Router();

router.use('/01', challengeChecker('sqli-01'), sqli01);
router.use('/02', challengeChecker('sqli-02'), sqli02);
router.use('/03', challengeChecker('sqli-03'), sqli03);
router.use('/04', challengeChecker('sqli-04'), sqli04);
router.use('/05', challengeChecker('sqli-05'), sqli05);
router.use('/06', challengeChecker('sqli-06'), sqli06);
router.use('/07', challengeChecker('sqli-07'), sqli07);
router.use('/08', challengeChecker('sqli-08'), sqli08);
router.use('/09', challengeChecker('sqli-09'), sqli09);
router.use('/10', challengeChecker('sqli-10'), sqli10);
router.use('/11', challengeChecker('sqli-11'), sqli11);
router.use('/12', challengeChecker('sqli-12'), sqli12);
router.use('/13', challengeChecker('sqli-13'), sqli13);
router.use('/14', challengeChecker('sqli-14'), sqli14);
router.use('/15', challengeChecker('sqli-15'), sqli15);
router.use('/16', challengeChecker('sqli-16'), sqli16);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'sqli-01: In-band UNION injection',
      'sqli-02: Blind boolean injection',
      'sqli-03: Blind time-based injection',
      'sqli-04: Second-order injection',
      'sqli-05: NoSQL injection (MongoDB)',
      'sqli-06: JSON field injection',
      'sqli-07: WAF bypass via comment blocks',
      'sqli-08: WAF bypass via HPP',
      'sqli-09: Error-based via EXTRACTVALUE',
      'sqli-10: MSSQL xp_cmdshell simulation',
      'sqli-11: ORDER BY injection',
      'sqli-12: LIMIT injection',
      'sqli-13: Cookie-based injection',
      'sqli-14: User-Agent header injection',
      'sqli-15: GraphQL argument injection',
      'sqli-16: Second-order NoSQL injection',
    ]
  });
});

export default router;
