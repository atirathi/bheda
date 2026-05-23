import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const cookie = req.headers.cookie || '';
  const html = `<!DOCTYPE html>
<html><head><title>Cookie Reflect</title></head><body>
<h1>Your Cookies</h1>
<pre>${cookie}</pre>
</body></html>`;
  res.type('html').send(html);
});

export default router;
