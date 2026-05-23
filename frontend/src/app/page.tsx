'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Swords,
  Users,
  Trophy,
  Code2,
  Globe,
  Database,
  Lock,
  Server,
  Bug,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

const categoryIcons: Record<string, typeof Shield> = {
  web: Globe,
  crypto: Lock,
  reverse: Code2,
  pwn: Server,
  forensics: Database,
  misc: Bug,
};

const categoryColors: Record<string, string> = {
  web: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  crypto: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  reverse: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  pwn: 'text-red-500 bg-red-500/10 border-red-500/20',
  forensics: 'text-green-500 bg-green-500/10 border-green-500/20',
  misc: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
};

interface HomeStats {
  total_challenges: number;
  active_users: number;
  ctf_active: boolean;
  ctf_participants: number;
  categories: { name: string; slug: string; count: number }[];
}

export default function HomePage() {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<HomeStats>('/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="container py-8 space-y-12">
      <section className="flex flex-col items-center text-center gap-6 py-16">
        <div className="rounded-full bg-bheda-500/10 p-4">
          <Shield className="h-12 w-12 text-bheda-500" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Bheda Vulnerability Lab
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Practice ethical hacking in a safe, legal environment. Solve challenges, compete in CTFs,
          and sharpen your cybersecurity skills.
        </p>
        <div className="flex gap-4">
          <Button size="lg" asChild>
            <Link href="/practice">
              Start Practicing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/ctf">
              <Swords className="mr-2 h-4 w-4" />
              Join CTF
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardHeader className="pb-2">
            <Shield className="mx-auto h-6 w-6 text-bheda-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {isLoading ? '-' : stats?.total_challenges ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Challenges</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardHeader className="pb-2">
            <Users className="mx-auto h-6 w-6 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {isLoading ? '-' : stats?.active_users ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardHeader className="pb-2">
            <Swords className="mx-auto h-6 w-6 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {isLoading ? '-' : stats?.ctf_active ? 'Active' : 'Inactive'}
            </p>
            <p className="text-sm text-muted-foreground">CTF Status</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardHeader className="pb-2">
            <Trophy className="mx-auto h-6 w-6 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {isLoading ? '-' : stats?.ctf_participants ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">CTF Players</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold">Challenge Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-8 w-8 rounded bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-5 w-24 rounded bg-muted" />
                    <div className="mt-1 h-4 w-16 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))
            : (stats?.categories ?? []).map((cat) => {
                const Icon = categoryIcons[cat.slug] ?? Shield;
                const color = categoryColors[cat.slug] ?? 'text-gray-500 bg-gray-500/10 border-gray-500/20';
                return (
                  <Link key={cat.slug} href={`/practice?category=${cat.slug}`}>
                    <Card className="group cursor-pointer transition-all hover:border-bheda-500/50 hover:shadow-md">
                      <CardHeader className="pb-2">
                        <div className={`inline-flex rounded-lg border p-2 ${color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-base capitalize">{cat.name}</CardTitle>
                        <CardDescription>
                          {cat.count} challenge{cat.count !== 1 ? 's' : ''}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <Card className="border-bheda-500/20">
          <CardHeader>
            <Shield className="h-8 w-8 text-bheda-500" />
            <CardTitle className="mt-2">Practice Mode</CardTitle>
            <CardDescription>
              Browse and solve challenges at your own pace. Learn by doing with hints and
              progressive difficulty.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/practice">
                Browse Challenges
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20">
          <CardHeader>
            <Swords className="h-8 w-8 text-purple-500" />
            <CardTitle className="mt-2">CTF Mode</CardTitle>
            <CardDescription>
              Compete with teams in timed Capture The Flag events. Real-time leaderboard and
              team-based scoring.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/ctf">
                View CTF
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
