import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseStringPromise } from 'xml2js';

const upload = multer({ dest: '/tmp/uploads/' });

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html><head><title>SVG SSRF</title></head><body>
<h1>SVG xlink:href SSRF</h1>
<form method="POST" enctype="multipart/form-data">
<textarea name="svg" rows="10" cols="50"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<image xlink:href="http://169.254.169.254/latest/meta-data/" width="100" height="100"/>
</svg></textarea>
<button>Render SVG</button>
</form>
</body></html>`;
  res.type('html').send(html);
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const svgContent = req.body.svg || '';
    const result = await parseStringPromise(svgContent);
    return res.json({ parsed: result, note: 'SVG processed - xlink:href could trigger SSRF' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
