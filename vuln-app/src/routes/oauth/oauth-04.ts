import { Router, Request, Response } from 'express';

const router = Router();

router.get('/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type, scope } = req.query;
  const code = Math.random().toString(36).substring(2);
  res.json({
    code,
    scope: scope || 'basic',
    note: 'Scope escalation - try ?scope=admin or ?scope=read_write_delete',
  });
});

export default router;
