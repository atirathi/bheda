'use client';

import { useEffect, useState } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

interface TimelineEvent {
  id: string;
  title: string;
  start_at: string | null;
  end_at: string | null;
  type: 'challenge' | 'event';
}

export default function AdminSchedulePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      // Backend returns `{ events: [...] }` at /schedules/timeline.
      const data = await api.get<{ events: TimelineEvent[] }>('/schedules/timeline');
      setEvents(data.events);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Schedule Timeline
          </h1>
          <p className="text-muted-foreground">
            Read-only timeline of scheduled challenges and events
          </p>
        </div>
        <Button variant="outline" onClick={fetchTimeline}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Nothing scheduled</h3>
          <p className="text-sm text-muted-foreground">
            Set start/end dates on challenges to see them appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <Card key={e.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{e.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {e.start_at ? <>Starts: {new Date(e.start_at).toLocaleString()}</> : 'No start'}
                {' · '}
                {e.end_at ? <>Ends: {new Date(e.end_at).toLocaleString()}</> : 'open-ended'}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
