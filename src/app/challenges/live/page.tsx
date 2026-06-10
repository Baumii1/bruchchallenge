"use client";

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import {
    startChallengeAction,
    toggleChallengeTimerAction,
    toggleGameTimerAction,
    logGameOutcomeAction,
    setGameScoreAction,
    markGameCompleteAction,
    deleteGameLogEntryAction,
    endChallengeAction,
    resetChallengeAction,
    fetchLivePageDataAction,
    addOverallNoteAction,
    editOverallNoteAction,
    deleteOverallNoteAction
} from '@/app/actions';
import type { Challenge, Game } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GameIconFactory } from '@/components/icons/GameIconFactory';
import { GameLog } from '@/components/GameLog';
import { computeGameStats, getEffectiveTrackingType, formatScoreValue } from '@/lib/game-logging';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, PlayCircle, PauseCircle, Settings2, RadioTower, ChevronUp, ChevronDown, Minus, Plus, Save, Trophy, StopCircle, ListFilter, RotateCcw, Loader2, MessageSquarePlus, NotepadText, Edit3, Trash2, Check, X, Target } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from"@/hooks/use-toast";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from"@/components/ui/alert-dialog";
import { useAuth } from '@/context/AuthContext';
import { fetchAllPulseReadings, getPulsePlayers, type PulseReading } from '@/lib/pulse';
import { subscribePulseBroadcast, type BroadcastPulseEntry } from '@/lib/pulse-broadcast';

import { HyperatePulseStrip } from '@/components/obs/HyperatePulseStrip';

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatPulseAge = (updatedAt: number | null): string => {
  if (!updatedAt) {
    return 'no signal';
  }

  const seconds = Math.max(0, Math.round((Date.now() - updatedAt) / 1000));
  return seconds <= 1 ? 'just now' : `${seconds}s ago`;
};

const CHALLENGE_STORAGE_KEY = 'bruchchallenge:challenges:v1';

