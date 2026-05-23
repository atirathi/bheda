'use client';

import { useEffect, useState } from 'react';
import { Rabbit, RefreshCw, Activity, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface RabbitHole {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  times_triggered: number;
  teams_affected: number;
  last_triggered_at?: string;
}

export default function AdminRabbitHolesPage() {
  const [rabbitHoles, setRabbitHoles] = useState<RabbitHole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRabbitHoles = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ rabbit_holes: RabbitHole[] }>('/admin/rabbit-holes');
      setRabbitHoles(data.rabbit_holes);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRabbitHoles();
  }, []);

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/rabbit-holes/${id}`, { is_active: isActive });
      setRabbitHoles(
        rabbitHoles.map((r) => (r.id === id ? { ...r, is_active: isActive } : r))
      );
    } catch {
      // silently fail
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
            Manage misdirection and distraction challenges
          </p>
        </div>
        <Button variant="outline" onClick={fetchRabbitHoles}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : rabbitHoles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Rabbit className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No rabbit holes</h3>
          <p className="text-sm text-muted-foreground">
            Create rabbit holes to add misdirection challenges.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rabbitHoles.map((rh) => (
            <Card key={rh.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {rh.name}
                      <Switch
                        checked={rh.is_active}
                        onCheckedChange={(v) => handleToggle(rh.id, v)}
                      />
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rh.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span>Triggered: <strong>{rh.times_triggered}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Teams affected: <strong>{rh.teams_affected}</strong></span>
                  </div>
                  {rh.last_triggered_at && (
                    <span className="text-xs text-muted-foreground">
                      Last trigger: {formatDate(rh.last_triggered_at)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
