import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import deser01 from './deser-01';
import deser02 from './deser-02';
import deser03 from './deser-03';
import deser04 from './deser-04';
import deser05 from './deser-05';
import deser06 from './deser-06';
import deser07 from './deser-07';
import deser08 from './deser-08';
import deser09 from './deser-09';

const router = Router();

router.use('/01', challengeChecker('deser-01'), deser01);
router.use('/02', challengeChecker('deser-02'), deser02);
router.use('/03', challengeChecker('deser-03'), deser03);
router.use('/04', challengeChecker('deser-04'), deser04);
router.use('/05', challengeChecker('deser-05'), deser05);
router.use('/06', challengeChecker('deser-06'), deser06);
router.use('/07', challengeChecker('deser-07'), deser07);
router.use('/08', challengeChecker('deser-08'), deser08);
router.use('/09', challengeChecker('deser-09'), deser09);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'deser-01: Python pickle',
      'deser-02: Node.js JSON.parse reviver',
      'deser-03: YAML deserialization',
      'deser-04: Java deserialization',
      'deser-05: PHP deserialization',
      'deser-06: XMLDecoder',
      'deser-07: .NET deserialization',
      'deser-08: Prototype pollution',
      'deser-09: JSON5 parsing',
    ]
  });
});

export default router;
