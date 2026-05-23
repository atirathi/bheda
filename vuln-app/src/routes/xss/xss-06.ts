import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';

const upload = multer({ dest: '/tmp/uploads/' });

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html><head><title>SVG Upload</title></head><body>
<h1>Upload SVG Image</h1>
<form method="POST" enctype="multipart/form-data">
<input type="file" name="image" accept=".svg,.png,.jpg">
<button>Upload</button>
</form>
</body></html>`;
  res.type('html').send(html);
});

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded');
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.svg') {
      const fs = require('fs');
      const content = fs.readFileSync(file.path, 'utf8');
      return res.type('html').send(`<h1>SVG Rendered</h1><div>${content}</div>`);
    }
    const metadata = await sharp(file.path).metadata();
    return res.json({ message: 'Image uploaded', format: metadata.format, size: metadata.size });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
