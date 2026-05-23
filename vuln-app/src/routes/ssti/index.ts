import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import ssti01 from './ssti-01';
import ssti02 from './ssti-02';
import ssti03 from './ssti-03';
import ssti04 from './ssti-04';
import ssti05 from './ssti-05';
import ssti06 from './ssti-06';

const router = Router();

router.use('/01', challengeChecker('ssti-01'), ssti01);
router.use('/02', challengeChecker('ssti-02'), ssti02);
router.use('/03', challengeChecker('ssti-03'), ssti03);
router.use('/04', challengeChecker('ssti-04'), ssti04);
router.use('/05', challengeChecker('ssti-05'), ssti05);
router.use('/06', challengeChecker('ssti-06'), ssti06);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'ssti-01: Jinja2 SSTI',
      'ssti-02: Pug/Handlebars SSTI',
      'ssti-03: Thymeleaf TAB bypass',
      'ssti-04: Freemarker SSTI',
      'ssti-05: Email template SSTI',
      'ssti-06: PDF template SSTI',
    ]
  });
});

export default router;
