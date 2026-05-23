import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html><head><title>GraphQL Explorer</title></head><body>
<h1>GraphQL Error XSS</h1>
<div id="errors"></div>
<script>
  fetch('/graphql', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query: '{ user(id: "<img src=x onerror=alert(1)>") { id } }'})
  }).then(r => r.json()).then(data => {
    document.getElementById('errors').innerHTML = JSON.stringify(data.errors);
  });
</script>
</body></html>`;
  res.type('html').send(html);
});

export default router;
