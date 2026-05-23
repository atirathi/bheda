import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html><head><title>postMessage Demo</title></head><body>
<h1>postMessage XSS Lab</h1>
<div id="msg"></div>
<script>
window.addEventListener('message', function(e) {
  document.getElementById('msg').innerHTML = e.data;
});
</script>
<p>Send a postMessage to this window to trigger XSS</p>
</body></html>`;
  res.type('html').send(html);
});

export default router;
