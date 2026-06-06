'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HintAccordion } from './HintAccordion';
import { FlagSubmit } from './FlagSubmit';
import { difficultyColor } from '@/lib/utils';

interface ChallengeData {
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

interface ChallengePlayerProps {
  challenge: ChallengeData;
}

// Restrict target URLs to known challenge hosts so the iframe can't be
// pointed at attacker-controlled endpoints.  Substring match is intentional
// (a challenge can be served from /api, /vuln, /ctf, etc. under the same
// parent host).  Path traversal & scheme smuggling are caught below.
const ALLOWED_HOST_SUFFIXES = [
  'bheda.ctf',
  'bheda.local',
  'localhost',
  '127.0.0.1',
  '::1',
];

function isAllowedUrl(raw: string): boolean {
  if (!raw) return false;
  let url: URL;
  try {
    url = new URL(raw, window.location.origin);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}

export function ChallengePlayer({ challenge }: ChallengePlayerProps) {
  const initial = challenge.vuln_endpoint ?? '';
  const [vulnUrl, setVulnUrl] = useState(initial);
  const [urlError, setUrlError] = useState<string | null>(
    initial && !isAllowedUrl(initial) ? 'Configured endpoint is not in the allow-list.' : null
  );

  // Re-validate whenever the user edits the URL.
  useEffect(() => {
    if (!vulnUrl) {
      setUrlError(null);
      return;
    }
    if (!isAllowedUrl(vulnUrl)) {
      setUrlError('URL must use http(s) and target a known challenge host.');
    } else {
      setUrlError(null);
    }
  }, [vulnUrl]);

  const safeVulnUrl = useMemo(() => (urlError ? '' : vulnUrl), [vulnUrl, urlError]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{challenge.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={difficultyColor(challenge.difficulty)}>
                    {challenge.difficulty}
                  </Badge>
                  {challenge.category_name && (
                    <Badge variant="secondary">{challenge.category_name}</Badge>
                  )}
                  {challenge.points > 0 && (
                    <span className="text-sm text-muted-foreground">{challenge.points} pts</span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="description">
              <TabsList className="w-full">
                <TabsTrigger value="description" className="flex-1">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Description
                </TabsTrigger>
                <TabsTrigger value="hints" className="flex-1">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Hints
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {challenge.description}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="hints" className="mt-4">
                <HintAccordion hints={challenge.hints} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {challenge.vuln_endpoint && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Target URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vulnUrl}
                  onChange={(e) => setVulnUrl(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              {urlError && (
                <p className="mt-2 text-xs text-destructive">{urlError}</p>
              )}
            </CardContent>
          </Card>
        )}

        {!challenge.is_locked && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Submit Flag</CardTitle>
            </CardHeader>
            <CardContent>
              <FlagSubmit challengeId={challenge.id} />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="h-[calc(100vh-12rem)]">
        {safeVulnUrl ? (
          <iframe
            src={safeVulnUrl}
            className="h-full w-full rounded-lg border"
            title="Vulnerable Application"
            // `allow-same-origin` deliberately OMITTED: without it the framed
            // document cannot access its own origin (cookies, localStorage,
            // parent DOM), which is exactly the XSS-to-parent pivot we want
            // to block.  Scripts + forms remain allowed so challenges still
            // work end-to-end.
            sandbox="allow-scripts allow-forms allow-popups"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No vulnerable endpoint configured for this challenge.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
