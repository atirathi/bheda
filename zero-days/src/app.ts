import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = parseInt(process.env.PORT || "3003", 10);
const VULN_APP_URL = process.env.VULN_APP_URL || "http://vuln-app:3001";
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
// Fail fast on missing API_KEY.  A hardcoded fallback would let any
// caller unlock zero-day challenges without a real shared secret.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY env var is required. Refusing to start without it.");
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan("short"));
app.use(express.json());

const redis = new Redis(REDIS_URL);

// ─── Auth middleware for zero-day routes ───
async function checkUnlock(req: Request, res: Response, next: NextFunction) {
  const zdId = req.params.zdId || req.path.split("/")[2];
  try {
    const unlockKey = `zero-day:unlock:${zdId}`;
    const unlocked = await redis.get(unlockKey);
    if (!unlocked) {
      return res.status(403).json({ error: "Challenge locked", hint: "Complete the prerequisite challenges to unlock this zero-day.", zd_id: zdId });
    }
    next();
  } catch {
    next();
  }
}

// ─── Health ───
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "healthy", service: "zero-days", zero_days: 8 });
});

// ─── Check if a zd challenge is unlocked via backend API ───
async function ensureUnlocked(zdId: string, userId?: string): Promise<boolean> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/internal/zero-day/status?zd_id=${zdId}&user_id=${userId || "anonymous"}`, {
      headers: { "X-API-Key": API_KEY as string },
    });
    if (resp.ok) {
      const data: any = await resp.json();
      return data.unlocked === true;
    }
  } catch {}
  return false;
}

// ─── Flag generation ───
function generateFlag(zdId: string, exploitData: string): string {
  const hash = require("crypto").createHash("sha256").update(`bheda-${zdId}-${exploitData}-${Date.now()}`).digest("hex").slice(0, 16);
  return `flag{${zdId}_${hash}}`;
}

// ─── ZD-001: Unicode Normalization Order (TAB bypass in parser) ───
// Vulnerability: Parser handles tab characters differently than the validator.
// The validator strips tabs, but the parser treats \t as a field separator.
app.post("/zero-day/zd-001/exploit", async (req: Request, res: Response) => {
  const zdId = "zd-001";
  if (!(await ensureUnlocked(zdId, req.body.userId))) {
    return res.status(403).json({ error: "Locked" });
  }

  const { input } = req.body;
  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "input required" });
  }

  // Normalize: strip tabs for validation
  const sanitized = input.replace(/\t/g, "");
  if (sanitized.includes("ADMIN") || sanitized.includes("admin")) {
    return res.status(400).json({ error: "Blocked by validator" });
  }

  // Parser splits on \t, so "USER\tADMIN" becomes ["USER", "ADMIN"]
  const parts = input.split("\t");
  if (parts.length > 1 && (parts[1].toUpperCase() === "ADMIN" || parts[1].toUpperCase() === "ROOT")) {
    const flag = generateFlag(zdId, "tab-bypass");
    await redis.set(`flag:${zdId}`, flag);
    return res.json({ success: true, flag, vulnerability: "unicode-normalization-tab-bypass", detail: "Validator and parser disagree on tab handling" });
  }

  res.status(400).json({ error: "Exploit failed", parsed: parts });
});

// ─── ZD-002: Internal Protocol Injection via Redis Pub/Sub ───
// Vulnerability: Attacker can inject into Redis pub/sub channel to manipulate internal state.
app.post("/zero-day/zd-002/exploit", async (req: Request, res: Response) => {
  const zdId = "zd-002";
  if (!(await ensureUnlocked(zdId, req.body.userId))) {
    return res.status(403).json({ error: "Locked" });
  }

  const { channel, message } = req.body;
  if (!channel || !message) {
    return res.status(400).json({ error: "channel and message required" });
  }

  // Validate channel name starts with internal namespace
  if (!channel.startsWith("internal:")) {
    return res.status(400).json({ error: "Invalid channel" });
  }

  // But we allow redis protocol injection via the message
  // e.g. message could contain newlines to inject additional commands
  const injected = message.includes("\n") || message.includes("\r");
  if (injected) {
    const flag = generateFlag(zdId, "redis-pubsub-injection");
    await redis.publish(channel, message);
    await redis.set(`flag:${zdId}`, flag);
    return res.json({
      success: true,
      flag,
      vulnerability: "internal-protocol-injection",
      detail: "Multi-line message bypasses channel authorization check via Redis pub/sub protocol injection",
      channel,
      injected: true,
    });
  }

  await redis.publish(channel, message);
  res.json({ success: true, message: "Published", injected: false });
});

// ─── ZD-003: Prototype Pollution via deepAssign affecting Axios responses ───
// Vulnerability: A deep object merge utility allows __proto__ pollution.
// When axios processes the response, polluted properties affect application logic.
app.post("/zero-day/zd-003/exploit", async (req: Request, res: Response) => {
  const zdId = "zd-003";
  if (!(await ensureUnlocked(zdId, req.body.userId))) {
    return res.status(403).json({ error: "Locked" });
  }

  const { payload } = req.body;
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "payload object required" });
  }

  // Simulate a deepAssign that's vulnerable to prototype pollution
  function deepAssign(target: any, source: any): any {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepAssign(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  const config: any = { headers: {}, timeout: 5000 };
  try {
    deepAssign(config, payload);
  } catch {
    return res.status(400).json({ error: "Invalid payload" });
  }

  // Check for __proto__ pollution
  const isPolluted = ({} as any).isAdmin === true || ({} as any).role === "admin";
  const pollutedViaConstructor = config.constructor?.prototype?.isAdmin === true;

  if (isPolluted || pollutedViaConstructor) {
    const flag = generateFlag(zdId, "prototype-pollution");
    await redis.set(`flag:${zdId}`, flag);
    return res.json({
      success: true,
      flag,
      vulnerability: "prototype-pollution-deep-assign",
      detail: "Object.prototype.isAdmin set via deepAssign, affecting all objects including Axios response data",
      polluted: true,
    });
  }

  res.json({ success: true, polluted: false, config });
});

// ─── ZD-004: S3 Build Cache Poisoning ───
// Vulnerability: Predictable cache keys allow cache poisoning via race + path traversal
app.post("/zero-day/zd-004/exploit", async (req: Request, res: Response) => {
  const zdId = "zd-004";
  if (!(await ensureUnlocked(zdId, req.body.userId))) {
    return res.status(403).json({ error: "Locked" });
  }

  const { buildId, artifactPath, content } = req.body;
  if (!buildId || !artifactPath || content === undefined) {
    return res.status(400).json({ error: "buildId, artifactPath, and content required" });
  }

  // Cache key is predictable: buildId + ":" + artifactPath
  const cacheKey = `build-cache:${buildId}:${artifactPath}`;

  // Simulate path traversal in cache key
  const hasTraversal = artifactPath.includes("..") || artifactPath.includes("~");
  const isSystemFile = artifactPath.includes("package.json") || artifactPath.includes("app.js") || artifactPath.includes("credentials");

  if (hasTraversal && isSystemFile) {
    await redis.set(cacheKey, content);
    // Simulate that the poisoned cache entry is served to other users
    const poisonedBuildsKey = "build-cache:poisoned";
    await redis.sadd(poisonedBuildsKey, cacheKey);

    const flag = generateFlag(zdId, "cache-poisoning");
    await redis.set(`flag:${zdId}`, flag);
    return res.json({
      success: true,
      flag,
      vulnerability: "s3-build-cache-poisoning",
      detail: "Predictable cache keys + path traversal = build artifact cache poisoned",
      cache_key: cacheKey,
      poisoned: true,
    });
  }

  await redis.set(cacheKey, content);
  res.json({ success: true, cache_key: cacheKey, poisoned: false, hint: "Try path traversal to overwrite system files" });
});

// ─── ZD-005: Three-Weakness Chain (Session Design Flaws) ───
// Vulnerability chain: Predictable session token + missing signature + idor in session store
app.post("/zero-day/zd-005/exploit", async (req: Request, res: Response) => {
  const zdId = "zd-005";
  if (!(await ensureUnlocked(zdId, req.body.userId))) {
    return res.status(403).json({ error: "Locked" });
  }

  const { sessionToken, targetUserId } = req.body;
  if (!sessionToken || !targetUserId) {
    return res.status(400).json({ error: "sessionToken and targetUserId required" });
  }

  // Weakness 1: Predictable token (simple encoding)
  let decoded: any;
  try {
    const decodedStr = Buffer.from(sessionToken, "base64").toString("utf-8");
    decoded = JSON.parse(decodedStr);
  } catch {
    return res.status(400).json({ error: "Invalid token format (expected base64 JSON)" });
  }

  // Weakness 2: Token has no signature verification (alg:none equivalent)
  if (!decoded.userId || !decoded.role) {
    return res.status(400).json({ error: "Token missing required fields" });
  }

  // Weakness 3: No authorization check — can read any user's session
  const isImpersonation = decoded.userId !== targetUserId;
  const isElevated = decoded.role === "admin" || decoded.role === "superadmin";

  if (isImpersonation && (isElevated || true)) {
    const flag = generateFlag(zdId, "session-chain");
    await redis.set(`flag:${zdId}`, flag);
    return res.json({
      success: true,
      flag,
      vulnerability: "three-weakness-session-chain",
      weaknesses: [
        "Predictable session token (base64-encoded JSON)",
        "No signature verification (alg:none attack)",
        "No authorization check on session store (IDOR)",
      ],
      detail: `Impersonated user ${targetUserId} using token for user ${decoded.userId} with role ${decoded.role}`,
    });
  }

  res.json({ success: true, decoded, isImpersonation, note: "Chain not fully exploited. Try elevating privileges and impersonating another user." });
});

// ─── ZD-006: Next.js .rsc Middleware Bypass ───
// Vulnerability: Next.js RSC (React Server Components) endpoint bypasses auth middleware
app.post("/zero-day/zd-006/exploit", async (req: Request, res: Response) => {
  const zdId = "zd-006";
  if (!(await ensureUnlocked(zdId, req.body.userId))) {
    return res.status(403).json({ error: "Locked" });
  }

  const { path, rscPayload } = req.body;
  if (!path) {
    return res.status(400).json({ error: "path required" });
  }

  // Internal RSC endpoints bypass auth middleware
  const isRSCEndpoint = path.includes("_rsc") || path.includes("__rsc") || path.endsWith(".rsc");
  const isInternalPath = path.includes("/internal/") || path.includes("/_next/") || path.includes("/api/admin/");

  if (isRSCEndpoint && isInternalPath) {
    const flag = generateFlag(zdId, "rsc-bypass");
    await redis.set(`flag:${zdId}`, flag);
    return res.json({
      success: true,
      flag,
      vulnerability: "nextjs-rsc-middleware-bypass",
      detail: "Next.js RSC data endpoints skip the auth middleware, allowing direct access to internal APIs",
      rsc_payload: rscPayload || null,
    });
  }

  if (isRSCEndpoint) {
    return res.json({ success: true, note: "RSC path detected but not internal. Try combining with an internal path." });
  }

  res.json({ success: false, hint: "The RSC endpoint pattern is: path/to/_rsc or path/__rsc or path.rsc" });
});

// ─── ZD-007: SQL Expression Engine + Plugin → RCE ───
// Vulnerability: Custom SQL expression engine allows loading arbitrary plugins
app.post("/zero-day/zd-007/exploit", async (req: Request, res: Response) => {
  const zdId = "zd-007";
  if (!(await ensureUnlocked(zdId, req.body.userId))) {
    return res.status(403).json({ error: "Locked" });
  }

  const { expression, pluginName, pluginCode } = req.body;
  if (!expression) {
    return res.status(400).json({ error: "expression required" });
  }

  // The expression engine has a plugin system for custom functions
  // Plugins are loaded dynamically without sandboxing
  const dangerousPatterns = ["require(", "process.", "__dirname", "__filename", "eval(", "Function(", "child_process", "exec(", "spawn("];

  const hasPluginInjection = pluginName && pluginCode;
  const hasExpressionInjection = dangerousPatterns.some((p) => expression.includes(p));

  if (hasPluginInjection) {
    const hasRCE = dangerousPatterns.some((p) => pluginCode.includes(p));
    if (hasRCE) {
      const flag = generateFlag(zdId, "sqle-rce");
      await redis.set(`flag:${zdId}`, flag);
      return res.json({
        success: true,
        flag,
        vulnerability: "sql-expression-engine-plugin-rce",
        detail: "Custom SQL expression engine loads plugins via eval() without sandbox, enabling arbitrary code execution",
        plugin_name: pluginName,
        expression,
      });
    }
  }

  if (hasExpressionInjection) {
    const flag = generateFlag(zdId, "sqle-injection");
    await redis.set(`flag:${zdId}`, flag);
    return res.json({
      success: true,
      flag,
      vulnerability: "sql-expression-engine-injection",
      detail: "Expression engine evaluates user input without sanitization",
    });
  }

  const result = eval(`(function() { return ${expression}; })()`);
  res.json({ success: true, result, hint: "Try injecting Node.js globals or loading a malicious plugin" });
});

// ─── ZD-008: OAuth DCR Metadata → XSS + SSRF Chain ───
// Vulnerability: Dynamic Client Registration allows injecting metadata
// that leads to XSS in the consent page and SSRF in the redirect.
app.post("/zero-day/zd-008/exploit", async (req: Request, res: Response) => {
  const zdId = "zd-008";
  if (!(await ensureUnlocked(zdId, req.body.userId))) {
    return res.status(403).json({ error: "Locked" });
  }

  const { clientName, logoUri, redirectUri, policyUri } = req.body;
  if (!clientName) {
    return res.status(400).json({ error: "clientName required" });
  }

  let exploitChain = 0;
  const details: string[] = [];

  // DCR allows registering arbitrary client metadata
  // Step 1: XSS via client_name or logo_uri
  const hasXSS = /<script|onerror=|onload=|javascript:/i.test(clientName) || /<script|onerror=/i.test(logoUri || "");

  if (hasXSS) {
    exploitChain |= 1;
    details.push("XSS via injected client_name/logo_uri rendered in consent page");
  }

  // Step 2: SSRF via redirect_uri or policy_uri
  const hasSSRF =
    (redirectUri && (redirectUri.startsWith("http://") || redirectUri.includes("localhost") || redirectUri.includes("169.254") || redirectUri.includes("internal"))) ||
    (policyUri && (policyUri.startsWith("http://") || policyUri.includes("internal")));

  if (hasSSRF) {
    exploitChain |= 2;
    details.push("SSRF via redirect_uri/policy_uri pointing to internal services");
  }

  // Step 3: Full chain — XSS to steal token + SSRF to access internal APIs
  if (exploitChain === 3) {
    const flag = generateFlag(zdId, "dcr-xss-ssrf");
    await redis.set(`flag:${zdId}`, flag);
    return res.json({
      success: true,
      flag,
      vulnerability: "oauth-dcr-metadata-chain",
      detail: "Dynamic Client Registration allows metadata injection. XSS in consent page + SSRF via redirect_uri = full chain.",
      chain_steps: details,
    });
  }

  if (exploitChain & 1) {
    return res.json({ success: true, chain_step: "xss", detail: details[0], hint: "Now add an SSRF vector via redirect_uri or policy_uri" });
  }

  if (exploitChain & 2) {
    return res.json({ success: true, chain_step: "ssrf", detail: details[0], hint: "Now add XSS via client_name or logo_uri" });
  }

  res.json({
    success: true,
    registered: { client_id: `dcr-${Math.random().toString(36).slice(2, 10)}`, client_name: clientName },
    hint: "DCR metadata fields client_name, logo_uri, redirect_uri, and policy_uri are unsanitized. Try XSS + SSRF together.",
  });
});

// ─── Unlock endpoint (called by backend after prerequisites met) ───
app.post("/zero-day/unlock", async (req: Request, res: Response) => {
  const { zdId, userId, token } = req.body;
  if (token !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!zdId) {
    return res.status(400).json({ error: "zdId required" });
  }
  const unlockKey = `zero-day:unlock:${zdId}`;
  await redis.set(unlockKey, "true");
  res.json({ success: true, zd_id: zdId, unlocked: true });
});

// ─── Get flag for a solved zero-day ───
app.get("/zero-day/flag/:zdId", async (req: Request, res: Response) => {
  const flag = await redis.get(`flag:${req.params.zdId}`);
  if (!flag) {
    return res.status(404).json({ error: "Flag not found. Solve the challenge first." });
  }
  res.json({ zd_id: req.params.zdId, flag });
});

// Catch-all
app.all("*", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found", available_routes: ["/health", "/zero-day/zd-001/exploit", "/zero-day/zd-002/exploit", "/zero-day/zd-003/exploit", "/zero-day/zd-004/exploit", "/zero-day/zd-005/exploit", "/zero-day/zd-006/exploit", "/zero-day/zd-007/exploit", "/zero-day/zd-008/exploit", "/zero-day/unlock", "/zero-day/flag/:zdId"] });
});

app.listen(PORT, () => {
  console.log(`[zero-days] listening on :${PORT}`);
  console.log(`  8 zero-day vulnerabilities loaded`);
});

export default app;
