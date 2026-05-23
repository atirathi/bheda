import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCvss(score: number): string {
  return score.toFixed(1);
}

export function cvssSeverity(score: number): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 0) return 'none';
  if (score < 4) return 'low';
  if (score < 7) return 'medium';
  if (score < 9) return 'high';
  return 'critical';
}

export function difficultyColor(difficulty: string): string {
  const map: Record<string, string> = {
    easy: 'text-green-500 bg-green-500/10 border-green-500/20',
    medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    hard: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    insane: 'text-red-500 bg-red-500/10 border-red-500/20',
  };
  return map[difficulty?.toLowerCase()] ?? 'text-gray-500 bg-gray-500/10 border-gray-500/20';
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    solved: 'text-green-500 bg-green-500/10 border-green-500/20',
    unsolved: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    locked: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
    active: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  };
  return map[status?.toLowerCase()] ?? 'text-gray-500 bg-gray-500/10 border-gray-500/20';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
