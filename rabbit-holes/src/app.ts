import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import Redis from "ioredis";

const app = express();
const PORT = parseInt(process.env.PORT || "3002", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const HONEYPOT_ROLE = process.env.HONEYPOT_ROLE || "";

app.use(helmet());
app.use(cors());
app.use(morgan("short"));
app.use(express.json());

const redis = new Redis(REDIS_URL);

// ─── Honeypot Mode ───
if (HONEYPOT_ROLE) {
  const rolePorts: Record<string, number> = {
    payment: 3010,
    "user-sync": 3011,
    dashboard: 3012,
    "legacy-api": 3013,
  };

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "healthy", role: HONEYPOT_ROLE });
  });

  app.all("*", (req: Request, res: Response) => {
    const roleHandlers: Record<string, () => void> = {
      payment: () =>
        res.json({
          transaction_id: "txn_" + Math.random().toString(36).slice(2, 10),
          amount: 49.99,
          currency: "USD",
          status: "completed",
          card_last4: "4242",
          timestamp: new Date().toISOString(),
        }),
      "user-sync": () =>
        res.json({
          sync_batch: "batch_" + Date.now(),
          users_processed: Math.floor(Math.random() * 1000),
          conflicts: 0,
          status: "synced",
        }),
      dashboard: () =>
        res.json({
          active_users: Math.floor(Math.random() * 500),
          total_requests: Math.floor(Math.random() * 100000),
          uptime: `${Math.floor(process.uptime())}s`,
          version: "3.2.1-rc4",
        }),
      "legacy-api": () =>
        res.json({
          endpoint: req.path,
          method: req.method,
          api_version: "v1 (deprecated)",
          notice: "This API version is scheduled for removal on 2025-01-01",
          data: { mock: true, timestamp: Date.now() },
        }),
    };
    const handler = roleHandlers[HONEYPOT_ROLE];
    if (handler) handler();
    else res.status(404).json({ error: "Not found" });
  });

  app.listen(PORT, () => {
    console.log(`[honeypot:${HONEYPOT_ROLE}] listening on :${PORT}`);
  });
}

