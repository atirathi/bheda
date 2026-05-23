import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import Redis from "ioredis";
import Docker from "dockerode";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = parseInt(process.env.PORT || "3004", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";
const API_KEY = process.env.API_KEY || "bheda-internal-api-key-2026";

app.use(helmet());
app.use(cors());
app.use(morgan("short"));
app.use(express.json());

const redis = new Redis(REDIS_URL);
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

const CONTAINER_PREFIX = "bheda-ctf-";
const INSTANCE_MAP_KEY = "ctf:instance-map";
const NETWORK_NAME = "bheda_net";

// ─── Health ───
app.get("/health", async (_req: Request, res: Response) => {
  try {
    const info = await docker.info();
    res.json({ status: "healthy", docker_available: true, swarm: info.Swarm?.LocalNodeState || "inactive" });
  } catch {
    res.json({ status: "degraded", docker_available: false });
  }
});

// ─── Spawn per-team instance ───
app.post("/api/ctf/spawn", async (req: Request, res: Response) => {
  const { event_id, team_id, team_name, challenge_id } = req.body;

  if (!event_id || !team_id || !challenge_id) {
    return res.status(400).json({ error: "event_id, team_id, and challenge_id required" });
  }

  try {
    const containerName = `${CONTAINER_PREFIX}${event_id.slice(0, 8)}-${team_id.slice(0, 8)}`;
    const existing = await redis.hget(INSTANCE_MAP_KEY, `${event_id}:${team_id}:${challenge_id}`);

    if (existing) {
      const container = docker.getContainer(existing);
      try {
        const info = await container.inspect();
        if (info.State.Running) {
          return res.json({ instance_id: existing, container_name: containerName, status: "already_running" });
        }
        await container.remove({ force: true });
      } catch {}
    }

    const container = await docker.createContainer({
      name: containerName,
      Image: "bheda-challenge-base",
      Env: [
        `CHALLENGE_ID=${challenge_id}`,
        `TEAM_ID=${team_id}`,
        `EVENT_ID=${event_id}`,
        `TEAM_NAME=${team_name || "unknown"}`,
        `BACKEND_URL=${BACKEND_URL}`,
        `PORT=3000`,
      ],
      HostConfig: {
        NetworkMode: NETWORK_NAME,
        Memory: 256 * 1024 * 1024,
        NanoCpus: 500000000,
        AutoRemove: true,
        PortBindings: {},
      },
      Labels: {
        "bheda.managed": "true",
        "bheda.event_id": event_id,
        "bheda.team_id": team_id,
        "bheda.challenge_id": challenge_id,
      },
    } as any);

    await (container as any).start();
    const instanceId = (container as any).id;

    await redis.hset(INSTANCE_MAP_KEY, `${event_id}:${team_id}:${challenge_id}`, instanceId);
    await redis.hset(`ctf:instance:${instanceId}`, {
      event_id,
      team_id,
      challenge_id,
      container_name: containerName,
      spawned_at: new Date().toISOString(),
    });

    // Notify backend
    try {
      await fetch(`${BACKEND_URL}/api/internal/instance/spawned`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({ event_id, team_id, challenge_id, instance_id: instanceId, container_name: containerName }),
      });
    } catch {}

    res.status(201).json({ instance_id: instanceId, container_name: containerName, status: "spawned" });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to spawn instance: ${err.message}` });
  }
});

// ─── Teardown per-team instance ───
app.post("/api/ctf/teardown", async (req: Request, res: Response) => {
  const { event_id, team_id, challenge_id, instance_id } = req.body;

  try {
    let instanceId = instance_id;

    if (!instanceId && event_id && team_id) {
      instanceId = await redis.hget(INSTANCE_MAP_KEY, `${event_id}:${team_id}:${challenge_id || "*"}`);
    }

    if (!instanceId) {
      return res.status(404).json({ error: "Instance not found" });
    }

    try {
      const container = docker.getContainer(instanceId);
      await container.stop({ t: 10 });
      await container.remove({ force: true });
    } catch {}

    if (event_id && team_id) {
      await redis.hdel(INSTANCE_MAP_KEY, `${event_id}:${team_id}:${challenge_id || "*"}`);
    }
    await redis.del(`ctf:instance:${instanceId}`);

    // Notify backend
    try {
      await fetch(`${BACKEND_URL}/api/internal/instance/teardown`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({ event_id, team_id, instance_id: instanceId }),
      });
    } catch {}

    res.json({ success: true, instance_id: instanceId, status: "removed" });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to teardown instance: ${err.message}` });
  }
});

// ─── Healthcheck for spawned instances ───
app.get("/api/ctf/instance/:instanceId/health", async (req: Request, res: Response) => {
  const { instanceId } = req.params;

  try {
    const container = docker.getContainer(instanceId);
    const info = await container.inspect();

    let appHealth: string | null = null;
    const ip = info.NetworkSettings?.Networks?.[NETWORK_NAME]?.IPAddress;
    if (ip) {
      try {
        const response = await fetch(`http://${ip}:3000/health`, { signal: AbortSignal.timeout(5000) });
        const data: any = await response.json();
        appHealth = data.status || "unknown";
      } catch {
        appHealth = "unreachable";
      }
    }

    res.json({
      instance_id: instanceId,
      container_status: info.State.Status,
      container_running: info.State.Running,
      ip_address: ip,
      app_health: appHealth,
      labels: info.Config?.Labels || {},
    });
  } catch {
    res.status(404).json({ error: "Instance not found", instance_id: instanceId });
  }
});

// ─── List all running instances ───
app.get("/api/ctf/instances", async (_req: Request, res: Response) => {
  try {
    const containers = await docker.listContainers({
      all: true,
      filters: { label: ["bheda.managed=true"] },
    });

    const instances = await Promise.all(
      containers.map(async (c: any) => {
        const meta = await redis.hgetall(`ctf:instance:${c.Id}`);
        return {
          instance_id: c.Id,
          container_name: c.Names?.[0]?.replace(/^\//, ""),
          status: c.State,
          labels: c.Labels,
          meta,
        };
      })
    );

    res.json({ count: instances.length, instances });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Teardown all instances for an event ───
app.post("/api/ctf/event/:eventId/teardown-all", async (req: Request, res: Response) => {
  const { eventId } = req.params;
  let removed = 0;

  try {
    const keys = await redis.hkeys(INSTANCE_MAP_KEY);
    const relevantKeys = keys.filter((k) => k.startsWith(`${eventId}:`));

    for (const key of relevantKeys) {
      const instanceId = await redis.hget(INSTANCE_MAP_KEY, key);
      if (instanceId) {
        try {
          const container = docker.getContainer(instanceId);
          await container.stop({ t: 10 });
          await container.remove({ force: true });
        } catch {}
        await redis.hdel(INSTANCE_MAP_KEY, key);
        await redis.del(`ctf:instance:${instanceId}`);
        removed++;
      }
    }

    // Also find any remaining containers with this event label
    const containers = await docker.listContainers({
      all: true,
      filters: { label: [`bheda.event_id=${eventId}`] },
    });
    for (const c of containers) {
      try {
        const container = docker.getContainer(c.Id);
        await container.stop({ t: 10 });
        await container.remove({ force: true });
        removed++;
      } catch {}
    }

    res.json({ success: true, event_id: eventId, instances_removed: removed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start server ───
app.listen(PORT, () => {
  console.log(`[ctf-orchestrator] listening on :${PORT}`);
  console.log(`  docker available: ${!!docker}`);
  console.log(`  backend: ${BACKEND_URL}`);
});

export default app;
