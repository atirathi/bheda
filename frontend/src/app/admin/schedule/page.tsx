'use client';

import { useEffect, useState } from 'react';
import { Clock, Plus, Save, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface ScheduleEntry {
  id: string;
  action: string;
  target: string;
  scheduled_at: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
}

export default function AdminSchedulePage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    action: 'load_profile',
    target: '',
    scheduled_at: '',
  });

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ entries: ScheduleEntry[] }>('/admin/schedule');
      setEntries(data.entries);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleAdd = async () => {
    try {
      await api.post('/admin/schedule', form);
      setShowAdd(false);
      setForm({ action: 'load_profile', target: '', scheduled_at: '' });
      fetchSchedule();
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/schedule/${id}`);
      setEntries(entries.filter((e) => e.id !== id));
    } catch {
      // silently fail
    }
  };

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[d.getDay()];
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Schedule Manager
          </h1>
          <p className="text-muted-foreground">
            Schedule profile loads and automated actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSchedule}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowAdd(!showAdd)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Schedule
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Scheduled Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value })}
                >
                  <option value="load_profile">Load Profile</option>
                  <option value="enable_challenge">Enable Challenges</option>
                  <option value="disable_challenge">Disable Challenges</option>
                  <option value="start_ctf">Start CTF</option>
                  <option value="end_ctf">End CTF</option>
                  <option value="reset_progress">Reset Progress</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target (profile ID / category)</label>
                <Input
                  placeholder="profile-id or category"
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Schedule Date</label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={!form.scheduled_at}>
              <Save className="mr-2 h-4 w-4" />
              Add to Schedule
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No scheduled actions</h3>
          <p className="text-sm text-muted-foreground">
            Add scheduled actions for automated profile loads.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 rounded-lg border bg-card p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <span className="text-xs font-bold">{getDayName(entry.scheduled_at)}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium capitalize">
                  {entry.action.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Target: {entry.target}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-mono text-xs">{formatDate(entry.scheduled_at)}</p>
                <Badge
                  variant={
                    entry.status === 'completed'
                      ? 'success'
                      : entry.status === 'failed'
                      ? 'destructive'
                      : entry.status === 'running'
                      ? 'warning'
                      : 'outline'
                  }
                  className="mt-1"
                >
                  {entry.status}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