// ─── Decoy Endpoints (20) ───
const decoys: Record<string, (req: Request) => object> = {
  "/admin": () => ({
    panel: "Admin Dashboard",
    users: 12483,
    pending_reports: 42,
    system_status: "all systems nominal",
    last_backup: "2026-05-21T03:00:00Z",
    session: { user: "admin", role: "administrator", mfa: false },
  }),

  "/api/debug/env": () => ({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://app:secret@internal-db:5432/production",
    AWS_ACCESS_KEY_ID: "AKIA0000000000000000",
    AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY",
    STRIPE_SECRET_KEY: "sk_live_0000000000000000",
  }),

  "/backup/users.sql": () => ({
    dump: [
      "INSERT INTO users VALUES (1, 'admin', '$2a$10$...', 'admin@company.com', TRUE);",
      "INSERT INTO users VALUES (2, 'john.doe', '$2a$10$...', 'john@company.com', FALSE);",
      "INSERT INTO users VALUES (3, 'jane.smith', '$2a$10$...', 'jane@company.com', TRUE);",
    ],
    total_users: 15283,
    dump_date: "2026-05-20",
    note: "This is a simulated dump — no real credentials exposed",
  }),

  "/api/v1/debug": () => ({
    application: "Bheda API",
    version: "2.4.1",
    environment: "staging",
    config: {
      debug_mode: true,
      log_level: "DEBUG",
      enable_profiling: true,
    },
    server: {
      hostname: "api-03.internal",
      ip: "10.0.12.84",
      region: "us-east-1",
    },
  }),

  "/.env": () => ({
    DATABASE_URL: "postgresql://app:secret@localhost:5432/bheda",
    REDIS_URL: "redis://:password@localhost:6379",
    SECRET_KEY: "development-secret-key-do-not-use",
    API_KEY: "dev-api-key-12345",
    MODE: "development",
  }),

  "/api/internal/sync": () => ({
    status: "error",
    message: "Unauthorized — valid API key required",
    docs: "https://internal.docs.bheda.lab/api/sync",
    requested_at: new Date().toISOString(),
  }),

  "/webhook/stripe": () => ({
    webhook_id: "we_00123abcdef",
    type: "payment_intent.succeeded",
    object: "event",
    data: {
      object: {
        id: "pi_00123abcdef",
        amount: 2999,
        currency: "usd",
        status: "succeeded",
        metadata: { order_id: "ORD-20260521-001" },
      },
    },
  }),

  "/api/v1/admin/panel": () => ({
    dashboard: "Admin Area",
    features: [
      { name: "User Management", url: "/api/v1/admin/users", access: "admin" },
      { name: "System Config", url: "/api/v1/admin/config", access: "admin" },
      { name: "Audit Logs", url: "/api/v1/admin/audit", access: "superadmin" },
      { name: "Database Console", url: "/api/v1/admin/db", access: "superadmin" },
    ],
    warnings: ["Deprecated endpoints active", "SSL certificate expiring"],
  }),

  "/api/v1/users": (req: Request) => ({
    users: [
      { id: 1, username: "admin", email: "admin@bheda.lab", role: "admin", mfa_enabled: false },
      { id: 2, username: "developer", email: "dev@bheda.lab", role: "user", mfa_enabled: true },
      { id: 3, username: "analyst", email: "analyst@bheda.lab", role: "user", mfa_enabled: false },
    ],
    query: { role: req.query.role || "all" },
    total: 3,
    page: 1,
  }),

  "/config/credentials.json": () => ({
    database: { host: "db.internal", port: 5432, user: "app_user", password: "P@ssw0rd!" },
    redis: { host: "redis.internal", port: 6379, password: "Str0ngR3d1s!" },
    aws: { access_key: "AKIA0000000000000000", secret_key: "wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY" },
    api_keys: { stripe: "bheda_test_dummy_key_replace_me", github: "bheda_test_dummy_key_replace_me" },
  }),

  "/api/v1/internal/health": () => ({
    status: "healthy",
    uptime: process.uptime(),
    version: "1.0.0",
    services: {
      database: { status: "connected", latency_ms: 3 },
      redis: { status: "connected", latency_ms: 1 },
      storage: { status: "connected", latency_ms: 12 },
    },
    load: { cpu: 0.23, memory: 0.45, connections: 127 },
  }),

  "/api/v1/audit/log": () => ({
    entries: [
      { timestamp: "2026-05-21T10:00:00Z", user: "admin", action: "user.login", ip: "192.168.1.100", status: "success" },
      { timestamp: "2026-05-21T10:05:00Z", user: "admin", action: "config.update", ip: "192.168.1.100", status: "success" },
      { timestamp: "2026-05-21T10:10:00Z", user: "unknown", action: "auth.failed", ip: "10.0.0.50", status: "denied" },
      { timestamp: "2026-05-21T10:15:00Z", user: "developer", action: "challenge.submit", ip: "192.168.1.101", status: "success" },
    ],
    total: 4,
    page: 1,
  }),

  "/logs/access.log": () => ({
    log: [
      '192.168.1.100 - admin [21/May/2026:10:00:00 +0000] "POST /api/v1/auth/login" 200 1234',
      '192.168.1.101 - developer [21/May/2026:10:01:00 +0000] "GET /api/v1/challenges" 200 5678',
      '10.0.0.50 - - [21/May/2026:10:02:00 +0000] "POST /api/v1/auth/login" 401 234',
      '192.168.1.100 - admin [21/May/2026:10:05:00 +0000] "PATCH /api/v1/admin/config" 200 89',
    ],
    total_lines: 4,
    format: "combined",
  }),

  "/api/v1/debug/stacktrace": () => ({
    error: "TypeError: Cannot read property 'toString' of undefined",
    file: "/app/src/services/auth_service.ts:142:23",
    stack: [
      "AuthService.validateToken (src/services/auth_service.ts:142:23)",
      "AuthMiddleware.checkAuth (src/middleware/auth_middleware.ts:56:14)",
      "Server.handleRequest (node_modules/express/lib/router/index.js:284:12)",
      "Server.process_request (node_modules/express/lib/router/index.js:512:5)",
    ],
    request: { method: "GET", url: "/api/v1/admin/users", headers: { authorization: "Bearer ***" } },
  }),

  "/api/v1/.git/config": () => ({
    core: { repositoryformatversion: "0", filemode: "true", bare: "false" },
    remote: {
      origin: {
        url: "git@github.com:atirathi/bheda.git",
        fetch: "+refs/heads/*:refs/remotes/origin/*",
      },
    },
    branch: { main: { remote: "origin", merge: "refs/heads/main" } },
  }),

  "/api/v1/swagger": () => ({
    openapi: "3.0.3",
    info: { title: "Bheda Internal API", version: "2.0.0", description: "Internal API — not for external use" },
    servers: [{ url: "http://api.internal.bheda.lab:8000", description: "Internal" }],
    paths: {
      "/api/v1/internal/flag": { get: { summary: "Retrieve flag", parameters: [{ name: "challenge_id", in: "query" }] } },
      "/api/v1/internal/instance": { post: { summary: "Spawn instance" } },
    },
  }),

  "/api/v1/graphql": (req: Request) => ({
    data: {
      __schema: {
        types: [
          { name: "Query", fields: [{ name: "users" }, { name: "challenges" }, { name: "flags" }, { name: "secrets" }] },
          { name: "Mutation", fields: [{ name: "submitFlag" }, { name: "createUser" }, { name: "deleteUser" }] },
        ],
      },
    },
  }),

  "/api/v1/redis/info": () => ({
    redis_version: "7.0.15",
    uptime_in_seconds: process.uptime(),
    connected_clients: 42,
    used_memory_human: "12.45M",
    db0: { keys: 1283, expires: 245 },
    role: "master",
    keyspace_hits: 45231,
    keyspace_misses: 1234,
  }),

  "/api/v1/k8s/dashboard": () => ({
    cluster: "bheda-production",
    namespace: "default",
    nodes: [
      { name: "node-1", status: "Ready", pods: 23, cpu: "0.45", memory: "0.62" },
      { name: "node-2", status: "Ready", pods: 18, cpu: "0.32", memory: "0.48" },
      { name: "node-3", status: "NotReady", pods: 0, cpu: "0.00", memory: "0.00" },
    ],
    secrets: [
      { name: "db-credentials", type: "Opaque", age: "30d" },
      { name: "api-keys", type: "Opaque", age: "15d" },
    ],
  }),

  "/api/v1/cloud/metadata": () => ({
    instance: {
      id: "i-0a1b2c3d4e5f67890",
      type: "t3.large",
      region: "us-east-1",
      az: "us-east-1a",
      private_ip: "10.0.12.84",
      public_ip: "54.123.45.67",
    },
    account: { id: "123456789012", alias: "bheda-prod" },
    security_groups: ["sg-allow-all-internal", "sg-web-external"],
    iam_role: "BhedaInstanceRole",
    user_data: "#!/bin/bash\necho 'secure deployment'",
  }),
};

