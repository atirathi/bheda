'use client';

import { useEffect, useRef, useState } from 'react';
import { Monitor, AlertTriangle, Shield, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminStore, type MonitorEvent } from '@/store/admin';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const severityConfig = {
  info: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
  warning: { color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  error: { color: 'text-orange-500', bg: 'bg-orange-500/10' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10' },
};

interface MonitorHealth {
  system: { platform?: string; cpu?: number; memory?: number };
  database: { total_users?: number; total_challenges?: number };
  redis: { connected?: boolean };
}

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'waf':
      return <Shield className="h-4 w-4 text-red-500" />;
    case 'rate_limit':
      return <Activity className="h-4 w-4 text-yellow-500" />;
    case 'flag_submit':
      return <Activity className="h-4 w-4 text-green-500" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

export default function AdminMonitorPage() {
  const { monitorEvents, fetchMonitorEvents, addMonitorEvent } = useAdminStore();
  const [health, setHealth] = useState<MonitorHealth | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchHealth = async () => {
    try {
      const data = await api.get<MonitorHealth>('/monitor/health');
      setHealth(data);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchMonitorEvents();
    // Poll /monitor/health every 15s for live CPU/memory/redis status.
    // The WebSocket at /api/v1/ws will eventually replace the
    // `fetchMonitorEvents` poll once the backend pushes events there.
    const healthInterval = setInterval(fetchHealth, 15000);
    const eventsInterval = setInterval(fetchMonitorEvents, 30000);
    return () => {
      clearInterval(healthInterval);
      clearInterval(eventsInterval);
    };
  }, []);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Live Monitor
          </h1>
          <p className="text-muted-foreground">
            Real-time event log and system monitoring
          </p>
        </div>
        <Button variant="outline" onClick={() => { fetchHealth(); fetchMonitorEvents(); }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Event Log
              <Badge variant="secondary" className="ml-auto">
                {monitorEvents.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {monitorEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Monitor className="h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No events yet. Events will appear here in real-time.
                  </p>
                </div>
              ) : (
                monitorEvents.map((event, idx) => {
                  const sev = event.severity || 'info';
                  const cfg = severityConfig[sev];
                  return (
                    <div
                      key={event.id || idx}
                      className={`flex items-start gap-3 rounded-lg p-2 text-sm ${cfg.bg}`}
                    >
                      <div className="mt-0.5">
                        <EventIcon type={event.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{event.message}</p>
                        {event.metadata && (
                          <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                            {JSON.stringify(event.metadata, null, 1)}
                          </pre>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform</span>
                <span>{health?.system?.platform ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPU</span>
                <span>{health?.system?.cpu != null ? `${Math.round(health.system.cpu)}%` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Memory</span>
                <span>{health?.system?.memory != null ? `${Math.round(health.system.memory)}%` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Redis</span>
                <span>
                  <Badge variant={health?.redis?.connected ? 'success' : 'destructive'}>
                    {health?.redis?.connected ? 'connected' : 'down'}
                  </Badge>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Users</span>
                <span>{health?.database?.total_users ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Challenges</span>
                <span>{health?.database?.total_challenges ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                WAF Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monitorEvents
                  .filter((e) => e.type === 'waf')
                  .slice(0, 5)
                  .map((event, idx) => (
                    <div key={idx} className="rounded border border-red-500/20 bg-red-500/5 p-2 text-xs">
                      <p className="font-medium text-red-500">{event.message}</p>
                      <p className="text-muted-foreground">{formatDate(event.timestamp)}</p>
                    </div>
                  ))}
                {monitorEvents.filter((e) => e.type === 'waf').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No WAF alerts
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Rate Limit Hits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monitorEvents
                  .filter((e) => e.type === 'rate_limit')
                  .slice(0, 5)
                  .map((event, idx) => (
                    <div key={idx} className="rounded border border-yellow-500/20 bg-yellow-500/5 p-2 text-xs">
                      <p className="font-medium text-yellow-500">{event.message}</p>
                      <p className="text-muted-foreground">{formatDate(event.timestamp)}</p>
                    </div>
                  ))}
                {monitorEvents.filter((e) => e.type === 'rate_limit').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No rate limit hits
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
