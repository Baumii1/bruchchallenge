"use client";

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Edit3, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { fetchChallengeDetailsAction, updateChallengeAction } from '@/app/actions';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Challenge, Game } from '@/types';

interface EditableGameFormState {
  id?: string;
  name: string;
  iconName: string;
  objective: string;
  targetProgress: string;
  result: string;
  status: Game['status'];
  enableTryCounter: boolean;
  enableManualLog: boolean;
}

interface ChallengeEditorFormState {
  title: string;
  scheduledDateTime: string;
  image: string;
  startTime: string;
  endTime: string;
  totalDuration: string;
  overallNotes: string;
  games: EditableGameFormState[];
}

const emptyGame = (): EditableGameFormState => ({
  name: '',
  iconName: 'default',
  objective: '',
  targetProgress: '',
  result: '',
  status: 'pending',
  enableTryCounter: false,
  enableManualLog: false,
});

const toDateTimeLocalValue = (value?: string, fallbackDate?: string): string => {
  const baseValue = value ?? fallbackDate;
  if (!baseValue) {
    return '';
  }

  const date = new Date(baseValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const mapChallengeToFormState = (challenge: Challenge): ChallengeEditorFormState => ({
  title: challenge.title,
  scheduledDateTime: toDateTimeLocalValue(challenge.scheduledDateTime, challenge.date),
  image: challenge.image ?? '',
  startTime: challenge.startTime ?? '',
  endTime: challenge.endTime ?? '',
  totalDuration: challenge.totalDuration ?? '',
  overallNotes: (challenge.overallNotes ?? []).join('\n'),
  games: challenge.games.map((game) => ({
    id: game.id,
    name: game.name,
    iconName: game.iconName,
    objective: game.objective,
    targetProgress: game.targetProgress !== undefined && game.targetProgress !== null ? String(game.targetProgress) : '',
    result: game.result ?? '',
    status: game.status ?? 'pending',
    enableTryCounter: Boolean(game.enableTryCounter),
    enableManualLog: Boolean(game.enableManualLog),
  })),
});

export default function EditChallengePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin, isAuthReady } = useAuth();
  const [isSubmitting, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [formState, setFormState] = useState<ChallengeEditorFormState | null>(null);

  const challengeId = searchParams.get('id');

  useEffect(() => {
    if (isAuthReady && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isAuthReady, router]);

  useEffect(() => {
    const loadChallenge = async () => {
      if (!challengeId) {
        setChallenge(null);
        setFormState(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const loadedChallenge = await fetchChallengeDetailsAction(challengeId);
      setChallenge(loadedChallenge);
      setFormState(loadedChallenge ? mapChallengeToFormState(loadedChallenge) : null);
      setIsLoading(false);
    };

    void loadChallenge();
  }, [challengeId]);

  const updateFormField = <K extends keyof ChallengeEditorFormState>(field: K, value: ChallengeEditorFormState[K]) => {
    setFormState((current) => current ? { ...current, [field]: value } : current);
  };

  const updateGameField = <K extends keyof EditableGameFormState>(index: number, field: K, value: EditableGameFormState[K]) => {
    setFormState((current) => {
      if (!current) {
        return current;
      }

      const nextGames = [...current.games];
      nextGames[index] = { ...nextGames[index], [field]: value };
      return { ...current, games: nextGames };
    });
  };

  const addGame = () => {
    setFormState((current) => current ? { ...current, games: [...current.games, emptyGame()] } : current);
  };

  const removeGame = (index: number) => {
    setFormState((current) => {
      if (!current || current.games.length <= 1) {
        return current;
      }

      return {
        ...current,
        games: current.games.filter((_, gameIndex) => gameIndex !== index),
      };
    });
  };

  const handleSubmit = () => {
    if (!challengeId || !formState) {
      return;
    }

    if (!formState.title.trim()) {
      toast({ title: 'Titel fehlt', description: 'Bitte gib einen Challenge-Titel ein.', variant: 'destructive' });
      return;
    }

    if (!formState.scheduledDateTime) {
      toast({ title: 'Datum fehlt', description: 'Bitte gib Datum und Uhrzeit an.', variant: 'destructive' });
      return;
    }

    if (formState.games.length === 0) {
      toast({ title: 'Keine Spiele', description: 'Mindestens ein Spiel muss vorhanden sein.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      try {
        const updatedChallenge = await updateChallengeAction(challengeId, {
          title: formState.title,
          scheduledDateTime: new Date(formState.scheduledDateTime).toISOString(),
          image: formState.image,
          startTime: formState.startTime,
          endTime: formState.endTime,
          totalDuration: formState.totalDuration,
          overallNotes: formState.overallNotes.split('\n').map((note) => note.trim()).filter(Boolean),
          games: formState.games.map((game) => ({
            id: game.id,
            name: game.name,
            iconName: game.iconName,
            objective: game.objective,
            targetProgress: game.targetProgress.trim() === '' ? null : Number(game.targetProgress),
            result: game.result,
            status: game.status,
            enableTryCounter: game.enableTryCounter,
            enableManualLog: game.enableManualLog,
          })),
        });

        if (!updatedChallenge) {
          toast({ title: 'Update fehlgeschlagen', description: 'Die Challenge konnte nicht gespeichert werden.', variant: 'destructive' });
          return;
        }

        toast({ title: 'Challenge gespeichert', description: `${updatedChallenge.title} wurde aktualisiert.` });
        router.push(`/challenges/view?id=${updatedChallenge.id}`);
      } catch (error) {
        toast({ title: 'Update fehlgeschlagen', description: (error as Error).message, variant: 'destructive' });
      }
    });
  };

  if (!isAuthReady || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="mt-4 text-lg">Challenge editor wird geladen...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (!challenge || !formState) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Challenge nicht gefunden</CardTitle>
          <CardDescription>Es konnte keine Challenge für diese ID geladen werden.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Zurück zur Startseite</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-5xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Edit3 className="h-6 w-6 text-primary" />
          Challenge bearbeiten
        </CardTitle>
        <CardDescription>
          Bearbeite Titel, Zeiten, Notizen und Spiele dieser Challenge. Änderungen gelten sofort für die Runtime-Daten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" value={formState.title} onChange={(event) => updateFormField('title', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledDateTime">Datum und Uhrzeit</Label>
            <Input id="scheduledDateTime" type="datetime-local" value={formState.scheduledDateTime} onChange={(event) => updateFormField('scheduledDateTime', event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="image">Bild-URL</Label>
            <Input id="image" value={formState.image} onChange={(event) => updateFormField('image', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime">Startzeit</Label>
            <Input id="startTime" value={formState.startTime} onChange={(event) => updateFormField('startTime', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">Endzeit</Label>
            <Input id="endTime" value={formState.endTime} onChange={(event) => updateFormField('endTime', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalDuration">Gesamtdauer</Label>
            <Input id="totalDuration" value={formState.totalDuration} onChange={(event) => updateFormField('totalDuration', event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="overallNotes">Overall Notes (eine Zeile = eine Note)</Label>
            <Textarea id="overallNotes" rows={5} value={formState.overallNotes} onChange={(event) => updateFormField('overallNotes', event.target.value)} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Spiele</h2>
              <p className="text-sm text-muted-foreground">Du kannst vorhandene Spiele anpassen oder neue hinzufügen.</p>
            </div>
            <Button type="button" variant="outline" onClick={addGame}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Spiel hinzufügen
            </Button>
          </div>

          <div className="space-y-4">
            {formState.games.map((game, index) => (
              <Card key={game.id ?? `new-${index}`} className="border border-border/70">
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Spiel {index + 1}</CardTitle>
                    <CardDescription>ID: {game.id ?? 'neu'}</CardDescription>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeGame(index)} disabled={formState.games.length <= 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={game.name} onChange={(event) => updateGameField(index, 'name', event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon Key</Label>
                    <Input value={game.iconName} onChange={(event) => updateGameField(index, 'iconName', event.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Objective</Label>
                    <Textarea rows={2} value={game.objective} onChange={(event) => updateGameField(index, 'objective', event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Progress</Label>
                    <Input type="number" min="1" value={game.targetProgress} onChange={(event) => updateGameField(index, 'targetProgress', event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Result</Label>
                    <Input value={game.result} onChange={(event) => updateGameField(index, 'result', event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={game.status} onChange={(event) => updateGameField(index, 'status', event.target.value as Game['status'])}>
                      <option value="pending">pending</option>
                      <option value="active">active</option>
                      <option value="completed">completed</option>
                      <option value="failed">failed</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={game.enableTryCounter} onChange={(event) => updateGameField(index, 'enableTryCounter', event.target.checked)} />
                      Try Counter aktiv
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={game.enableManualLog} onChange={(event) => updateGameField(index, 'enableManualLog', event.target.checked)} />
                      Manual Log aktiv
                    </label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Änderungen speichern
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/challenges/view?id=${challenge.id}`}>Zurück zur Detailseite</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
