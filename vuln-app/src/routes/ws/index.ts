import { Router, Request, Response } from 'express';
import { WebSocketServer, WebSocket as WS } from 'ws';
import { IncomingMessage } from 'http';
import { Server as HttpServer } from 'http';

let wss: WebSocketServer | null = null;

export function initWebSocket(server: HttpServer) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WS, req: IncomingMessage) => {
    const token = new URL(req.url || '', 'http://localhost').searchParams.get('token');
    console.log(`WS client connected, token: ${token}`);

    ws.on('message', (data: Buffer) => {
      const message = data.toString();
      console.log('WS received:', message);

      wss?.clients.forEach(client => {
        if (client.readyState === WS.OPEN) {
          client.send(`Echo: ${message}`);
        }
      });
    });

    ws.send('Connected to Bheda WebSocket server');
  });
}

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'WebSocket endpoint at ws://host/ws',
    clients: wss?.clients.size || 0,
  });
});

export default router;
