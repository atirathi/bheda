import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const name = req.query.name as string || 'World';
  const html = `<!DOCTYPE html>
<html><head><title>SSTI Jinja2</title></head><body>
<h1>Hello ${name}</h1>
<p>Jinja2 SSTI: Try ?name={{7*7}}</p>
</body></html>`;
  res.type('html').send(html);
});

export default router;
