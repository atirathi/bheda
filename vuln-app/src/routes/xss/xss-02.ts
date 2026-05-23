import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const search = req.query.q as string || '';
  const html = `<!DOCTYPE html>
<html><head><title>Search</title></head><body>
<h1>Search Results</h1>
<p>You searched for: ${search}</p>
<form><input name="q" placeholder="Search"><button>Go</button></form>
</body></html>`;
  res.type('html').send(html);
});

export default router;
