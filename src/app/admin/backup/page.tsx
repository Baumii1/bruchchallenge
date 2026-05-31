"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AlertTriangle, CheckCircle2, DatabaseBackup, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { hardcodedPastChallenges } from '@/lib/hardcoded-challenges';
import { getFirebaseDb } from '@/lib/firebase-client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Challenge } from '@/types';

const STORAGE_KEY = 'bruchchallenge:challenges:v1';
const COLLECTION_ID = 'bruchchallenge';
const DOC_ID = 'shared-state';

const legacyPastChallengeIds = new Set([
  'past-challenge-1',
  'past-challenge-2',
  'past-challenge-3',
  'past-challenge-4',
  'past-challenge-5',
  'past-challenge-6',
  'challenge-1776454312994-fbrxs',
]);

const backupChallengeIds = new Set(hardcodedPastChallenges.map((challenge) => challenge.id));
const backupChallengeTitles = new Set(hardcodedPastChallenges.map((challenge) => challenge.title));

const cloneData = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getChallengeTimestamp = (challenge: Challenge): number => {
  if (challenge.scheduledDateTime) {
    const scheduledTimestamp = new Date(challenge.scheduledDateTime).getTime();
    if (Number.isFinite(scheduledTimestamp)) return scheduledTimestamp;
  }

  const dateTimestamp = new Date(challenge.date).getTime();
  if (Number.isFinite(dateTimestamp)) return dateTimestamp;

  return 0;
};

const sortChallenges = (snapshot: Challenge[]): Challenge[] => (
  [...snapshot].sort((a, b) => getChallengeTimestamp(b) - getChallengeTimestamp(a))
);

const shouldReplaceWithBackup = (challenge: Challenge): boolean => (
  legacyPastChallengeIds.has(challenge.id) ||
  backupChallengeIds.has(challenge.id) ||
  backupChallengeTitles.has(challenge.title)
);

const mergeBackupIntoSnapshot = (currentSnapshot: Challenge[]): Challenge[] => {
  const protectedCurrentChallenges = currentSnapshot.filter((challenge) => !shouldReplaceWithBackup(challenge));
  return sortChallenges([...cloneData(hardcodedPastChallenges), ...protectedCurrentChallenges]);
};

const readLocalSnapshot = (): Challenge[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Challenge[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeLocalSnapshot = (snapshot: Challenge[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  window.dispatchEvent(new CustomEvent('bruchchallenge:data-updated'));
};

export default function AdminBackupPage() {
  const { isAdmin, isAuthReady } = useAuth();
  const [remoteCount, setRemoteCount] = useState<number | null>(null);
  const [localCount, setLocalCount] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const backupSummary = useMemo(() => ({
    count: hardcodedPastChallenges.length,
    first: hardcodedPastChallenges[hardcodedPastChallenges.length - 1]?.title,
    latest: hardcodedPastChallenges[0]?.title,
  }), []);

  const refreshStatus = useCallback(async () => {
    setError(null);
    const localSnapshot = readLocalSnapshot();
    setLocalCount(localSnapshot?.length ?? 0);

    const db = getFirebaseDb();
    if (!db) {
      setRemoteCount(null);
      setError('Firebase ist nicht konfiguriert oder konnte nicht initialisiert werden.');
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, COLLECTION_ID, DOC_ID));
      const remoteChallenges = snapshot.data()?.challenges as Challenge[] | undefined;
      setRemoteCount(Array.isArray(remoteChallenges) ? remoteChallenges.length : 0);
    } catch (caughtError) {
      setRemoteCount(null);
      setError((caughtError as Error).message);
    }
  }, []);

  useEffect(() => {
    if (isAuthReady && isAdmin) {
      void refreshStatus();
    }
  }, [isAuthReady, isAdmin, refreshStatus]);

  const repairFirebaseFromBackup = () => {
    if (!isAdmin) return;

    startTransition(async () => {
      setMessage(null);
      setError(null);

      const db = getFirebaseDb();
      if (!db) {
        setError('Firebase ist nicht konfiguriert oder konnte nicht initialisiert werden.');
        return;
      }

      try {
        const docRef = doc(db, COLLECTION_ID, DOC_ID);
        const snapshot = await getDoc(docRef);
        const remoteChallenges = snapshot.data()?.challenges as Challenge[] | undefined;
        const currentSnapshot = Array.isArray(remoteChallenges)
          ? remoteChallenges
          : (readLocalSnapshot() ?? []);

        const repairedSnapshot = mergeBackupIntoSnapshot(currentSnapshot);
        await setDoc(docRef, { challenges: repairedSnapshot, updatedAt: Date.now() }, { merge: true });
        writeLocalSnapshot(repairedSnapshot);

        setRemoteCount(repairedSnapshot.length);
        setLocalCount(repairedSnapshot.length);
        setMessage(`Firebase wurde repariert: ${hardcodedPastChallenges.length} gesicherte Past-Challenges wurden als editierbare Daten eingetragen/ersetzt.`);
      } catch (caughtError) {
        setError((caughtError as Error).message);
      }
    });
  };

  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="mt-4 text-lg">Admin-Status wird geladen...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Admin-Login erforderlich</CardTitle>
          <CardDescription>Diese Backup-Seite darf nur von Admins verwendet werden.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="border-primary/30 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseBackup className="h-6 w-6 text-primary" />
            Challenge Backup & Repair
          </CardTitle>
          <CardDescription>
            Firebase bleibt die Live-Datenbank. Dieses Repo-Backup dient nur als sichere Reparatur- und Wiederherstellungsquelle für die Hall of Fame.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Repo-Backup</CardDescription>
            <CardTitle>{backupSummary.count} Challenges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Älteste: {backupSummary.first}</p>
            <p>Neueste: {backupSummary.latest}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Firebase Snapshot</CardDescription>
            <CardTitle>{remoteCount === null ? '—' : remoteCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={remoteCount === null ? 'destructive' : 'secondary'}>
              {remoteCount === null ? 'Nicht geladen' : 'Geladen'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>LocalStorage Snapshot</CardDescription>
            <CardTitle>{localCount === null ? '—' : localCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Browser-Kopie</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Hall of Fame reparieren
          </CardTitle>
          <CardDescription>
            Ersetzt nur bekannte alte/fehlerhafte Past-Challenge-Kopien anhand von ID oder Titel. Andere Challenges, etwa neu abgeschlossene Runs, bleiben erhalten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={repairFirebaseFromBackup} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseBackup className="mr-2 h-4 w-4" />}
              Firebase aus Backup reparieren
            </Button>
            <Button variant="outline" onClick={() => void refreshStatus()} disabled={isPending}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Status aktualisieren
            </Button>
          </div>

          {message && (
            <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
