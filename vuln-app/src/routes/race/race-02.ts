import { Router, Request, Response } from 'express';

const balances: Record<string, number> = {};

const router = Router();

router.post('/transfer', (req: Request, res: Response) => {
  const { from, to, amount } = req.body;
  if (!from || !to || !amount) return res.status(400).json({ error: 'Missing fields' });
  if (!balances[from]) balances[from] = 1000;
  if (!balances[to]) balances[to] = 0;
  if (balances[from] < amount) return res.json({ success: false, message: 'Insufficient funds' });
  balances[from] -= amount;
  balances[to] += amount;
  return res.json({ success: true, balances: { [from]: balances[from], [to]: balances[to] } });
});

router.get('/balance/:user', (req: Request, res: Response) => {
  const user = req.params.user;
  return res.json({ user, balance: balances[user] || 0 });
});

export default router;
