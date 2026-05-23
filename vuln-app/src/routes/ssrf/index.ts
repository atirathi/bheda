import { Router } from 'express';
import { challengeChecker } from '../../middleware/state_checker';
import ssrf01 from './ssrf-01';
import ssrf02 from './ssrf-02';
import ssrf03 from './ssrf-03';
import ssrf04 from './ssrf-04';
import ssrf05 from './ssrf-05';
import ssrf06 from './ssrf-06';
import ssrf07 from './ssrf-07';
import ssrf08 from './ssrf-08';
import ssrf09 from './ssrf-09';
import ssrf10 from './ssrf-10';

const router = Router();

router.use('/01', challengeChecker('ssrf-01'), ssrf01);
router.use('/02', challengeChecker('ssrf-02'), ssrf02);
router.use('/03', challengeChecker('ssrf-03'), ssrf03);
router.use('/04', challengeChecker('ssrf-04'), ssrf04);
router.use('/05', challengeChecker('ssrf-05'), ssrf05);
router.use('/06', challengeChecker('ssrf-06'), ssrf06);
router.use('/07', challengeChecker('ssrf-07'), ssrf07);
router.use('/08', challengeChecker('ssrf-08'), ssrf08);
router.use('/09', challengeChecker('ssrf-09'), ssrf09);
router.use('/10', challengeChecker('ssrf-10'), ssrf10);

router.get('/', (_req, res) => {
  res.json({
    challenges: [
      'ssrf-01: Basic SSRF to cloud metadata',
      'ssrf-02: DNS rebinding SSRF',
      'ssrf-03: SVG xlink:href SSRF',
      'ssrf-04: PDF font fetch SSRF',
      'ssrf-05: OAuth logo_uri SSRF',
      'ssrf-06: XXE to SSRF',
      'ssrf-07: GraphQL introspection SSRF',
      'ssrf-08: WebSocket URI to internal gRPC',
      'ssrf-09: WASM import function SSRF',
      'ssrf-10: Blind SSRF via DNS',
    ]
  });
});

export default router;