export default function LiveChallengePage() {
  const { isAdmin } = useAuth();
  const [liveChallenge, setLiveChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const [displayTimers, setDisplayTimers] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [manualLogNotes, setManualLogNotes] = useState<Record<string, string>>({});
  const [pulseReadings, setPulseReadings] = useState<PulseReading[]>([]);
  
  const [newOverallNote, setNewOverallNote] = useState('');
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState<string>('');
  const [noteToDeleteIndex, setNoteToDeleteIndex] = useState<number | null>(null);

  const pulsePlayers = useMemo(() => getPulsePlayers(), []);

  const mapPulseEntriesToReadings = useCallback((entries: Record<string, BroadcastPulseEntry>): PulseReading[] => {
    return pulsePlayers.map((player) => {
      const entry = entries[player.id];
      if (!entry) {
        return {
          id: player.id,
          name: player.name,
          bpm: null,
          status: 'missing',
          source: 'broadcast',
          updatedAt: null,
          message: 'Noch kein Publisher für diesen Spieler aktiv.',
        };
      }

      return {
        id: player.id,
        name: entry.name || player.name,
        bpm: entry.bpm,
        status: entry.status,
        source: 'broadcast',
        updatedAt: entry.updatedAt,
        message: entry.message,
      };
    });
  }, [pulsePlayers]);

  const fetchAndSetChallenge = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    try {
      const challengeToLoad = await fetchLivePageDataAction();
      setLiveChallenge(challengeToLoad);
    } catch (error) {
        console.error("Failed to fetch live page data:", error);
        toast({title:"Error Loading Challenge", description:"Could not fetch the current challenge data.", variant:"destructive"});
        setLiveChallenge(null);
    }
    if (showLoadingSpinner) setIsLoading(false);
  }, [toast]);

  const refreshPulse = useCallback(async () => {
    if (pulsePlayers.length === 0) {
      setPulseReadings([]);
      return;
    }

    const nextReadings = await fetchAllPulseReadings();
    setPulseReadings(nextReadings);
  }, [pulsePlayers]);

  useEffect(() => {
    fetchAndSetChallenge();
  }, [fetchAndSetChallenge]);

  useEffect(() => {
    // Realtime-Updates liefert der Firestore-Snapshot-Listener über das
    // data-updated Event; das Intervall ist nur ein Fallback bei verpassten Events.
    const intervalId = setInterval(() => {
      fetchAndSetChallenge(false);
    }, 15000);

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key && event.key !== CHALLENGE_STORAGE_KEY) {
        return;
      }

      void fetchAndSetChallenge(false);
    };

    const handleChallengeUpdate = () => {
      void fetchAndSetChallenge(false);
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('bruchchallenge:data-updated', handleChallengeUpdate as EventListener);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('bruchchallenge:data-updated', handleChallengeUpdate as EventListener);
    };
  }, [fetchAndSetChallenge]);

  useEffect(() => {
    if (pulsePlayers.length === 0) {
      setPulseReadings([]);
      return;
    }

    void refreshPulse();

    const unsubscribePulse = subscribePulseBroadcast((entries) => {
      setPulseReadings(mapPulseEntriesToReadings(entries));
    });

    const pulseInterval = window.setInterval(() => {
      void refreshPulse();
    }, 3000);

    return () => {
      unsubscribePulse();
      window.clearInterval(pulseInterval);
    };
  }, [mapPulseEntriesToReadings, pulsePlayers.length, refreshPulse]);

  useEffect(() => {
    if (!liveChallenge || (liveChallenge.status !== 'live' && liveChallenge.status !== 'upcoming')) {
      if(liveChallenge && liveChallenge.challengeAccumulatedDuration !== undefined){
        const newDisplayTimers: Record<string, string> = {};
        newDisplayTimers.overall = formatTime(liveChallenge.challengeAccumulatedDuration || 0);
        liveChallenge.games.forEach(game => {
          newDisplayTimers[game.id] = formatTime(game.accumulatedDuration || 0);
        });
        setDisplayTimers(newDisplayTimers);
      } else {
        setDisplayTimers({});
      }
      return;
    }

    const intervalId = setInterval(() => {
      if (liveChallenge) {
        const newDisplayTimers: Record<string, string> = {};
        let overallDisplayTime = liveChallenge.challengeAccumulatedDuration || 0;

        if (liveChallenge.status === 'live' && liveChallenge.isChallengeTimerActive && liveChallenge.challengeStartedAt) {
          overallDisplayTime += (Date.now() - liveChallenge.challengeStartedAt) / 1000;
        }
        newDisplayTimers.overall = formatTime(overallDisplayTime);

        liveChallenge.games.forEach(game => {
          let gameDisplayTime = game.accumulatedDuration || 0;
          if (liveChallenge.status === 'live' && game.isTimerActive && game.timerStartedAt) {
            gameDisplayTime += (Date.now() - game.timerStartedAt) / 1000;
          }
          newDisplayTimers[game.id] = formatTime(gameDisplayTime);
        });
        setDisplayTimers(newDisplayTimers);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [liveChallenge]);

const handleServerAction = async (
    action: () => Promise<Challenge | null>,
    successMessage: string,
    errorMessage?: string,
    options: {
        refetchOnSuccess?: boolean;
        optimisticUpdate?: boolean;
        onSuccessSetNull?: boolean;
    } = {}
  ) => {
    startTransition(async () => {
      try {
        const resultChallenge = await action();

        if (options.onSuccessSetNull) {
            setLiveChallenge(null);
            toast({ title: successMessage, variant:"default" });
            await fetchAndSetChallenge(false);
        } else if (resultChallenge) {
            toast({ title: successMessage, variant:"default" });
            if (options.optimisticUpdate !== false) {
                 setLiveChallenge(resultChallenge);
            }
            await fetchAndSetChallenge(false);
        } else {
           toast({ title: errorMessage ||"Action reported no change or failed", description:"Please check the challenge state.", variant:"destructive" });
           await fetchAndSetChallenge(false);
        }
      } catch (error) {
        console.error(errorMessage ||"Action error:", error);
        toast({ title:"Error", description: (error as Error).message ||"An unexpected error occurred.", variant:"destructive" });
        await fetchAndSetChallenge(false);
      }
    });
  };

  const handleStartChallenge = () => {
    if (liveChallenge && liveChallenge.status === 'upcoming') {
      handleServerAction(
        () => startChallengeAction(liveChallenge.id),"Challenge Started!","Failed to start challenge",
        { refetchOnSuccess: true, optimisticUpdate: true }
      );
    }
  };

  const handleToggleChallengeTimer = () => {
    if (liveChallenge && liveChallenge.status === 'live') {
      handleServerAction(
        () => toggleChallengeTimerAction(liveChallenge.id),
        `Challenge Timer ${liveChallenge.isChallengeTimerActive ? 'Paused' : 'Resumed'}`,"Failed to toggle challenge timer",
        { refetchOnSuccess: true, optimisticUpdate: true }
      );
    }
  };

  const handleToggleGameActive = (gameId: string) => {
    if (liveChallenge && liveChallenge.status === 'live') {
      const game = liveChallenge.games.find(g => g.id === gameId);
      handleServerAction(
        () => toggleGameTimerAction(liveChallenge.id, gameId),
        `Game Timer for"${game?.name}" ${game?.isTimerActive && liveChallenge.activeGameId === game.id ? 'Paused' : 'Started/Resumed'}`,"Failed to toggle game timer",
        { refetchOnSuccess: true, optimisticUpdate: true }
      );
    }
  };

  const handleLogOutcome = (gameId: string, kind: 'win' | 'loss' | 'draw' | 'attempt') => {
    if (!liveChallenge || liveChallenge.status !== 'live') return;
    const game = liveChallenge.games.find(g => g.id === gameId);
    const value = (manualLogNotes[gameId] || '').trim();

    const type = game ? getEffectiveTrackingType(game) : 'attempts';
    const payload = type === 'winLossDraw'
      ? (value ? { score: value } : undefined)
      : (value ? { note: value } : undefined);

    const label =
      kind === 'win' ? (game?.winLabel || 'Sieg') :
      kind === 'loss' ? 'Niederlage' :
      kind === 'draw' ? 'Remis' :
      (game?.attemptLabel || 'Versuch');

    handleServerAction(
      () => logGameOutcomeAction(liveChallenge.id, gameId, kind, payload),
      `${label} geloggt – ${game?.name ?? 'Game'}`,
      'Loggen fehlgeschlagen',
      { refetchOnSuccess: true, optimisticUpdate: true }
    );

    setManualLogNotes(prev => ({ ...prev, [gameId]: '' }));
  };

  const handleSetScore = (gameId: string) => {
    if (!liveChallenge || liveChallenge.status !== 'live') return;

    const game = liveChallenge.games.find(g => g.id === gameId);
    const raw = (manualLogNotes[gameId] || '')
      .trim()
      .replace(/\.(?=\d{3}\b)/g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '');

    const score = Number(raw);

    if (!raw || Number.isNaN(score)) {
      toast({
        title: 'Score fehlt',
        description: 'Bitte einen gültigen Zahlenwert eingeben.',
        variant: 'destructive',
      });
      return;
    }

    handleServerAction(
      () => setGameScoreAction(liveChallenge.id, gameId, score),
      `Score ${formatScoreValue(score, game?.scoreUnit)} eingetragen – ${game?.name ?? 'Game'}`,
      'Score konnte nicht gespeichert werden',
      { refetchOnSuccess: true, optimisticUpdate: true }
    );

    setManualLogNotes(prev => ({ ...prev, [gameId]: '' }));
  };

  const handleMarkComplete = (gameId: string) => {
    if (!liveChallenge || liveChallenge.status !== 'live') return;
    const game = liveChallenge.games.find(g => g.id === gameId);
    const note = (manualLogNotes[gameId] || '').trim() || undefined;
    handleServerAction(
      () => markGameCompleteAction(liveChallenge.id, gameId, note),
      `Abgeschlossen – ${game?.name ?? 'Game'}`,
      'Konnte nicht abgeschlossen werden',
      { refetchOnSuccess: true, optimisticUpdate: true }
    );
    setManualLogNotes(prev => ({ ...prev, [gameId]: '' }));
  };

  const handleDeleteLogEntry = (gameId: string, entryId: string) => {
    if (!liveChallenge || liveChallenge.status !== 'live') return;
    handleServerAction(
      () => deleteGameLogEntryAction(liveChallenge.id, gameId, entryId),
      'Eintrag entfernt',
      'Eintrag konnte nicht entfernt werden',
      { refetchOnSuccess: true, optimisticUpdate: true }
    );
  };

  const handleAddOverallNoteInternal = () => {
    if (liveChallenge && liveChallenge.status === 'live' && newOverallNote.trim()) {
        handleServerAction(
            () => addOverallNoteAction(liveChallenge.id, newOverallNote.trim()),"Overall note added.","Failed to add overall note.",
            { refetchOnSuccess: true, optimisticUpdate: true }
        );
        setNewOverallNote('');
    } else if (!newOverallNote.trim()) {
        toast({ title:"Cannot add empty note", variant:"destructive"});
    }
  };

  const handleEditNoteStart = (index: number, currentText: string) => {
    setEditingNoteIndex(index);
    setEditingNoteText(currentText);
  };

  const handleCancelEditNote = () => {
    setEditingNoteIndex(null);
    setEditingNoteText('');
  };

  const handleSaveEditedNote = () => {
    if (liveChallenge && editingNoteIndex !== null && editingNoteText.trim()) {
      handleServerAction(
        () => editOverallNoteAction(liveChallenge.id, editingNoteIndex, editingNoteText.trim()),"Note updated.","Failed to update note.",
        { refetchOnSuccess: true, optimisticUpdate: true }
      );
      handleCancelEditNote();
    } else if (!editingNoteText.trim()){
      toast({ title:"Cannot save an empty note", variant:"destructive" });
    }
  };

  const handleDeleteNote = () => {
    if (liveChallenge && noteToDeleteIndex !== null) {
      handleServerAction(
        () => deleteOverallNoteAction(liveChallenge.id, noteToDeleteIndex),"Note deleted.","Failed to delete note.",
        { refetchOnSuccess: true, optimisticUpdate: true }
      );
    }
    setNoteToDeleteIndex(null);
  };

  const confirmEndChallenge = () => {
    if (liveChallenge && liveChallenge.status === 'live') {
        handleServerAction(
            () => endChallengeAction(liveChallenge.id),"Challenge Ended and Marked as Past.","Failed to end challenge.",
            { onSuccessSetNull: true, refetchOnSuccess: true }
        );
    }
    setShowEndConfirm(false);
  };

  const confirmResetState = () => {
    if(liveChallenge){
        handleServerAction(
            () => resetChallengeAction(liveChallenge.id),"Challenge state has been reset to upcoming.","Failed to reset challenge.",
            { optimisticUpdate: true, refetchOnSuccess: true }
        );
    } else {
        toast({title:"No Challenge", description:"No challenge loaded to reset.", variant:"default"});
        fetchAndSetChallenge();
    }
    setShowResetConfirm(false);
  }

  if (isLoading && !isSubmitting) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-4 text-xl text-muted-foreground mt-4">Loading Live Dashboard...</span>
      </div>
    );
  }

  if (!liveChallenge || (liveChallenge.status !== 'live' && liveChallenge.status !== 'upcoming')) {
    return (
      <Alert variant="default" className="border-primary bg-primary/5 text-primary dark:bg-primary/10 dark:text-primary-foreground/90 rounded-lg p-6">
        <Trophy className="h-6 w-6 !text-primary mr-3" />
        <AlertTitle className="text-xl font-semibold mb-1">No Active or Upcoming Challenge</AlertTitle>
        <AlertDescription>
          The arena is currently quiet. A new challenge might be brewing {isAdmin && <>or you can <Link href="/admin/create-challenge" className="font-semibold underline hover:text-primary/80">create one</Link>!</>}
          <Button onClick={() => fetchAndSetChallenge()} variant="outline" size="sm" className="ml-4" disabled={isSubmitting || isLoading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", (isSubmitting || isLoading) &&"animate-spin")}/> Retry Load
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const isChallengeActuallyLive = liveChallenge.status === 'live';
  const isChallengeUpcoming = liveChallenge.status === 'upcoming';

  return (
    <div className="space-y-8">

      <section className="rounded-2xl border border-primary/20 bg-slate-950/80 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-200">Live Pulse</p>
            <h2 className="text-xl font-bold text-white">Merlin & Patrick</h2>
          </div>
          <p className="text-xs text-muted-foreground">HypeRate Feed</p>
        </div>
        <HyperatePulseStrip livePage />
      </section>

<Card className={cn("shadow-2xl border-2 rounded-xl overflow-hidden",
        isChallengeActuallyLive ?"border-destructive" : isChallengeUpcoming ?"border-accent" :"border-primary"
      )}>
        <CardHeader className={cn("p-6",
         isChallengeActuallyLive ?"bg-destructive/10 dark:bg-destructive/20" : isChallengeUpcoming ?"bg-accent/10 dark:bg-accent/20" :"bg-primary/10 dark:bg-primary/20"
        )}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
                <RadioTower className={cn("h-10 w-10",
                    isChallengeActuallyLive ?"text-destructive" : isChallengeUpcoming ?"text-accent" :"text-primary",
                    isChallengeActuallyLive && liveChallenge.isChallengeTimerActive &&"animate-soft-ping absolute"
                )} />
                <RadioTower className={cn("h-10 w-10 relative",
                    isChallengeActuallyLive ?"text-destructive" : isChallengeUpcoming ?"text-accent" :"text-primary",
                    !isChallengeActuallyLive && !isChallengeUpcoming &&"opacity-50",
                    isChallengeActuallyLive && !liveChallenge.isChallengeTimerActive &&"opacity-60"
                )} />
                <CardTitle className={cn("text-3xl lg:text-4xl font-extrabold",
                    isChallengeActuallyLive ?"text-destructive" : isChallengeUpcoming ?"text-accent" :"text-primary"
                )}>{liveChallenge.title}</CardTitle>
            </div>
            <Badge
                variant={isChallengeActuallyLive ?"destructive" : isChallengeUpcoming ?"default" :"secondary"}
                className={cn("text-lg px-4 py-2 shadow-md self-start sm:self-center",
                    isChallengeUpcoming &&"bg-accent text-accent-foreground"
                )}
            >
              {liveChallenge.status.toUpperCase()} {liveChallenge.isChallengeTimerActive === false && liveChallenge.status==='live' ?"(PAUSED)" :""}
            </Badge>
          </div>
          <CardDescription className="text-xl mt-3 font-medium">
            Challenge Duration: <span className="font-bold text-foreground tabular-nums">{displayTimers.overall || formatTime(liveChallenge.challengeAccumulatedDuration || 0)}</span>
          </CardDescription>
           {isChallengeUpcoming && isAdmin && (
             <Button onClick={handleStartChallenge} size="lg" className="mt-4 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-lg text-base py-3" disabled={isSubmitting}>
                {isSubmitting && liveChallenge.status === 'upcoming' ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <PlayCircle className="mr-2 h-6 w-6" />}
                {isSubmitting && liveChallenge.status === 'upcoming' ?"Starting..." :"Start This Challenge"}
            </Button>
           )}
        </CardHeader>
      </Card>

      {isAdmin && (
         <Card className="shadow-md rounded-lg border">
            <CardHeader className="pb-4"><CardTitle className="text-xl flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary"/>Admin Controls</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3">
                {isChallengeActuallyLive && (
                    <Button onClick={handleToggleChallengeTimer} variant="outline" className="shadow-sm" disabled={isSubmitting}>
                        {isSubmitting && liveChallenge.isChallengeTimerActive ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : liveChallenge.isChallengeTimerActive ? <PauseCircle className="mr-2 h-5 w-5 text-red-500" /> : <PlayCircle className="mr-2 h-5 w-5 text-green-500" />}
                        {isSubmitting && liveChallenge.isChallengeTimerActive ?"Pausing..." : isSubmitting && !liveChallenge.isChallengeTimerActive ?"Resuming..." : (liveChallenge.isChallengeTimerActive ? 'Pause Challenge Clock' : 'Resume Challenge Clock')}
                    </Button>
                )}

                <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-amber-600 border-amber-500 hover:bg-amber-50 hover:text-amber-700 shadow-sm" disabled={isSubmitting} onClick={() => setShowResetConfirm(true)}>
                         <RotateCcw className="mr-2 h-5 w-5"/>
                         Reset Full Challenge State
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will reset all progress, timers, and status for this challenge back to 'upcoming' (scheduled for 2 days from now). This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmResetState} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700">
                        {isSubmitting && showResetConfirm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSubmitting && showResetConfirm ?"Resetting..." :"Yes, reset it!"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                 {isChallengeActuallyLive && (
                    <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="shadow-sm" disabled={isSubmitting} onClick={() => setShowEndConfirm(true)}>
                                 <StopCircle className="mr-2 h-5 w-5" />
                                 End Challenge Now
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Confirm End Challenge</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to end this challenge? It will be moved to 'Past Challenges' and all timers will be stopped. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmEndChallenge} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                                 {isSubmitting && showEndConfirm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isSubmitting && showEndConfirm ?"Ending..." :"Yes, End Challenge"}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 )}
                 <Button onClick={() => { fetchAndSetChallenge(); router.refresh();}} variant="outline" size="sm" className="shadow-sm" disabled={isSubmitting || isLoading}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", (isSubmitting || isLoading) &&"animate-spin")}/> Force Refresh Data
                </Button>
            </CardContent>
         </Card>
      )}

      {isChallengeActuallyLive && (
      <section>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
                <ListFilter className="h-7 w-7 text-primary"/> Game Dashboard
            </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {liveChallenge.games.map((game) => {
            const trackingType = getEffectiveTrackingType(game);
            const stats = computeGameStats(game);
            const isGameActuallyCompleted = game.status === 'completed';
            const isGameVisuallyActive = game.isTimerActive === true && liveChallenge.activeGameId === game.id;
            const logDisabled = isSubmitting || !liveChallenge.isChallengeTimerActive;
            const contextValue = manualLogNotes[game.id] || '';
            const contextPlaceholder =
              game.scoreLabel ||
              (trackingType === 'winLossDraw' ? 'Score (optional, z.B. 13:5)' :
               trackingType === 'score' ? 'Erreichter Score' :
               trackingType === 'completion' ? 'Zeit / Notiz (optional)' :
               'Platzierung / Notiz (optional)');
            const progressPercentage = (() => {
              if (!stats.target || stats.target <= 0) return undefined;
              if (trackingType === 'score') return Math.min(100, ((stats.best ?? 0) / stats.target) * 100);
              if (game.backToBack) return stats.completed ? 100 : Math.min(100, (stats.currentStreak / stats.target) * 100);
              if (trackingType === 'completion') return stats.completed ? 100 : 0;
              return Math.min(100, (stats.wins / stats.target) * 100);
            })();
            const progressLabel = (() => {
              if (!stats.target || stats.target <= 0) return null;
              if (trackingType === 'score') return `${formatScoreValue(stats.best ?? 0, game.scoreUnit)} / ${formatScoreValue(stats.target, game.scoreUnit)}`;
              if (game.backToBack) return `${stats.completed ? stats.target : stats.currentStreak} / ${stats.target} in Folge`;
              return `${Math.min(stats.wins, stats.target)} / ${stats.target}`;
            })();

            return (
              <Card key={game.id} className={cn("shadow-lg rounded-xl flex flex-col transition-all duration-300 border",
                isGameVisuallyActive ? 'border-accent ring-2 ring-accent shadow-accent/30' : 'border-border',
                isGameActuallyCompleted && 'bg-green-50 dark:bg-green-900/20 border-green-500/70'
              )}>
                <CardHeader className="flex flex-row items-start gap-4 pb-3 pt-5 px-5">
                  <GameIconFactory iconName={game.iconName} className={cn("h-12 w-12 mt-1 shrink-0", isGameActuallyCompleted ?"text-green-600" : isGameVisuallyActive ?"text-accent" :"text-primary")} />
                  <div className="flex-grow">
                    <CardTitle className={cn("text-xl font-semibold", isGameActuallyCompleted &&"text-green-700 dark:text-green-300", isGameVisuallyActive &&"text-accent")}>{game.name}</CardTitle>
                    <CardDescription className="text-sm mt-0.5 line-clamp-2">{game.objective}</CardDescription>
                  </div>
                  {game.status && <Badge variant={isGameActuallyCompleted ? 'default' : 'secondary'} className={cn(
                      isGameActuallyCompleted ? 'bg-green-600 text-white' :
                      isGameVisuallyActive ? 'bg-accent text-accent-foreground' :
                      (game.isTimerActive === false && game.status !== 'completed' && game.status !== 'pending' && liveChallenge.status==='live' && game.accumulatedDuration && game.accumulatedDuration > 0 ? 'bg-yellow-400 text-yellow-900' : '')
                    )}>{game.status.toUpperCase()} {game.isTimerActive === false && game.status !== 'completed' && game.status !== 'pending' && liveChallenge.status==='live' && game.accumulatedDuration && game.accumulatedDuration > 0 ?"(PAUSED)" :""}</Badge>}
                </CardHeader>
                <CardContent className="px-5 pb-4 space-y-3 flex-grow">
                  <div className={cn("text-lg font-medium tabular-nums", isGameVisuallyActive &&"text-accent font-bold")}>
                    Game Time: {displayTimers[game.id] || formatTime(game.accumulatedDuration || 0)}
                  </div>
                  {progressPercentage !== undefined && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground flex items-center gap-1">
                          {trackingType === 'score' ? <Target className="h-3.5 w-3.5" /> : null}
                          {game.backToBack ? 'Serie' : trackingType === 'score' ? 'Score' : 'Fortschritt'}
                        </span>
                        <span className={cn("font-semibold tabular-nums", isGameActuallyCompleted ? "text-green-600" : isGameVisuallyActive ? "text-accent" : "text-foreground")}>
                          {progressLabel}
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="w-full h-2.5 rounded-full"
                        indicatorClassName={cn(isGameActuallyCompleted ? 'bg-green-500' : isGameVisuallyActive ? 'bg-accent' : 'bg-primary')}
                      />
                    </div>
                  )}
                  <GameLog
                    game={game}
                    onDeleteEntry={isAdmin && isChallengeActuallyLive ? (entryId) => handleDeleteLogEntry(game.id, entryId) : undefined}
                    disabled={isSubmitting}
                  />
                </CardContent>
                {isAdmin && isChallengeActuallyLive && !isGameActuallyCompleted && (
                    <CardFooter className="px-5 pb-5 pt-0 border-t mt-auto">
                        <div className="flex flex-col gap-3 pt-4 w-full">
                            <Button
                                onClick={() => handleToggleGameActive(game.id)}
                                variant="outline"
                                size="sm"
                                className="w-full shadow-sm"
                                disabled={isSubmitting || !liveChallenge.isChallengeTimerActive}
                            >
                                {isGameVisuallyActive ? <PauseCircle className="mr-2 h-4 w-4 text-red-500" /> : <PlayCircle className="mr-2 h-4 w-4 text-green-500" />}
                                {isGameVisuallyActive ? 'Spiel-Timer pausieren'
                                  : (liveChallenge.activeGameId && liveChallenge.activeGameId !== game.id ? 'Timer hierher wechseln' : 'Spiel-Timer starten')}
                            </Button>

                            <Input
                                type="text"
                                inputMode={trackingType === 'score' ? 'numeric' : 'text'}
                                placeholder={contextPlaceholder}
                                value={contextValue}
                                onChange={(e) => setManualLogNotes(prev => ({ ...prev, [game.id]: e.target.value }))}
                                className="text-sm"
                                disabled={logDisabled}
                            />

                            <div className="grid grid-cols-2 gap-2">
                                {trackingType === 'winLossDraw' && (
                                    <>
                                        <Button onClick={() => handleLogOutcome(game.id, 'win')} size="sm" disabled={logDisabled} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                                            <ChevronUp className="mr-1 h-4 w-4" /> {game.winLabel || 'Sieg'}
                                        </Button>
                                        <Button onClick={() => handleLogOutcome(game.id, 'loss')} size="sm" variant="destructive" disabled={logDisabled} className="shadow-sm">
                                            <ChevronDown className="mr-1 h-4 w-4" /> Niederlage
                                        </Button>
                                        {game.allowDraw && (
                                            <Button onClick={() => handleLogOutcome(game.id, 'draw')} size="sm" disabled={logDisabled} className="col-span-2 bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                                                <Minus className="mr-1 h-4 w-4" /> Remis
                                            </Button>
                                        )}
                                    </>
                                )}

                                {trackingType === 'attempts' && (
                                    <>
                                        <Button onClick={() => handleLogOutcome(game.id, 'win')} size="sm" disabled={logDisabled} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                                            <Trophy className="mr-1 h-4 w-4" /> {game.winLabel || 'Sieg'}
                                        </Button>
                                        <Button onClick={() => handleLogOutcome(game.id, 'attempt')} size="sm" variant="outline" disabled={logDisabled} className="shadow-sm">
                                            <Plus className="mr-1 h-4 w-4 text-blue-500" /> {game.attemptLabel || 'Versuch'}
                                        </Button>
                                    </>
                                )}

                                {trackingType === 'score' && (
                                    <>
                                        <Button onClick={() => handleSetScore(game.id)} size="sm" disabled={logDisabled} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                                            <Save className="mr-1 h-4 w-4" /> Score eintragen
                                        </Button>
                                        <Button onClick={() => handleLogOutcome(game.id, 'attempt')} size="sm" variant="outline" disabled={logDisabled} className="shadow-sm">
                                            <Plus className="mr-1 h-4 w-4 text-blue-500" /> {game.attemptLabel || 'Versuch'} +1
                                        </Button>
                                    </>
                                )}

                                {trackingType === 'completion' && (
                                    <>
                                        <Button onClick={() => handleMarkComplete(game.id)} size="sm" disabled={logDisabled} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                                            <Trophy className="mr-1 h-4 w-4" /> {game.winLabel || 'Geschafft'}
                                        </Button>
                                        <Button onClick={() => handleLogOutcome(game.id, 'attempt')} size="sm" variant="outline" disabled={logDisabled} className="shadow-sm">
                                            <Plus className="mr-1 h-4 w-4 text-blue-500" /> {game.attemptLabel || 'Versuch'}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardFooter>
                )}
                 {isGameActuallyCompleted && (
                    <CardFooter className="px-5 pb-4 pt-3 bg-green-100/50 dark:bg-green-800/20 border-t mt-auto">
                        <div className="flex items-center text-green-600 dark:text-green-400 font-semibold">
                            <Trophy className="mr-2 h-5 w-5"/> Game Completed!
                        </div>
                    </CardFooter>
                 )}
              </Card>
            );
          })}
        </div>
      </section>
      )}

      {isAdmin && isChallengeActuallyLive && (
        <Card className="shadow-md rounded-lg border mt-8">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><NotepadText className="h-5 w-5 text-primary"/>Overall Challenge Notes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                     {liveChallenge.overallNotes && liveChallenge.overallNotes.length > 0 ? (
                        <ul className="space-y-2.5 text-sm">
                            {liveChallenge.overallNotes.map((note, index) => (
                                <li key={index} className="p-3 border rounded-md bg-muted/50 dark:bg-muted/20 flex justify-between items-start group">
                                    {editingNoteIndex === index ? (
                                        <div className="flex-grow flex items-center gap-2">
                                            <Textarea
                                                value={editingNoteText}
                                                onChange={(e) => setEditingNoteText(e.target.value)}
                                                rows={2}
                                                className="flex-grow"
                                                disabled={isSubmitting}
                                            />
                                            <Button onClick={handleSaveEditedNote} size="icon" variant="ghost" className="text-green-600 hover:bg-green-100 dark:hover:bg-green-800/50" disabled={isSubmitting || !editingNoteText.trim()}>
                                                <Check className="h-4 w-4" /> <span className="sr-only">Save</span>
                                            </Button>
                                            <Button onClick={handleCancelEditNote} size="icon" variant="ghost" className="text-red-600 hover:bg-red-100 dark:hover:bg-red-800/50" disabled={isSubmitting}>
                                                <X className="h-4 w-4" /> <span className="sr-only">Cancel</span>
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-muted-foreground flex-grow whitespace-pre-wrap break-words mr-2">{note}</p>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                <Button onClick={() => handleEditNoteStart(index, note)} size="icon" variant="ghost" className="h-7 w-7 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/50" disabled={isSubmitting}>
                                                    <Edit3 className="h-4 w-4" /> <span className="sr-only">Edit</span>
                                                </Button>
                                                <AlertDialog open={noteToDeleteIndex === index} onOpenChange={(open) => !open && setNoteToDeleteIndex(null)}>
                                                    <AlertDialogTrigger asChild>
                                                         <Button onClick={() => setNoteToDeleteIndex(index)} size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-100 dark:hover:bg-red-800/50" disabled={isSubmitting}>
                                                            <Trash2 className="h-4 w-4" /> <span className="sr-only">Delete</span>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirm Delete Note</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete this note? This cannot be undone.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel onClick={() => setNoteToDeleteIndex(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleDeleteNote} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                                                            {isSubmitting && noteToDeleteIndex === index ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                                            Delete
                                                        </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No overall notes added yet.</p>
                    )}
                    {editingNoteIndex === null && (
                        <div className="flex gap-2 items-start pt-2">
                            <Textarea
                                placeholder="Add a general note for the challenge (e.g., server issues, player morale, etc.)"
                                value={newOverallNote}
                                onChange={(e) => setNewOverallNote(e.target.value)}
                                rows={2}
                                className="flex-grow"
                                disabled={isSubmitting || !liveChallenge.isChallengeTimerActive}
                            />
                            <Button
                                onClick={handleAddOverallNoteInternal}
                                disabled={isSubmitting || !liveChallenge.isChallengeTimerActive || !newOverallNote.trim()}
                                className="shadow-sm shrink-0"
                            >
                            {isSubmitting && newOverallNote.trim() && !liveChallenge.overallNotes?.includes(newOverallNote.trim()) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :  <MessageSquarePlus className="mr-2 h-4 w-4"/>}
                                Add Note
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
