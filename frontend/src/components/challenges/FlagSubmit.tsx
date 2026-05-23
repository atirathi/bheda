'use client';

import { useState } from 'react';
import { Flag, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface FlagSubmitProps {
  challengeId: string;
  onSuccess?: () => void;
}

export function FlagSubmit({ challengeId, onSuccess }: FlagSubmitProps) {
  const [flag, setFlag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await api.post<{ correct: boolean; message?: string }>('/challenges/submit', {
        challenge_id: challengeId,
        flag: flag.trim(),
      });

      if (result.correct) {
        toast.success('Correct flag! Challenge solved.', {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        });
        setFlag('');
        onSuccess?.();
      } else {
        toast.error(result.message ?? 'Incorrect flag. Try again.', {
          icon: <XCircle className="h-4 w-4 text-red-500" />,
        });
      }
    } catch {
      toast.error('Failed to submit flag. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Flag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Enter flag..."
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          className="pl-9"
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" disabled={isSubmitting || !flag.trim()}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting
          </>
        ) : (
          'Submit'
        )}
      </Button>
    </form>
  );
}
