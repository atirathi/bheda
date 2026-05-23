import { Router, Request, Response } from 'express';
import yaml from 'js-yaml';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const yamlStr = req.body.yaml;
    if (!yamlStr) return res.status(400).json({ error: 'yaml string required' });
    const doc = yaml.load(yamlStr);
    return res.json({ parsed: doc, note: 'YAML deserialization can execute arbitrary code' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
