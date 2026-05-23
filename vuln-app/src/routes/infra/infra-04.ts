import { Router, Request, Response } from 'express';

const router = Router();

const ENV_KEYS = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'DB_PASSWORD', 'SECRET_KEY', 'FLAG'];

router.get('/', (req: Request, res: Response) => {
  const envs: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) {
    envs[key] = process.env[key];
  }
  return res.json({
    message: 'Environment variables leaked',
    env: envs,
    allVars: Object.keys(process.env).slice(0, 30),
    note: 'Sensitive environment variables exposed',
  });
});

export default router;
