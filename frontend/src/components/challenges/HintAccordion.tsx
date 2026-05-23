'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface Hint {
  id: string;
  order: number;
  content: string;
  cost?: number;
}

interface HintAccordionProps {
  hints: Hint[];
}

export function HintAccordion({ hints }: HintAccordionProps) {
  if (!hints.length) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No hints available for this challenge.
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {hints
        .sort((a, b) => a.order - b.order)
        .map((hint) => (
          <AccordionItem key={hint.id} value={hint.id}>
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                Hint {hint.order}
                {hint.cost && hint.cost > 0 && (
                  <Badge variant="outline" className="text-xs">
                    -{hint.cost} pts
                  </Badge>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{hint.content}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
    </Accordion>
  );
}
