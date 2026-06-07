import Redis from "ioredis";
import axios from "axios";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
// Fail fast if API_KEY is missing.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY env var is required. Refusing to start without it.");
}

const redis = new Redis(REDIS_URL);

interface FlagSubmission {
  team_id: string;
  user_id: string;
  challenge_id: string;
  event_id: string;
  correct: boolean;
  timestamp: string;
  attempt_number: number;
}

interface ChallengeConfig {
  points: number;
  difficulty: "easy" | "medium" | "hard" | "expert";
  requires?: string[];
}

interface ScoreResult {
  team_id: string;
  team_name: string;
  base_score: number;
  difficulty_multiplier: number;
  chain_multiplier: number;
  clean_bonus: number;
  total_score: number;
  breakdown: {
    base: number;
    difficulty: string;
    chain_depth: number;
    first_blood: boolean;
  };
}

const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  beginner: 0.5,
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
  expert: 3.0,
};

// ─── Calculate flag score ───
export async function calculateScore(submission: FlagSubmission, challenge: ChallengeConfig): Promise<ScoreResult> {
  const base = challenge.points;
  const diffMult = DIFFICULTY_MULTIPLIERS[challenge.difficulty] || 1.0;

  // Chain depth: how many prerequisites were solved before this one
  let chainDepth = 0;
  if (challenge.requires && challenge.requires.length > 0) {
    const chainKey = `ctf:chain:${submission.event_id}:${submission.team_id}`;
    for (const reqId of challenge.requires) {
      const solved = await redis.sismember(chainKey, reqId);
      if (solved) chainDepth++;
    }
  }
  const chainMult = 1.0 + chainDepth * 0.15;

  // First blood detection
  const firstBloodKey = `ctf:first-blood:${submission.event_id}:${submission.challenge_id}`;
  const isFirstBlood = await redis.setnx(firstBloodKey, submission.team_id) === 1;
  const cleanBonus = isFirstBlood ? 1.5 : 1.0;

  const totalScore = Math.round(base * diffMult * chainMult * cleanBonus);

  // Cache the score
  const scoreKey = `ctf:scores:${submission.event_id}:${submission.team_id}`;
  await redis.hset(scoreKey, submission.challenge_id, totalScore);

  return {
    team_id: submission.team_id,
    team_name: "",
    base_score: base,
    difficulty_multiplier: diffMult,
    chain_multiplier: chainMult,
    clean_bonus: cleanBonus,
    total_score: totalScore,
    breakdown: {
      base,
      difficulty: challenge.difficulty,
      chain_depth: chainDepth,
      first_blood: isFirstBlood,
    },
  };
}

// ─── Recalculate leaderboard ───
export async function recalculateLeaderboard(eventId: string): Promise<any[]> {
  const pattern = `ctf:scores:${eventId}:*`;
  const keys: string[] = [];

  let cursor = "0";
  do {
    const [nextCursor, found] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;
    keys.push(...found);
  } while (cursor !== "0");

  const teamScores: Record<string, { team_id: string; total: number; solved: number; challenges: string[] }> = {};

  for (const key of keys) {
    const teamId = key.split(":").pop()!;
    const entries = await redis.hgetall(key);
    const challenges = Object.keys(entries);
    const total = challenges.reduce((sum, c) => sum + parseInt(entries[c] || "0", 10), 0);

    teamScores[teamId] = {
      team_id: teamId,
      total,
      solved: challenges.length,
      challenges,
    };
  }

  // Fetch team names from backend
  let teamNames: Record<string, string> = {};
  try {
    const resp = await axios.get(`${BACKEND_URL}/api/internal/teams`, {
      headers: { "X-API-Key": API_KEY },
      timeout: 5000,
    });
    if (resp.data && Array.isArray(resp.data)) {
      for (const t of resp.data) {
        teamNames[t.id] = t.name;
      }
    }
  } catch {}

  // Build leaderboard
  const leaderboard = Object.values(teamScores)
    .sort((a, b) => b.total - a.total || a.solved - b.solved)
    .map((entry, index) => ({
      rank: index + 1,
      team_id: entry.team_id,
      team_name: teamNames[entry.team_id] || "Unknown",
      score: entry.total,
      solved: entry.solved,
      challenges: entry.challenges,
    }));

  // Cache leaderboard
  await redis.set(`ctf:leaderboard:${eventId}`, JSON.stringify(leaderboard));

  return leaderboard;
}

// ─── WebSocket broadcast ───
export async function broadcastLeaderboardUpdate(eventId: string): Promise<void> {
  const leaderboard = await recalculateLeaderboard(eventId);

  // Publish to Redis pub/sub for the leaderboard server to pick up
  await redis.publish(
    `ctf:leaderboard:updates:${eventId}`,
    JSON.stringify({ type: "leaderboard_update", event_id: eventId, data: leaderboard, timestamp: new Date().toISOString() })
  );

  // Also notify backend
  try {
    await axios.post(
      `${BACKEND_URL}/api/internal/leaderboard/update`,
      { event_id: eventId, leaderboard },
      { headers: { "Content-Type": "application/json", "X-API-Key": API_KEY }, timeout: 5000 }
    );
  } catch {}
}

// ─── Get cached leaderboard ───
export async function getCachedLeaderboard(eventId: string): Promise<any[] | null> {
  const data = await redis.get(`ctf:leaderboard:${eventId}`);
  return data ? JSON.parse(data) : null;
}

// ─── Handle incoming submission ───
export async function handleSubmission(submission: FlagSubmission, challenge: ChallengeConfig): Promise<{ score: ScoreResult; leaderboard: any[] }> {
  if (!submission.correct) {
    return { score: null as any, leaderboard: [] };
  }

  const score = await calculateScore(submission, challenge);

  // Track solved challenges for chain calculation
  if (submission.event_id && submission.team_id) {
    const chainKey = `ctf:chain:${submission.event_id}:${submission.team_id}`;
    await redis.sadd(chainKey, submission.challenge_id);
  }

  const leaderboard = await recalculateLeaderboard(submission.event_id);

  return { score, leaderboard };
}
