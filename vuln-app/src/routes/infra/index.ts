import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import infra01 from './infra-01';
import infra02 from './infra-02';
import infra03 from './infra-03';
import infra04 from './infra-04';
import infra05 from './infra-05';

const router = Router();

router.use('/01', challengeChecker('infra-01'), infra01);
router.use('/02', challengeChecker('infra-02'), infra02);
router.use('/03', challengeChecker('infra-03'), infra03);
router.use('/04', challengeChecker('infra-04'), infra04);
router.use('/05', challengeChecker('infra-05'), infra05);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'infra-01: Redis exposed',
      'infra-02: Command injection',
      'infra-03: Path traversal',
      'infra-04: Environment leak',
      'infra-05: DB schema leak',
    ]
  });
});

export default router;
