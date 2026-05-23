import axios from 'axios';
import { cacheGet, cacheSet } from './redis';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function getChallengeState(challengeId: string): Promise<{ enabled: boolean }> {
  const cacheKey = `challenge:state:${challengeId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    const res = await axios.get(`${BACKEND_URL}/api/internal/challenges/${challengeId}/state`, {
      timeout: 3000,
    });
    const state = { enabled: res.data.enabled !== false };
    await cacheSet(cacheKey, JSON.stringify(state), 30);
    return state;
  } catch (err: any) {
    if (err.response && err.response.status === 404) {
      return { enabled: false };
    }
    return { enabled: true };
  }
}
