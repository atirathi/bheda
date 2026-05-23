import { Router, Request, Response } from 'express';
import fs from 'fs';

const router = Router();

router.get('/read', (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'path required' });
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return res.json({ path: filePath, content });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/ls', (req: Request, res: Response) => {
  const dirPath = req.query.path as string || '.';
  try {
    const files = fs.readdirSync(dirPath);
    return res.json({ path: dirPath, files });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
