import { Router, Request, Response } from 'express';

const router = Router();

router.get('/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type, state } = req.query;
  const code = Math.random().toString(36).substring(2, 15);
  const redirectUrl = `${redirect_uri}?code=${code}${state ? `&state=${state}` : ''}`;
  res.json({
    message: 'Would redirect to: ' + redirectUrl,
    code,
    redirect_uri,
    note: 'Open redirect via redirect_uri manipulation',
  });
});

export default router;
