import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

export async function getRedis() {
  if (client && client.isOpen) return client;
  client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  client.on('error', (err: Error) => console.error('Redis error:', err));
  await client.connect();
  return client;
}

export async function cacheGet(key: string): Promise<string | null> {
  try {
    const r = await getRedis();
    return await r.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttl: number = 30) {
  try {
    const r = await getRedis();
    await r.setEx(key, ttl, value);
  } catch {
    // silently fail
  }
}
