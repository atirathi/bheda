'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Plus,
  Save,
  X,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface CTFEventData {
  id: string;
  name: string;
  description: string | null;
  start_at: string | null;
  end_at: string | null;
  max_team_size: number;
  status: string;
  isolation_mode: boolean;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<CTFEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_at: '',
    end_at: '',
    max_team_size: 4,
  });

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Backend returns a bare list, not `{ events: [...] }`.
      const data = await api.get<CTFEventData[]>('/events');
      setEvents(data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async () => {
    try {
      // Backend EventCreate expects ISO datetimes; the input is local
      // datetime-local format, so convert to ISO before posting.
      const body = {
        name: form.name,
        description: form.description || null,
        start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
        max_team_size: form.max_team_size,
      };
      await api.post('/events', body);
      setShowCreate(false);
      setForm({ name: '', description: '', start_at: '', end_at: '', max_team_size: 4 });
      fetchEvents();
    } catch {
      // silently fail
    }
  };

  const handleStart = async (id: string) => {
    try {
      await api.post(`/events/${id}/start`);
      fetchEvents();
    } catch {
      // silently fail
    }
  };

  const handleEnd = async (id: string) => {
    try {
      await api.post(`/events/${id}/end`);
      fetchEvents();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            CTF Events
          </h1>
          <p className="text-muted-foreground">Manage Capture The Flag events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchEvents}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Create Event</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Name</Label>
                <Input
                  placeholder="CTF Season 1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Team Size</Label>
                <Input
                  type="number"
                  value={form.max_team_size}
                  onChange={(e) =>
                    setForm({ ...form, max_team_size: parseInt(e.target.value) || 4 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={!form.name || !form.start_at}>
              <Save className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No events</h3>
          <p className="text-sm text-muted-foreground">
            Create your first CTF event to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{event.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={event.status === 'active' ? 'success' : 'secondary'}
                    >
                      {event.status}
                    </Badge>
                    {event.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleStart(event.id)}>
                        Start
                      </Button>
                    )}
                    {event.status === 'active' && (
                      <Button size="sm" variant="outline" onClick={() => handleEnd(event.id)}>
                        End
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start:</span>{' '}
                    {event.start_at ? formatDate(event.start_at) : '—'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">End:</span>{' '}
                    {event.end_at ? formatDate(event.end_at) : '—'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Team Size:</span>{' '}
                    {event.max_team_size}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Isolation:</span>{' '}
                    {event.isolation_mode ? 'per-team' : 'shared'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
