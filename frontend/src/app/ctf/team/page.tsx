'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Plus, LogIn, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamCard } from '@/components/ctf/TeamCard';
import { useCTFStore } from '@/store/ctf';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function TeamPage() {
  const { team, fetchTeam, createTeam, joinTeam, isLoading, error } = useCTFStore();
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    fetchTeam();
  }, []);

  if (team) {
    return (
      <div className="container py-8 space-y-6">
        <Button variant="ghost" asChild className="mb-2">
          <Link href="/ctf">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to CTF
          </Link>
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TeamCard />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>
                      <strong>{m.username}</strong> joined
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(m.joined_at)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/ctf">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to CTF
        </Link>
      </Button>

      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-500" />
            Join a Team
          </h1>
          <p className="text-muted-foreground">
            Create a new team or join an existing one with an invite code.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Tabs defaultValue="create">
          <TabsList className="w-full">
            <TabsTrigger value="create" className="flex-1">
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </TabsTrigger>
            <TabsTrigger value="join" className="flex-1">
              <LogIn className="mr-2 h-4 w-4" />
              Join Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create a new team</CardTitle>
                <CardDescription>
                  Choose a name for your team. You can invite others after creating it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
                <Button
                  className="w-full"
                  disabled={isLoading || !teamName.trim()}
                  onClick={() => createTeam(teamName.trim())}
                >
                  {isLoading ? 'Creating...' : 'Create Team'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle>Join existing team</CardTitle>
                <CardDescription>
                  Enter the invite code shared by your team leader.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
                <Button
                  className="w-full"
                  disabled={isLoading || !inviteCode.trim()}
                  onClick={() => joinTeam(inviteCode.trim())}
                >
                  {isLoading ? 'Joining...' : 'Join Team'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
