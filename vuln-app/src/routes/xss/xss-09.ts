import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const callback = req.query.callback as string || 'callback';
  const data = { message: 'Hello from JSONP endpoint' };
  res.type('application/javascript');
  res.send(`${callback}(${JSON.stringify(data)})`);
});

export default router;
