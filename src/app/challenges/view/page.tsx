"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { fetchChallengeDetailsAction } from '@/app/actions';
import ChallengeDetailsClient from '@/components/ChallengeDetailsClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Challenge } from '@/types';

export default function ChallengeDetailsViewPage() {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get('id');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChallenge = async () => {
      if (!challengeId) {
        setChallenge(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const loadedChallenge = await fetchChallengeDetailsAction(challengeId);
      setChallenge(loadedChallenge);
      setIsLoading(false);
    };

    void loadChallenge();
  }, [challengeId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="mt-4 text-lg">Loading challenge details...</span>
      </div>
    );
  }

  if (!challengeId || !challenge) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Challenge not found</AlertTitle>
        <AlertDescription className="mt-2">
          Diese Challenge konnte nicht geladen werden. Vielleicht existiert sie nicht mehr oder die ID ist ungültig.
          <div className="mt-4">
            <Button asChild>
              <Link href="/">Zurück zur Startseite</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return <ChallengeDetailsClient key={challenge.id} initialChallenge={challenge} />;
}