// ─── Dead-End Chains (8) ───
interface DeadEndChain {
  name: string;
  description: string;
  steps: { path: string; hint: string; response: object }[];
}

const deadEndChains: DeadEndChain[] = [
  {
    name: "The Vault",
    description: "Follow the breadcrumbs to the vault. Or not.",
    steps: [
      { path: "/vault/hint", hint: "Check the source", response: { clue: "<!-- vault_key = 'alpha-omega' -->" } },
      { path: "/vault/key/alpha-omega", hint: "Decode base64", response: { encoded: "ZGVjb2RlX21l" } },
      { path: "/vault/decode/decode_me", hint: "Now what?", response: { secret: "The vault is empty. Always has been." } },
    ],
  },
  {
    name: "The Pipeline",
    description: "A CI/CD pipeline with too many secrets.",
    steps: [
      { path: "/pipeline/env", hint: "Check build artifacts", response: { BUILD_ID: "42", GIT_COMMIT: "abc123def456" } },
      { path: "/pipeline/artifacts/42", hint: "Extract the token", response: { token: "ghp_00000000000000000000000000000000000" } },
      { path: "/pipeline/deploy/ghp_00000000000000000000000000000000000", hint: "Trigger deploy", response: { error: "Token revoked. Nice try." } },
    ],
  },
  {
    name: "The Oracle",
    description: "An ancient oracle that speaks in riddles.",
    steps: [
      { path: "/oracle/riddle", hint: "Answer with '42'", response: { riddle: "What is the answer to life?" } },
      { path: "/oracle/answer/42", hint: "Ask for the flag", response: { prophecy: "You seek a flag that does not exist." } },
    ],
  },
  {
    name: "The Backup",
    description: "Someone left backups accessible.",
    steps: [
      { path: "/backup/list", hint: "Find the latest backup", response: { files: ["db_2026-05-01.sql.gz", "db_2026-05-15.sql.gz", "db_latest.sql.gz"] } },
      { path: "/backup/db_latest.sql.gz", hint: "Extract and search for flag", response: { content: "INSERT INTO flags VALUES ('flag{f4k3_fl4g_f0r_tr41n1ng}');" } },
      { path: "/flag/f4k3_fl4g_f0r_tr41n1ng", hint: "Submit it", response: { error: "Invalid flag. This is a simulation." } },
    ],
  },
  {
    name: "The Tunnel",
    description: "An SSH tunnel to somewhere interesting.",
    steps: [
      { path: "/tunnel/config", hint: "Find the jump host", response: { jump_host: "bastion.bheda.lab", user: "tunnel_user", key_file: "/keys/id_rsa" } },
      { path: "/tunnel/key", hint: "Use the key", response: { private_key: "-----BEGIN RSA PRIVATE KEY-----\nDUMMY_KEY_DATA\n-----END RSA PRIVATE KEY-----" } },
      { path: "/tunnel/connect", hint: "SSH to the internal network", response: { error: "Connection refused. Target does not exist." } },
    ],
  },
  {
    name: "The Dropzone",
    description: "An anonymous file drop with interesting contents.",
    steps: [
      { path: "/dropzone/upload", hint: "Upload a file with the right name", response: { status: "accepting", allowed_types: [".txt", ".csv"] } },
      { path: "/dropzone/files", hint: "Browse uploaded files", response: { files: ["report_q1.pdf", "passwords.txt", "flag.txt"] } },
      { path: "/dropzone/files/flag.txt", hint: "Read the flag", response: { content: "This flag was captured in a 2022 exercise. It is no longer valid." } },
    ],
  },
  {
    name: "The Mirror",
    description: "A dark mirror showing alternate realities.",
    steps: [
      { path: "/mirror/me", hint: "Look at yourself", response: { reflection: { you: "a curious hacker", ip: "127.0.0.1", mission: "find the truth" } } },
      { path: "/mirror/truth", hint: "Peer deeper", response: { truth: "There are 7.2 billion flags in the world. Yours is not special." } },
    ],
  },
  {
    name: "The Echo",
    description: "An echo chamber of API calls.",
    steps: [
      { path: "/echo/request", hint: "Send a request with X-Echo header", response: { instructions: "Set header X-Echo: debug" } },
      { path: "/echo/debug", hint: "Check the response headers", response: { headers: { "X-Debug-Info": "endpoint=/echo/secret", "X-Flag": "flag{3ch0_ch4mb3r_f41nt}" } } },
      { path: "/echo/secret", hint: "Use the debug info", response: { secret: "The echo fades. The trail ends here." } },
    ],
  },
];

