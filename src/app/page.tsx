"use client";

import { useCallback, useEffect, useState } from 'react';
import { getDataChallenges } from '@/lib/data';
import type { Challenge } from '@/types';
import { ChallengeCard } from '@/components/ChallengeCard';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trophy, CalendarSearch, Sparkles, Zap, Flame, History, Gamepad2 } from 'lucide-react';

// Removed: export const dynamic = 'force-dynamic';
// This line makes the page server-rendered at request time,
// which is incompatible with `output: 'export'` in next.config.js.
// For static export, pages should be buildable as static HTML.
// Data fetching like getDataChallenges() will run at build time.

export default function HomePage() {
  const [allCurrentChallenges, setAllCurrentChallenges] = useState<Challenge[]>(() => getDataChallenges());

  const refreshChallenges = useCallback(() => {
    setAllCurrentChallenges(getDataChallenges());
  }, []);

  useEffect(() => {
    refreshChallenges();
    const poller = setInterval(refreshChallenges, 1000);
    const handleDataUpdate = () => refreshChallenges();

    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('bruchchallenge:data-updated', handleDataUpdate as EventListener);
    return () => {
      clearInterval(poller);
      window.removeEventListener('storage', handleDataUpdate);
      window.removeEventListener('bruchchallenge:data-updated', handleDataUpdate as EventListener);
    };
  }, [refreshChallenges]);

  let displayChallenge: Challenge | undefined;
  let liveChallenge: Challenge | undefined;
  let upcomingChallenges: Challenge[] = [];
  let pastChallenges: Challenge[] = [];

  // Categorize challenges
  allCurrentChallenges.forEach(c => {
    if (c.status === 'live') {
      liveChallenge = c;
    } else if (c.status === 'upcoming' && c.scheduledDateTime && new Date(c.scheduledDateTime) > new Date()) {
      upcomingChallenges.push(c);
    } else if (c.status === 'past') {
      pastChallenges.push(c);
    }
  });

  // Sort upcoming challenges by date ascending to find the *next* one
  upcomingChallenges.sort((a, b) => new Date(a.scheduledDateTime!).getTime() - new Date(b.scheduledDateTime!).getTime());

  // Determine the hero display challenge
  if (liveChallenge) {
    displayChallenge = liveChallenge;
  } else if (upcomingChallenges.length > 0) {
    displayChallenge = upcomingChallenges[0];
  }
  
  // Past challenges are already filtered and sorted by getDataChallenges (descending)
  const totalChallenges = allCurrentChallenges.length;
  const totalGamesPlayed = pastChallenges.reduce((sum, challenge) => sum + challenge.games.length, 0);

  return (
    <div className="space-y-12 md:space-y-16">
      <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Flame className="h-4 w-4" /> Bruch Challenge Hub
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Alles im Blick: Challenges, Live-Status und Hall of Fame
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Verfolge aktuelle Runs in Echtzeit, plane die nächste Session und springe mit einem Klick direkt ins Live-Dashboard.
            </p>
          </div>
          {liveLinkButton()}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card/80 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Challenges gesamt</p>
            <p className="mt-1 text-2xl font-bold">{totalChallenges}</p>
          </div>
          <div className="rounded-lg border bg-card/80 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Vergangene Challenges</p>
            <p className="mt-1 text-2xl font-bold">{pastChallenges.length}</p>
          </div>
          <div className="rounded-lg border bg-card/80 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Games gespielt</p>
            <p className="mt-1 text-2xl font-bold">{totalGamesPlayed}</p>
          </div>
        </div>
      </section>

      {/* Upcoming or Live Challenge Section */}
      {displayChallenge && (displayChallenge.status === 'upcoming' || displayChallenge.status === 'live') && (
        <section className="bg-card p-6 sm:p-8 rounded-xl shadow-2xl border border-primary/30 dark:border-primary/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className='flex items-center gap-3'>
              {displayChallenge.status === 'live' ? (
                <Zap className="h-10 w-10 text-destructive animate-ping" />
              ) : (
                <Sparkles className="h-10 w-10 text-accent hidden sm:block" />
              )}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">
                {displayChallenge.status === 'live' ? "Challenge läuft gerade!" : "Nächste Challenge steht an!"}
              </h1>
            </div>
          </div>
          <CountdownTimer 
            targetDateISO={displayChallenge.scheduledDateTime || new Date(displayChallenge.date).toISOString()} 
            challengeStatus={displayChallenge.status} 
          />
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-1">{displayChallenge.title}</h2>
            <p className="text-muted-foreground mb-4">
              {displayChallenge.status === 'live' ? "Die Session ist aktiv – viel Erfolg!" : "Countdown läuft – mach dich bereit!"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
              <ChallengeCard challenge={displayChallenge} isUpcomingHero={true} />
            </div>
          </div>
        </section>
      )}

      {!displayChallenge && (
        <Alert className="border-primary bg-primary/5 text-primary dark:bg-primary/10 dark:text-primary-foreground/90 rounded-lg p-6">
          <CalendarSearch className="h-6 w-6 !text-primary mr-3" />
          <AlertTitle className="text-xl font-semibold mb-1">No Upcoming or Live Challenges</AlertTitle>
          <AlertDescription>
            The arena is quiet for now... Stay tuned! New challenges will be announced soon. In the meantime, check out the <Link href="/admin/create-challenge" className="font-semibold underline hover:text-primary/80">Create Challenge</Link> page to set up a new one!
          </AlertDescription>
        </Alert>
      )}
      
      {(displayChallenge || pastChallenges.length > 0) && <Separator className="my-8 md:my-12" />}


      {/* Past Challenges Section */}
      {pastChallenges.length > 0 && (
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" /> Hall of Fame
              </h2>
              <p className="text-muted-foreground mt-1">Relive the legendary battles and glorious victories.</p>
            </div>
            {!displayChallenge && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 sm:mt-0">
                <History className="h-4 w-4" />
                Vergangene Runs mit allen Details
              </div>
            )} 
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {pastChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </section>
      )}

      {pastChallenges.length === 0 && !displayChallenge && ( 
         <Alert>
            <Trophy className="h-5 w-5" />
            <AlertTitle>The Stage is Set</AlertTitle>
            <AlertDescription>
              No challenges recorded yet. Be the first to <Link href="/admin/create-challenge" className="font-semibold underline hover:text-primary/80">create one</Link> and make history!
            </AlertDescription>
          </Alert>
      )}
    </div>
  );
}

const liveLinkButton = () => (
  <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-shadow shrink-0 mt-4 md:mt-0">
    <Link href="/challenges/live">
      <Gamepad2 className="mr-2 h-5 w-5" />
      Zum Live-Dashboard
    </Link>
  </Button>
);
