import { Router, Request, Response } from 'express';
import WebSocket from 'ws';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const wsUrl = req.query.ws as string;
    if (!wsUrl) return res.status(400).json({ error: 'ws parameter required' });
    const ws = new WebSocket(wsUrl, { timeout: 5000 });
    ws.on('open', () => {
      ws.send('gRPC probe');
    });
    ws.on('message', (data: WebSocket.Data) => {
      ws.close();
      return res.json({ message: 'Response from internal service', data: data.toString() });
    });
    ws.on('error', (err: Error) => {
      return res.status(500).json({ error: err.message });
    });
    setTimeout(() => {
      ws.close();
      return res.json({ message: 'No response from internal service' });
    }, 5000);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
