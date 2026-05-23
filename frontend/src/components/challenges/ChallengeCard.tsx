'use client';

import Link from 'next/link';
import { Shield, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { difficultyColor, statusColor, formatCvss } from '@/lib/utils';
import type { Challenge } from '@/store/challenges';

interface ChallengeCardProps {
  challenge: Challenge;
  mode: 'practice' | 'ctf';
}

export function ChallengeCard({ challenge, mode }: ChallengeCardProps) {
  const href = mode === 'practice' ? `/practice/${challenge.id}` : `/ctf/challenges#${challenge.id}`;

  return (
    <Link href={href}>
      <Card className="group cursor-pointer transition-all hover:border-bheda-500/50 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">{challenge.title}</CardTitle>
            </div>
            {challenge.status && (
              <Badge variant="outline" className={statusColor(challenge.status)}>
                {challenge.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className={difficultyColor(challenge.difficulty)}>
              {challenge.difficulty}
            </Badge>
            {challenge.category_name && (
              <Badge variant="secondary">{challenge.category_name}</Badge>
            )}
            {challenge.cvss_score > 0 && (
              <span className="text-xs">CVSS: {formatCvss(challenge.cvss_score)}</span>
            )}
            {challenge.points > 0 && (
              <span className="text-xs">{challenge.points} pts</span>
            )}
            {challenge.solve_count > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <Users className="h-3 w-3" />
                {challenge.solve_count}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ChallengeCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-5 w-3/4 rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-5 w-20 rounded-full bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
