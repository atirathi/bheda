import { Router, Request, Response } from 'express';
import Handlebars from 'handlebars';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const template = req.query.template as string || 'Hello {{name}}';
  const compiled = Handlebars.compile(template);
  const result = compiled({ name: 'World' });
  res.type('html').send(`<h1>Handlebars SSTI</h1><div>${result}</div>`);
});

export default router;
