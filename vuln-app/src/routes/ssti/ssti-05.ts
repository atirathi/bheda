import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { to, subject, body } = req.body;
  const emailBody = `Dear ${to || 'user'},\n\n${body || 'No content'}\n\nRegards,\nAdmin`;
  res.json({
    message: 'Email template rendered (not actually sent)',
    rendered: emailBody,
    note: 'SSTI in email template: try {{7*7}} in body',
  });
});

export default router;
