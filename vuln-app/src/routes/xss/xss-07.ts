import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const title = req.query.title as string || 'PDF Document';
  const html = `<!DOCTYPE html>
<html><head><title>${title}</title></head><body>
<h1>PDF Preview</h1>
<p>Title: ${title}</p>
<script>
  window.print();
</script>
</body></html>`;
  res.type('html').send(html);
});

export default router;
