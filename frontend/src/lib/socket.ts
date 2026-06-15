// Native WebSocket client.
//
// The backend exposes a *native* FastAPI WebSocket at
// `/api/v1/ws` (see backend/src/main.py) — NOT a Socket.IO server.
// socket.io-client performs its own EngineIO handshake, which a plain
// WebSocket endpoint rejects, so the connection silently failed. This
// uses the browser's native WebSocket and speaks the same simple
// ping/pong + JSON-message protocol the backend implements.

type MessageHandler = (data: unknown) => void;

let ws: WebSocket | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;
const handlers = new Set<MessageHandler>();

function resolveUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${window.location.host}/api/v1/ws`;
  }
  return 'ws://localhost:8000/api/v1/ws';
}

export function connectSocket(): WebSocket {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return ws;
  }

  ws = new WebSocket(resolveUrl());

  ws.addEventListener('open', () => {
    // Keepalive — the backend replies to {"type":"ping"} with a pong.
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  });

  ws.addEventListener('message', (event) => {
    let data: unknown = event.data;
    try {
      data = JSON.parse(event.data);
    } catch {
      // leave as raw string
    }
    handlers.forEach((h) => h(data));
  });

  ws.addEventListener('close', () => {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  });

  return ws;
}

export function onMessage(handler: MessageHandler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export function disconnectSocket(): void {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
  if (ws && ws.readyState !== WebSocket.CLOSED) {
    ws.close();
  }
  ws = null;
}
