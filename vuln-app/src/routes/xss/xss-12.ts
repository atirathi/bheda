import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const content = req.query.content as string || 'Hello World';
  const html = `<!DOCTYPE html>
<html><head><title>PDF Export</title></head><body>
<div class="content">${content}</div>
<script>
  window.print();
  // In real scenario, this would generate a PDF
</script>
</body></html>`;
  res.type('html').send(html);
});

export default router;
