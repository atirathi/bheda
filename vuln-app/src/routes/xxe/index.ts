import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import xxe01 from './xxe-01';
import xxe02 from './xxe-02';
import xxe03 from './xxe-03';
import xxe04 from './xxe-04';
import xxe05 from './xxe-05';
import xxe06 from './xxe-06';
import xxe07 from './xxe-07';

const router = Router();

router.use('/01', challengeChecker('xxe-01'), xxe01);
router.use('/02', challengeChecker('xxe-02'), xxe02);
router.use('/03', challengeChecker('xxe-03'), xxe03);
router.use('/04', challengeChecker('xxe-04'), xxe04);
router.use('/05', challengeChecker('xxe-05'), xxe05);
router.use('/06', challengeChecker('xxe-06'), xxe06);
router.use('/07', challengeChecker('xxe-07'), xxe07);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'xxe-01: Classic XXE file read',
      'xxe-02: Blind OOB via HTTP',
      'xxe-03: Blind OOB via FTP',
      'xxe-04: SVG XXE',
      'xxe-05: SOAP XXE',
      'xxe-06: DOCX XXE',
      'xxe-07: Config XXE',
    ]
  });
});

export default router;
