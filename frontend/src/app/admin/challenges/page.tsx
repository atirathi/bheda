'use client';

import { useEffect } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChallengeToggle } from '@/components/admin/ChallengeToggle';
import { BulkActionBar } from '@/components/admin/BulkActionBar';
import { useAdminStore } from '@/store/admin';

export default function AdminChallengesPage() {
  const { challenges, fetchChallenges } = useAdminStore();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const grouped = challenges.reduce<Record<string, { categoryId: string; categoryName: string; challenges: typeof challenges }>>(
    (acc, ch) => {
      const key = ch.category_name || 'Uncategorized';
      if (!acc[key]) {
        acc[key] = {
          categoryId: ch.category_id,
          categoryName: ch.category_name,
          challenges: [],
        };
      }
      acc[key].challenges.push(ch);
      return acc;
    },
    {}
  );

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Challenge Manager
          </h1>
          <p className="text-muted-foreground">
            Enable/disable challenges, WAF, and hints
          </p>
        </div>
        <Button variant="outline" onClick={fetchChallenges}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <BulkActionBar />

      <div className="space-y-2">
        {Object.values(grouped).map((g) => (
          <ChallengeToggle key={g.categoryId} grouped={g} />
        ))}
      </div>
    </div>
  );
}
