'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChallengePlayer } from '@/components/challenges/ChallengePlayer';
import { api } from '@/lib/api';
import Link from 'next/link';

interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category_name?: string;
  cvss_score: number;
  points: number;
  hints: { id: string; order: number; content: string; cost?: number }[];
  vuln_endpoint?: string;
  is_locked?: boolean;
}

export default function ChallengePage() {
  const params = useParams();
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    setIsLoading(true);
    api
      .get<ChallengeDetail>(`/challenges/${params.id}`)
      .then(setChallenge)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load challenge'))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="container py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/practice">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Practice
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">{error ?? 'Challenge not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Button variant="ghost" asChild className="mb-2">
        <Link href="/practice">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to challenges
        </Link>
      </Button>
      <ChallengePlayer challenge={challenge} />
    </div>
  );
}
