'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Plus,
  Save,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface CTFEventData {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  max_team_size: number;
  status: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<CTFEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    max_team_size: 4,
    is_active: false,
  });

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ events: CTFEventData[] }>('/admin/events');
      setEvents(data.events);
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
      await api.post('/admin/events', form);
      setShowCreate(false);
      setForm({ name: '', description: '', start_date: '', end_date: '', max_team_size: 4, is_active: false });
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
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Active immediately</Label>
            </div>
            <Button onClick={handleCreate} disabled={!form.name || !form.start_date}>
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
                    {event.is_active ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start:</span>{' '}
                    {formatDate(event.start_date)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">End:</span>{' '}
                    {formatDate(event.end_date)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Team Size:</span>{' '}
                    {event.max_team_size}
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
