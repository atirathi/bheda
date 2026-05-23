'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Lock, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { difficultyColor } from '@/lib/utils';
import { useCTFStore, type CTFChallenge } from '@/store/ctf';
import Link from 'next/link';

export default function CTFChallengesPage() {
  const { challenges, fetchChallenges, isLoading } = useCTFStore();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const grouped = challenges.reduce<Record<string, CTFChallenge[]>>((acc, ch) => {
    const cat = ch.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ch);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="container py-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-2">
          <Link href="/ctf">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to CTF
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Swords className="h-6 w-6 text-purple-500" />
          CTF Challenges
        </h1>
        <p className="text-muted-foreground">
          {challenges.length} challenge{challenges.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {Object.entries(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Swords className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No challenges available</h3>
          <p className="text-sm text-muted-foreground">
            Challenges will appear once a CTF event starts.
          </p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {Object.entries(grouped).map(([category, catChallenges]) => (
            <Card key={category}>
              <Accordion type="single" collapsible>
                <AccordionItem value={category}>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold capitalize">{category}</span>
                      <Badge variant="secondary">{catChallenges.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-4 space-y-2">
                      {catChallenges.map((ch) => (
                        <div
                          key={ch.id}
                          className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            {ch.solved ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className="font-medium">{ch.title}</span>
                            <Badge variant="outline" className={difficultyColor(ch.difficulty)}>
                              {ch.difficulty}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{ch.points} pts</Badge>
                            {ch.solved && (
                              <Badge variant="success">Solved</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          ))}
        </Accordion>
      )}
    </div>
  );
}