// ─── Circular Resources (3) ───
const circularResources = [
  { name: "The Ouroboros", endpoint: "/circular/ouroboros", depth: 0, maxDepth: 5 },
  { name: "Recursive Mirror", endpoint: "/circular/recursive", depth: 0, maxDepth: 5 },
  { name: "The Labyrinth", endpoint: "/circular/labyrinth", depth: 0, maxDepth: 5 },
];

// ─── Routes ───

// Health
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "healthy", service: "rabbit-holes", decoys: Object.keys(decoys).length, chains: deadEndChains.length, uptime: process.uptime() });
});

// Decoy endpoints
for (const [path, handler] of Object.entries(decoys)) {
  app.all(path, (req: Request, res: Response) => {
    const start = Date.now();
    const response = handler(req);
    const elapsed = Date.now() - start;
    res.json({ ...response, _meta: { elapsed_ms: elapsed, simulated: true, hint: "This is a decoy endpoint" } });
  });
}

// Dead-end chains
for (const chain of deadEndChains) {
  for (const step of chain.steps) {
    app.all(step.path, (_req: Request, res: Response) => {
      res.json({
        chain: chain.name,
        step_description: step.hint,
        data: step.response,
        _meta: { chain_progress: "dead_end", note: "This path leads nowhere useful" },
      });
    });
  }
}

// Circular resources
for (const circ of circularResources) {
  app.all(`${circ.endpoint}/:depth?`, (req: Request, res: Response) => {
    const depth = parseInt(req.params.depth || "0", 10);
    if (depth >= circ.maxDepth) {
      res.json({ name: circ.name, depth, message: "You have reached the center. There is nothing here." });
    } else {
      res.json({
        name: circ.name,
        current_depth: depth,
        message: `Deeper... (${depth + 1}/${circ.maxDepth})`,
        next: `${circ.endpoint}/${depth + 1}`,
        _meta: { depth_remaining: circ.maxDepth - depth - 1 },
      });
    }
  });
}

