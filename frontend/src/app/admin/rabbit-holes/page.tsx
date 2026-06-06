'use client';

import { useEffect, useState } from 'react';
import { Rabbit, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';

interface RabbitHoleStats {
  total_triggers: number;
  total_challenges: number;
  triggers_today: number;
  unique_users: number;
  enabled: boolean;
  // `recent` may not be present depending on backend version; tolerate absent.
  recent?: Array<{
    challenge_id: string;
    user_id: string;
    path: string;
    created_at: string;
  }>;
}

export default function AdminRabbitHolesPage() {
  const [stats, setStats] = useState<RabbitHoleStats | null>(null);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Backend exposes stats + a single toggle, not a per-rabbit-hole list.
      const data = await api.get<RabbitHoleStats>('/rabbit-holes/stats');
      setStats(data);
      setEnabled(Boolean(data.enabled));
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggle = async (next: boolean) => {
    try {
      await api.patch('/rabbit-holes/toggle');
      // Backend flips the current value; refetch to sync.
      await fetchStats();
    } catch {
      // Revert optimistic state
      setEnabled(!next);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Rabbit className="h-6 w-6" />
            Rabbit Holes
          </h1>
          <p className="text-muted-foreground">
            Misdirection telemetry &mdash; honeypot engagements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={handleToggle} />
            <span className="text-sm text-muted-foreground">enabled</span>
          </div>
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : !stats ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Rabbit className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No telemetry yet</h3>
          <p className="text-sm text-muted-foreground">
            Rabbit hole activity will appear here once users start triggering honeypots.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total triggers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total_triggers ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Triggers today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.triggers_today ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Unique users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.unique_users ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total_challenges ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          {stats.recent && stats.recent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent triggers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.recent.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-mono">{r.path}</span>
                      <span className="text-xs text-muted-foreground">{r.user_id}</span>
                    </div>
                    <Badge variant="secondary">{r.challenge_id}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
