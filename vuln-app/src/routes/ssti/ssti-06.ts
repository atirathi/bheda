import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const title = req.query.title as string || 'PDF Report';
  const html = `<!DOCTYPE html>
<html><head><title>${title}</title></head><body>
<h1>${title}</h1>
<p>This PDF was generated from a template</p>
</body></html>`;
  res.type('html').send(html);
});

export default router;
