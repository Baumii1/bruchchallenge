
import { getDataChallenges } from '@/lib/data';
import type { Challenge } from '@/types';
import { ChallengeCard } from '@/components/ChallengeCard';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { GameIconFactory } from '@/components/icons/GameIconFactory';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trophy, CalendarSearch, Sparkles, Zap } from 'lucide-react';

// Removed: export const dynamic = 'force-dynamic';
// This line makes the page server-rendered at request time,
// which is incompatible with `output: 'export'` in next.config.js.
// For static export, pages should be buildable as static HTML.
// Data fetching like getDataChallenges() will run at build time.

export default async function HomePage() {
  const allCurrentChallenges = getDataChallenges(); // This will run at build time

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

  return (
    <div className="space-y-12 md:space-y-16">
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
                {displayChallenge.status === 'live' ? "Challenge is LIVE!" : "Next Epic Showdown!"}
              </h1>
            </div>
            { (displayChallenge.status === 'live' || displayChallenge.status === 'upcoming') && liveLinkButton()}
          </div>
          <CountdownTimer 
            targetDateISO={displayChallenge.scheduledDateTime || new Date(displayChallenge.date).toISOString()} 
            challengeStatus={displayChallenge.status} 
          />
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-1">{displayChallenge.title}</h2>
            <p className="text-muted-foreground mb-4">
              {displayChallenge.status === 'live' ? "The battle is currently underway!" : "Get ready for the next battle!"}
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
            {!displayChallenge && liveLinkButton()} 
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
      <GameIconFactory iconName="target" className="mr-2 h-5 w-5" />
      Go to Live Dashboard
    </Link>
  </Button>
);
