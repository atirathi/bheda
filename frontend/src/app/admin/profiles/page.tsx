'use client';

import { useEffect, useState } from 'react';
import { UserCog, FileJson, Download, Upload, Trash2, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileCard } from '@/components/admin/ProfileCard';
import { api } from '@/lib/api';

interface ProfileData {
  id: string;
  name: string;
  description?: string;
  challenges_count: number;
  created_at: string;
  is_active?: boolean;
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ profiles: ProfileData[] }>('/admin/profiles');
      setProfiles(data.profiles);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleLoad = async (id: string) => {
    try {
      await api.post(`/admin/profiles/${id}/load`);
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/profiles/${id}`);
      setProfiles(profiles.filter((p) => p.id !== id));
    } catch {
      // silently fail
    }
  };

  const handleSaveCurrent = async () => {
    if (!newName.trim()) return;
    try {
      const created = await api.post<ProfileData>('/admin/profiles', {
        name: newName.trim(),
      });
      setProfiles([...profiles, created]);
      setNewName('');
    } catch {
      // silently fail
    }
  };

  const handleExport = async (id: string) => {
    try {
      const data = await api.get<unknown>(`/admin/profiles/${id}/export`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            Profile Manager
          </h1>
          <p className="text-muted-foreground">
            Save and load challenge profiles
          </p>
        </div>
        <Button variant="outline" onClick={fetchProfiles}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Save Current Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Profile name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSaveCurrent} disabled={!newName.trim()}>
            <Upload className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="outline">
            <FileJson className="mr-2 h-4 w-4" />
            Import
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserCog className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No saved profiles</h3>
          <p className="text-sm text-muted-foreground">
            Save the current challenge configuration as a profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onLoad={handleLoad}
              onDelete={handleDelete}
              onExport={handleExport}
            />
          ))}
        </div>
      )}
    </div>
  );
}