// ─── Deceptive Response Manipulation (16 variants) ───
const deceptiveEndpoints = [
  { path: "/deceptive/redirect", handler: (_req: Request, res: Response) => res.redirect(301, "/api/v1/admin") },
  { path: "/deceptive/redirect-302", handler: (_req: Request, res: Response) => res.redirect(302, "/login?redirect=/api/v1/admin") },
  { path: "/deceptive/cors", handler: (_req: Request, res: Response) => res.header("Access-Control-Allow-Origin", "*").json({ secret: "cors-exposed" }) },
  { path: "/deceptive/cookie", handler: (_req: Request, res: Response) => res.cookie("session", "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifQ.", { httpOnly: false }).json({ cookie_set: true }) },
  { path: "/decessive/reflected-xss", handler: (req: Request, res: Response) => res.send(`<html><body><h1>${req.query.q || "Search"}</h1><p>No results found.</p></body></html>`) },
  { path: "/deceptive/leaked-headers", handler: (_req: Request, res: Response) => res.header("X-Internal-IP", "10.0.0.1").header("X-Debug-Token", "debug-abc-123").json({ ok: true }) },
  { path: "/deceptive/source-map", handler: (_req: Request, res: Response) => res.json({ version: 3, file: "app.js", sources: ["/app/src/secret_config.ts"], mappings: "..." }) },
  { path: "/deceptive/php-info", handler: (_req: Request, res: Response) => res.type("html").send("<html><body><h1>PHP Version 7.4.33</h1><table><tr><td>Server API</td><td>FPM/FastCGI</td></tr></table></body></html>") },
  { path: "/deceptive/ssl-error", handler: (_req: Request, res: Response) => res.status(526).json({ error: "SSL certificate verification failed", code: "SSL_ERROR_BAD_CERT_DOMAIN" }) },
  { path: "/deceptive/basic-auth", handler: (_req: Request, res: Response) => res.status(401).header("WWW-Authenticate", 'Basic realm="Bheda Internal"').json({ error: "Authorization required" }) },
  { path: "/deceptive/rate-limited", handler: (_req: Request, res: Response) => res.status(429).header("Retry-After", "60").json({ error: "Too many requests", retry_after: 60 }) },
  { path: "/deceptive/server-error", handler: (_req: Request, res: Response) => res.status(500).json({ error: "Internal Server Error", trace_id: "trace-001", exception: "NullPointerException: database connection pool exhausted" }) },
  { path: "/deceptive/xml-rpc", handler: (_req: Request, res: Response) => res.type("xml").send('<?xml version="1.0"?><methodResponse><params><param><value><string>XML-RPC is enabled</string></value></param></params></methodResponse>') },
  { path: "/deceptive/xxe-test", handler: (_req: Request, res: Response) => res.type("xml").send('<?xml version="1.0"?><root><data>Entity expansion test: &xxe;</data></root>') },
  { path: "/deceptive/websocket-config", handler: (_req: Request, res: Response) => res.json({ ws_url: "ws://chat.internal.bheda.lab:8080/ws", channel: "internal-admin", auth_required: false }) },
  { path: "/deceptive/graphql-playground", handler: (_req: Request, res: Response) => res.json({ data: { __schema: { queryType: { name: "Query" }, mutationType: { name: "Mutation" } } } }) },
];

for (const ep of deceptiveEndpoints) {
  app.all(ep.path, ep.handler);
}

// Catch-all
app.all("*", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found", hint: "Explore the many paths. They all lead to dead ends." });
});

// ─── Start Server ───
// Skip when running as a honeypot — that mode already bound PORT above,
// and starting again here would bind the same port twice (EADDRINUSE).
if (!HONEYPOT_ROLE) {
  app.listen(PORT, () => {
    console.log(`[rabbit-holes] listening on :${PORT}`);
    console.log(`  decoys: ${Object.keys(decoys).length}`);
    console.log(`  dead-end chains: ${deadEndChains.length}`);
    console.log(`  circular resources: ${circularResources.length}`);
    console.log(`  deceptive endpoints: ${deceptiveEndpoints.length}`);
  });
}

export default app;
