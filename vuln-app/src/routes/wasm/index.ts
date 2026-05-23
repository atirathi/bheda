import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import wasm01 from './wasm-01';
import wasm02 from './wasm-02';
import wasm03 from './wasm-03';

const router = Router();

router.use('/01', challengeChecker('wasm-01'), wasm01);
router.use('/02', challengeChecker('wasm-02'), wasm02);
router.use('/03', challengeChecker('wasm-03'), wasm03);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'wasm-01: WASM buffer read',
      'wasm-02: WASM import injection',
      'wasm-03: WASM buffer overflow',
    ]
  });
});

export default router;
