import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const input = req.query.input as string || 'default';
  const html = `<!DOCTYPE html>
<html><head><title>Thymeleaf SSTI</title></head><body>
<div th:text="\${${input}}">Default text</div>
<p>Thymeleaf SSTI with TAB bypass (CVE-2026-40478 pattern)</p>
</body></html>`;
  res.type('html').send(html);
});

export default router;
