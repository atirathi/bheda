'use client';

import { Trophy, Medal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import type { LeaderboardEntry } from '@/store/ctf';

interface ScoreboardTableProps {
  entries: LeaderboardEntry[];
  currentTeamId?: string;
  isLoading?: boolean;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-medium">{rank}</span>;
}

export function ScoreboardTable({ entries, currentTeamId, isLoading }: ScoreboardTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">No scores yet.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead className="text-right">Solved</TableHead>
          <TableHead className="text-right">Last Flag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow
            key={entry.team_id}
            className={cn(
              currentTeamId === entry.team_id && 'bg-primary/5 font-medium'
            )}
          >
            <TableCell>
              <RankBadge rank={entry.rank} />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span>{entry.team_name}</span>
                {currentTeamId === entry.team_id && (
                  <Badge variant="outline" className="text-xs">YOU</Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right font-mono">{entry.score}</TableCell>
            <TableCell className="text-right">{entry.challenges_solved}</TableCell>
            <TableCell className="text-right text-xs text-muted-foreground">
              {entry.last_flag_at ? formatDate(entry.last_flag_at) : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
