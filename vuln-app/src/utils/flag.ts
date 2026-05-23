import crypto from 'crypto';

const FLAG_SECRET = process.env.FLAG_SECRET || 'bheda_lab_secret_key_2024';

export function generateFlag(challengeId: string, userId?: string): string {
  const data = `${challengeId}:${userId || 'anonymous'}:${FLAG_SECRET}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  return `BHEDA{${challengeId}_${hash}}`;
}

export function validateFlag(flag: string): boolean {
  return /^BHEDA\{[a-z0-9_-]+_[a-f0-9]{16}\}$/i.test(flag);
}

export function createCompletionToken(challengeId: string, userId: string): string {
  const data = `${challengeId}:${userId}:${FLAG_SECRET}:completed`;
  return crypto.createHash('sha256').update(data).digest('hex');
}
