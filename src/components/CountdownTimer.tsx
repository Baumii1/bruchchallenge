
"use client";

import { useState, useEffect } from 'react';
import { PartyPopper, Hourglass } from 'lucide-react';
import type { Challenge } from '@/types'; // Assuming Challenge type includes status

interface CountdownTimerProps {
  targetDateISO: string; // ISO string
  challengeStatus?: Challenge['status'];
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ targetDateISO, challengeStatus }: CountdownTimerProps) {
  const calculateTimeLeft = (): TimeLeft | null => {
    const difference = +new Date(targetDateISO) - +new Date();
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return null;
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Initial calculation on client mount
    setTimeLeft(calculateTimeLeft());
  }, []); 

  useEffect(() => {
    if (!isClient || !targetDateISO) return;

    const timerId = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Clear interval if targetDateISO changes or component unmounts
    return () => clearInterval(timerId);
  }, [isClient, targetDateISO]);

  if (!isClient) {
    // Skeleton loader for SSR to avoid hydration mismatch
    return (
      <div className="text-center py-10 bg-muted/30 dark:bg-muted/10 rounded-lg animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {['days', 'hours', 'minutes', 'seconds'].map(unit => (
            <div key={unit} className="bg-card/70 dark:bg-card/90 p-4 rounded-md shadow-sm">
              <div className="text-4xl md:text-5xl font-bold text-transparent bg-gray-300 dark:bg-gray-700 rounded-md h-12 w-16 mx-auto mb-1"></div>
              <div className="text-sm uppercase tracking-wider text-transparent bg-gray-300 dark:bg-gray-700 h-4 w-12 mx-auto rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (challengeStatus === 'live') {
    return (
      <div className="text-center py-10 bg-red-50 dark:bg-red-900/30 border border-destructive/50 rounded-lg shadow-md">
        <PartyPopper className="h-12 w-12 text-destructive mx-auto mb-3 animate-bounce" />
        <h3 className="text-2xl font-semibold text-destructive dark:text-red-400">Challenge is LIVE!</h3>
        <p className="text-muted-foreground mt-1">The battle is on! Good luck, champions!</p>
      </div>
    );
  }

  if (!timeLeft) { // Countdown finished, but not yet live (or status unknown)
    return (
      <div className="text-center py-10 bg-blue-50 dark:bg-blue-900/30 border border-primary/50 rounded-lg shadow-md">
        <Hourglass className="h-12 w-12 text-primary mx-auto mb-3 animate-spin" />
        <h3 className="text-2xl font-semibold text-primary dark:text-blue-400">Starting Soon!</h3>
        <p className="text-muted-foreground mt-1">Get ready, the challenge is about to begin!</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card to-accent/5 dark:from-primary/10 dark:via-card dark:to-accent/10 p-6 rounded-lg shadow-inner border border-border/50">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="bg-card/70 dark:bg-card/90 p-3 sm:p-4 rounded-lg shadow-md border border-border/50">
            <div className="text-4xl md:text-5xl font-bold text-primary dark:text-accent">{String(value).padStart(2, '0')}</div>
            <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mt-0.5">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
