import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const message = req.query.msg as string || 'Hello';
  const html = `<!DOCTYPE html>
<html><head><title>Freemarker SSTI</title></head><body>
<h1>Freemarker Template</h1>
<p>\${${message}}</p>
</body></html>`;
  res.type('html').send(html);
});

export default router;
