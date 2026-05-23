import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const reflect = req.query.xss as string || '';
  res.setHeader('X-Reflected', reflect);
  const html = `<!DOCTYPE html>
<html><head><title>Header Reflection</title></head><body>
<h1>Header Reflection</h1>
<p>Check response headers for reflected content</p>
</body></html>`;
  res.type('html').send(html);
});

export default router;
