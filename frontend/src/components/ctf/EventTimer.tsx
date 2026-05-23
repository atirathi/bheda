'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EventTimerProps {
  startDate: string;
  endDate: string;
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold font-mono tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function EventTimer({ startDate, endDate }: EventTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [status, setStatus] = useState<'upcoming' | 'active' | 'ended'>('upcoming');

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (now < start) {
        setStatus('upcoming');
        const diff = start.getTime() - now.getTime();
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else if (now > end) {
        setStatus('ended');
        setTimeLeft(null);
      } else {
        setStatus('active');
        const diff = end.getTime() - now.getTime();
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [startDate, endDate]);

  if (status === 'ended') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Event Ended
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">This CTF event has concluded.</p>
        </CardContent>
      </Card>
    );
  }

  const label = status === 'upcoming' ? 'Starts in' : 'Time Remaining';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeLeft && (
          <div className="flex justify-center gap-4">
            {timeLeft.days > 0 && <TimeBlock value={timeLeft.days} label="Days" />}
            {timeLeft.days > 0 && <span className="text-2xl font-mono text-muted-foreground">:</span>}
            <TimeBlock value={timeLeft.hours} label="Hours" />
            <span className="text-2xl font-mono text-muted-foreground">:</span>
            <TimeBlock value={timeLeft.minutes} label="Minutes" />
            <span className="text-2xl font-mono text-muted-foreground">:</span>
            <TimeBlock value={timeLeft.seconds} label="Seconds" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
