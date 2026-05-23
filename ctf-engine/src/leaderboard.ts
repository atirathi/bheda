import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { io as SocketIOClient } from "socket.io-client";
import Redis from "ioredis";
import axios from "axios";

const PORT = parseInt(process.env.PORT || "3005", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";
const API_KEY = process.env.API_KEY || "bheda-internal-api-key-2026";

const redis = new Redis(REDIS_URL);
const pubSub = new Redis(REDIS_URL);

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan("short"));
app.use(express.json());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ─── Connect to backend WebSocket for events ───
let backendSocket: ReturnType<typeof SocketIOClient> | null = null;

function connectToBackend() {
  const wsUrl = BACKEND_URL.replace(/^http/, "ws") + "/api/v1/ws";

  try {
    backendSocket = SocketIOClient(wsUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 5000,
    });

    backendSocket.on("connect", () => {
      console.log(`[leaderboard] Connected to backend WebSocket: ${wsUrl}`);
      backendSocket!.emit("subscribe", { channel: "leaderboard" });
    });

    backendSocket.on("leaderboard_update", (data: any) => {
      console.log("[leaderboard] Received update from backend:", data.event_id);
      io.emit("leaderboard_update", data);
    });

    backendSocket.on("disconnect", (reason: string) => {
      console.log(`[leaderboard] Disconnected from backend: ${reason}`);
    });

    backendSocket.on("connect_error", (err: Error) => {
      console.error(`[leaderboard] Backend WS error: ${err.message}`);
    });
  } catch (err) {
    console.error(`[leaderboard] Failed to connect to backend WS:`, err);
  }
}

// ─── Subscribe to Redis pub/sub for scoring engine updates ───
pubSub.psubscribe("ctf:leaderboard:updates:*");
pubSub.on("pmessage", (_pattern: string, channel: string, message: string) => {
  try {
    const data = JSON.parse(message);
    const eventId = channel.split(":").pop();
    console.log(`[leaderboard] Redis update for event ${eventId}`);

    // Broadcast to all clients in this event room
    if (eventId) {
      io.to(`event:${eventId}`).emit("leaderboard_update", data);
    }

    // Also broadcast globally
    io.emit("leaderboard_update", data);
  } catch (err) {
    console.error("[leaderboard] Failed to parse Redis message:", err);
  }
});

// ─── REST endpoints ───
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "ctf-leaderboard",
    connections: io.engine.clientsCount,
    backend_connected: backendSocket?.connected || false,
  });
});

app.get("/api/leaderboard/:eventId", async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    // Try cache first
    const cached = await redis.get(`ctf:leaderboard:${eventId}`);
    if (cached) {
      return res.json({ event_id: eventId, source: "cache", data: JSON.parse(cached) });
    }

    // Fetch from scoring engine
    const resp = await axios.get(`${BACKEND_URL}/api/v1/leaderboard?event_id=${eventId}`, {
      headers: { "X-API-Key": API_KEY },
      timeout: 5000,
    });
    res.json({ event_id: eventId, source: "backend", data: resp.data });
  } catch {
    res.json({ event_id: eventId, source: "error", data: [] });
  }
});

app.get("/api/leaderboard/:eventId/stream", (req: Request, res: Response) => {
  const { eventId } = req.params;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent({ type: "connected", event_id: eventId });

  const subscriber = new Redis(REDIS_URL);
  const channel = `ctf:leaderboard:updates:${eventId}`;

  subscriber.subscribe(channel, (err) => {
    if (err) {
      sendEvent({ type: "error", message: "Failed to subscribe" });
      res.end();
    }
  });

  subscriber.on("message", (ch: string, message: string) => {
    if (ch === channel) {
      try {
        sendEvent(JSON.parse(message));
      } catch {}
    }
  });

  req.on("close", () => {
    subscriber.unsubscribe(channel);
    subscriber.quit();
  });
});

// ─── Socket.IO ───
io.on("connection", (socket) => {
  console.log(`[leaderboard] Client connected: ${socket.id}`);

  socket.on("subscribe", (data: { event_id?: string }) => {
    if (data.event_id) {
      socket.join(`event:${data.event_id}`);
      console.log(`[leaderboard] ${socket.id} joined event:${data.event_id}`);
    }
  });

  socket.on("unsubscribe", (data: { event_id?: string }) => {
    if (data.event_id) {
      socket.leave(`event:${data.event_id}`);
    }
  });

  socket.on("disconnect", (reason: string) => {
    console.log(`[leaderboard] Client disconnected: ${socket.id} (${reason})`);
  });
});

// ─── Start server ───
httpServer.listen(PORT, () => {
  console.log(`[ctf-leaderboard] listening on :${PORT}`);
  connectToBackend();
});

export default app;
