import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import http from 'http';
import { initDb } from './services/db';
import { errorHandler } from './middleware/error_handler';
import { initWebSocket } from './routes/ws/index';

import sqliRouter from './routes/sqli/index';
import xssRouter from './routes/xss/index';
import ssrfRouter from './routes/ssrf/index';
import jwtRouter from './routes/jwt/index';
import sstiRouter from './routes/ssti/index';
import xxeRouter from './routes/xxe/index';
import deserRouter from './routes/deser/index';
import raceRouter from './routes/race/index';
import oauthRouter from './routes/oauth/index';
import gqlRouter from './routes/gql/index';
import wsRouter from './routes/ws/index';
import wasmRouter from './routes/wasm/index';
import cryptoRouter from './routes/crypto/index';
import bizRouter from './routes/biz/index';
import infraRouter from './routes/infra/index';
import wafRouter from './routes/waf/index';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['*'],
  exposedHeaders: ['*'],
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  dnsPrefetchControl: false,
  frameguard: false,
  hidePoweredBy: false,
  hsts: false,
  ieNoOpen: false,
  noSniff: false,
  permittedCrossDomainPolicies: false,
  referrerPolicy: false,
  xssFilter: false,
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text({ limit: '10mb', type: 'text/xml' }));
app.use(cookieParser());

// Liveness probe — the compose healthcheck hits GET /health. Without
// this route curl -f gets a 404 and the container is flagged unhealthy.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Bheda Vulnerable Application',
    version: '1.0.0',
    description: 'Intentionally vulnerable Express.js app for security testing',
    docs: '/api/v1',
    challenges: {
      sqli: '/api/v1/sqli',
      xss: '/api/v1/xss',
      ssrf: '/api/v1/ssrf',
      jwt: '/api/v1/jwt',
      ssti: '/api/v1/ssti',
      xxe: '/api/v1/xxe',
      deser: '/api/v1/deser',
      race: '/api/v1/race',
      oauth: '/api/v1/oauth',
      gql: '/api/v1/gql',
      ws: '/ws',
      wasm: '/api/v1/wasm',
      crypto: '/api/v1/crypto',
      biz: '/api/v1/biz',
      infra: '/api/v1/infra',
      waf: '/api/v1/waf',
    }
  });
});

app.use('/api/v1/sqli', sqliRouter);
app.use('/api/v1/xss', xssRouter);
app.use('/api/v1/ssrf', ssrfRouter);
app.use('/api/v1/jwt', jwtRouter);
app.use('/api/v1/ssti', sstiRouter);
app.use('/api/v1/xxe', xxeRouter);
app.use('/api/v1/deser', deserRouter);
app.use('/api/v1/race', raceRouter);
app.use('/api/v1/oauth', oauthRouter);
app.use('/api/v1/gql', gqlRouter);
app.use('/api/v1/ws', wsRouter);
app.use('/api/v1/wasm', wasmRouter);
app.use('/api/v1/crypto', cryptoRouter);
app.use('/api/v1/biz', bizRouter);
app.use('/api/v1/infra', infraRouter);
app.use('/api/v1/waf', wafRouter);

app.use(errorHandler);

const server = http.createServer(app);

initWebSocket(server);

async function start() {
  try {
    await initDb();
    console.log('Database initialized');
  } catch (err) {
    console.warn('Database init failed (non-fatal):', (err as Error).message);
  }

  server.listen(PORT, () => {
    console.log(`Bheda Vuln App running on http://localhost:${PORT}`);
    console.log(`GraphQL: http://localhost:${PORT}/api/v1/gql`);
    console.log(`WebSocket: ws://localhost:${PORT}/ws`);
  });
}

start();

export default app;
