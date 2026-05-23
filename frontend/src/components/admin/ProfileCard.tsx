'use client';

import { Download, Upload, Trash2, FileJson } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface Profile {
  id: string;
  name: string;
  description?: string;
  challenges_count: number;
  created_at: string;
  is_active?: boolean;
}

interface ProfileCardProps {
  profile: Profile;
  onLoad?: (id: string) => void;
  onDelete?: (id: string) => void;
  onExport?: (id: string) => void;
}

export function ProfileCard({ profile, onLoad, onDelete, onExport }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{profile.name}</CardTitle>
            {profile.description && (
              <CardDescription>{profile.description}</CardDescription>
            )}
          </div>
          {profile.is_active && (
            <Badge variant="success">Active</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {profile.challenges_count} challenges
            </p>
            <p className="text-xs text-muted-foreground">
              Created {formatDate(profile.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onLoad?.(profile.id)}>
              <Upload className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onExport?.(profile.id)}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete?.(profile.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
