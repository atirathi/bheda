import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import xss01 from './xss-01';
import xss02 from './xss-02';
import xss03 from './xss-03';
import xss04 from './xss-04';
import xss05 from './xss-05';
import xss06 from './xss-06';
import xss07 from './xss-07';
import xss08 from './xss-08';
import xss09 from './xss-09';
import xss10 from './xss-10';
import xss11 from './xss-11';
import xss12 from './xss-12';
import xss13 from './xss-13';
import xss14 from './xss-14';
import xss15 from './xss-15';

const router = Router();

router.use('/01', challengeChecker('xss-01'), xss01);
router.use('/02', challengeChecker('xss-02'), xss02);
router.use('/03', challengeChecker('xss-03'), xss03);
router.use('/04', challengeChecker('xss-04'), xss04);
router.use('/05', challengeChecker('xss-05'), xss05);
router.use('/06', challengeChecker('xss-06'), xss06);
router.use('/07', challengeChecker('xss-07'), xss07);
router.use('/08', challengeChecker('xss-08'), xss08);
router.use('/09', challengeChecker('xss-09'), xss09);
router.use('/10', challengeChecker('xss-10'), xss10);
router.use('/11', challengeChecker('xss-11'), xss11);
router.use('/12', challengeChecker('xss-12'), xss12);
router.use('/13', challengeChecker('xss-13'), xss13);
router.use('/14', challengeChecker('xss-14'), xss14);
router.use('/15', challengeChecker('xss-15'), xss15);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'xss-01: Stored XSS in comments',
      'xss-02: Reflected XSS in search',
      'xss-03: DOM XSS via postMessage',
      'xss-04: mXSS via foreign namespace',
      'xss-05: Self-XSS to stored via CSRF',
      'xss-06: SVG upload XSS',
      'xss-07: PDF title injection',
      'xss-08: HTTP header injection XSS',
      'xss-09: CSP bypass via JSONP',
      'xss-10: Client-side template injection (Angular)',
      'xss-11: Cookie reflected XSS',
      'xss-12: PDF export XSS',
      'xss-13: OAuth client_name stored XSS',
      'xss-14: WebSocket message XSS',
      'xss-15: GraphQL error message injection',
    ]
  });
});

export default router;
