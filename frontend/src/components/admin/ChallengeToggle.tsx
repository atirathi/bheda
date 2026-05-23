'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { difficultyColor } from '@/lib/utils';
import { useAdminStore } from '@/store/admin';
import type { AdminChallenge } from '@/store/admin';

interface GroupedChallenges {
  categoryId: string;
  categoryName: string;
  challenges: AdminChallenge[];
}

interface ChallengeToggleProps {
  grouped: GroupedChallenges;
}

export function ChallengeToggle({ grouped }: ChallengeToggleProps) {
  const [expanded, setExpanded] = useState(true);
  const { toggleChallenge } = useAdminStore();

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/50"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Shield className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{grouped.categoryName}</span>
        <Badge variant="secondary" className="ml-auto">
          {grouped.challenges.length}
        </Badge>
      </button>
      {expanded && (
        <div className="border-t">
          {grouped.challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="flex items-center gap-4 px-8 py-2.5 hover:bg-muted/30"
            >
              <span className="flex-1 text-sm">{challenge.title}</span>
              <Badge variant="outline" className={difficultyColor(challenge.difficulty)}>
                {challenge.difficulty}
              </Badge>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Active
                  <Switch
                    checked={challenge.is_active}
                    onCheckedChange={(v) => toggleChallenge(challenge.id, 'is_active', v)}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  WAF
                  <Switch
                    checked={challenge.waf_enabled}
                    onCheckedChange={(v) => toggleChallenge(challenge.id, 'waf_enabled', v)}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Hints
                  <Switch
                    checked={challenge.hints_enabled}
                    onCheckedChange={(v) => toggleChallenge(challenge.id, 'hints_enabled', v)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
