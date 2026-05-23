'use client';

import { useState } from 'react';
import { Copy, Check, UserPlus, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCTFStore } from '@/store/ctf';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

export function TeamCard() {
  const { team, leaveTeam } = useCTFStore();
  const [copied, setCopied] = useState(false);

  if (!team) return null;

  const copyInviteCode = () => {
    if (!team.invite_code) return;
    navigator.clipboard.writeText(team.invite_code);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{team.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {team.members.length} member{team.members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={leaveTeam}>
            <LogOut className="mr-2 h-4 w-4" />
            Leave
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {team.invite_code && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="mb-1 text-xs text-muted-foreground">Invite Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-2 py-1 text-sm font-mono">
                {team.invite_code}
              </code>
              <Button variant="ghost" size="icon" onClick={copyInviteCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">Members</p>
          <div className="space-y-2">
            {team.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-lg border p-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(member.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.username}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                {member.role === 'leader' ? (
                  <Badge variant="secondary">Leader</Badge>
                ) : (
                  <Badge variant="outline">Member</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
