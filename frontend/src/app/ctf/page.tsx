'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Swords, ArrowRight, Users, Trophy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventTimer } from '@/components/ctf/EventTimer';
import { ScoreboardTable } from '@/components/ctf/ScoreboardTable';
import { Separator } from '@/components/ui/separator';
import { useCTFStore } from '@/store/ctf';
import { formatDate } from '@/lib/utils';

export default function CTFPage() {
  const { event, team, leaderboard, challenges, fetchEvent, fetchTeam, fetchLeaderboard, fetchChallenges, isLoading } =
    useCTFStore();

  useEffect(() => {
    fetchEvent();
    fetchTeam();
    fetchLeaderboard();
    fetchChallenges();
  }, []);

  if (isLoading && !event) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Capture The Flag</h1>
          <p className="text-muted-foreground">
            {event ? event.name : 'No active event'}
          </p>
        </div>
        {!team && event?.is_active && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/ctf/team">Create Team</Link>
            </Button>
          </div>
        )}
      </div>

      {event ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{event.name}</CardTitle>
                    {event.description && (
                      <CardDescription>{event.description}</CardDescription>
                    )}
                  </div>
                  <Badge
                    variant={
                      event.status === 'active'
                        ? 'success'
                        : event.status === 'upcoming'
                        ? 'warning'
                        : 'secondary'
                    }
                  >
                    {event.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start:</span>{' '}
                    {formatDate(event.start_date)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">End:</span>{' '}
                    {formatDate(event.end_date)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Team Size:</span>{' '}
                    {event.max_team_size}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Teams:</span>{' '}
                    {leaderboard.length}
                  </div>
                </div>
              </CardContent>
            </Card>

            {team && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Your Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">Score: {team.score}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/ctf/team">
                        View Team
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  {team.category_scores && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(team.category_scores).map(([cat, score]) => (
                        <div
                          key={cat}
                          className="rounded-lg border bg-muted/50 p-2 text-center"
                        >
                          <p className="text-xs text-muted-foreground capitalize">{cat}</p>
                          <p className="text-sm font-bold">{score}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4" />
                    Leaderboard
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/ctf/leaderboard">
                      Full Leaderboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScoreboardTable
                  entries={leaderboard.slice(0, 5)}
                  currentTeamId={team?.id}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <EventTimer startDate={event.start_date} endDate={event.end_date} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {challenges.slice(0, 5).map((ch) => (
                    <div
                      key={ch.id}
                      className="flex items-center justify-between rounded-lg border p-2 text-sm"
                    >
                      <span className="flex-1 truncate">{ch.title}</span>
                      <Badge
                        variant={ch.solved ? 'success' : 'outline'}
                        className="ml-2 text-xs"
                      >
                        {ch.solved ? 'Solved' : `${ch.points} pts`}
                      </Badge>
                    </div>
                  ))}
                </div>
                {challenges.length > 5 && (
                  <Button variant="ghost" size="sm" className="mt-2 w-full" asChild>
                    <Link href="/ctf/challenges">View all challenges</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {!team && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">Join a Team</CardTitle>
                  <CardDescription>
                    Create or join a team to participate in CTF events.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" asChild>
                    <Link href="/ctf/team">Create Team</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Swords className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No active CTF event</h3>
          <p className="text-sm text-muted-foreground">
            Check back later for upcoming events.
          </p>
        </div>
      )}
    </div>
  );
}
