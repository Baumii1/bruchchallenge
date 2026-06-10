"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { fetchLivePageDataAction, recordGameMatchResultAction } from '@/app/actions';
import type { Challenge, Game, GameMatchResult } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, RadioTower, Trophy, XCircle, MinusCircle, RefreshCw } from 'lucide-react';

const getRequiredStreak = (game: Game): number => {
  if (game.requiredWinStreak && game.requiredWinStreak > 1) return game.requiredWinStreak;
  const haystack = `${game.name} ${game.objective}`.toLowerCase();
  const explicit = haystack.match(/\bb(\d+)b\b/);
  if (explicit?.[1]) return Math.max(2, Number(explicit[1]) || 2);
  if (haystack.includes('b2b') || haystack.includes('back-to-back')) return 2;
  if (haystack.includes('b3b')) return 3;
  return 1;
};

export default function LiveResultsPage() {
  const { isAdmin, isAuthReady } = useAuth();
  const { toast } = useToast();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, startTransition] = useTransition();

  const loadChallenge = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    const nextChallenge = await fetchLivePageDataAction();
    setChallenge(nextChallenge);
    if (showSpinner) setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadChallenge(true);
    // Updates kommen über den Firestore-Snapshot-Listener; Intervall nur als Fallback.
    const interval = window.setInterval(() => void loadChallenge(), 15000);
    const handleDataUpdate = () => void loadChallenge();
    window.addEventListener('bruchchallenge:data-updated', handleDataUpdate as EventListener);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('bruchchallenge:data-updated', handleDataUpdate as EventListener);
    };
  }, [loadChallenge]);

  const games = useMemo(() => challenge?.games ?? [], [challenge]);

  const recordResult = (gameId: string, result: GameMatchResult) => {
    if (!challenge) return;

    startTransition(async () => {
      const updatedChallenge = await recordGameMatchResultAction(challenge.id, gameId, result, notes[gameId] ?? '');
      if (!updatedChallenge) {
        toast({ title: 'Nicht gespeichert', description: 'Das Ergebnis konnte nicht geschrieben werden.', variant: 'destructive' });
        return;
      }

      setChallenge(updatedChallenge);
      setNotes((current) => ({ ...current, [gameId]: '' }));
      toast({ title: 'Ergebnis gespeichert' });
    });
  };

  if (!isAuthReady || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="mt-4 text-lg">Live-Ergebnisse werden geladen...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Admin-Login erforderlich</CardTitle>
          <CardDescription>Diese Seite ist nur für den Live-Result-Recorder gedacht.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Keine Live-Challenge</CardTitle>
          <CardDescription>Starte zuerst eine Challenge, dann kannst du hier Wins/Losses/Draws dokumentieren.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void loadChallenge()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Aktualisieren
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="border-primary/30 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RadioTower className="h-6 w-6 text-primary" />
            Live Result Recorder
          </CardTitle>
          <CardDescription>
            Für b2b/b3b-Spiele: Win erhöht die aktuelle Streak, Loss setzt sie zurück, Draw bleibt neutral.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {games.map((game) => {
          const requiredStreak = getRequiredStreak(game);
          const progress = game.currentProgress ?? 0;
          const target = game.targetProgress ?? 1;

          return (
            <Card key={game.id} className={challenge.activeGameId === game.id ? 'border-primary shadow-lg' : undefined}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{game.name}</CardTitle>
                    <CardDescription>{game.objective}</CardDescription>
                  </div>
                  {challenge.activeGameId === game.id ? <Badge>aktiv</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-lg border bg-card/70 p-2">
                    <div className="text-muted-foreground">Wins</div>
                    <div className="text-xl font-bold">{game.wins ?? 0}</div>
                  </div>
                  <div className="rounded-lg border bg-card/70 p-2">
                    <div className="text-muted-foreground">Losses</div>
                    <div className="text-xl font-bold">{game.losses ?? 0}</div>
                  </div>
                  <div className="rounded-lg border bg-card/70 p-2">
                    <div className="text-muted-foreground">Draws</div>
                    <div className="text-xl font-bold">{game.draws ?? 0}</div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <div className="flex justify-between">
                    <span>Progress</span>
                    <strong>{progress}/{target}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Win-Streak</span>
                    <strong>{game.currentWinStreak ?? 0}/{requiredStreak}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Streak</span>
                    <strong>{game.bestWinStreak ?? 0}</strong>
                  </div>
                </div>

                <Input
                  placeholder="Note, z. B. 13:9 auf Mirage, knappes 1v2..."
                  value={notes[game.id] ?? ''}
                  onChange={(event) => setNotes((current) => ({ ...current, [game.id]: event.target.value }))}
                />

                <div className="grid grid-cols-3 gap-2">
                  <Button disabled={isSubmitting} onClick={() => recordResult(game.id, 'win')}>
                    <Trophy className="mr-2 h-4 w-4" /> Win
                  </Button>
                  <Button disabled={isSubmitting} variant="destructive" onClick={() => recordResult(game.id, 'loss')}>
                    <XCircle className="mr-2 h-4 w-4" /> Loss
                  </Button>
                  <Button disabled={isSubmitting} variant="outline" onClick={() => recordResult(game.id, 'draw')}>
                    <MinusCircle className="mr-2 h-4 w-4" /> Draw
                  </Button>
                </div>

                {(game.attempts ?? []).length > 0 ? (
                  <div className="max-h-32 overflow-auto rounded-lg border bg-background/70 p-2 text-xs text-muted-foreground">
                    {(game.attempts ?? []).slice(-6).map((attempt, index) => (
                      <div key={`${game.id}-attempt-${index}`}>{attempt}</div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
