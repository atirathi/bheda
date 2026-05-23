'use client';

import { useEffect } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScoreboardTable } from '@/components/ctf/ScoreboardTable';
import { useCTFStore } from '@/store/ctf';
import Link from 'next/link';

export default function LeaderboardPage() {
  const { leaderboard, team, fetchLeaderboard, isLoading } = useCTFStore();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-2">
            <Link href="/ctf">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to CTF
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Real-time rankings updated live
          </p>
        </div>
      </div>

      <ScoreboardTable
        entries={leaderboard}
        currentTeamId={team?.id}
        isLoading={isLoading}
      />
    </div>
  );
}
