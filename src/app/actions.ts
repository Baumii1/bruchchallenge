// "use server"; directive removed to allow static export.
// These functions run client-side and persist via local storage / Firebase sync.

import {
  challenges,
  defaultGameFlags,
  setDataChallengeStatus,
  setDataToggleOverallChallengeTimer,
  setDataActiveGameAndToggleTimer,
  setDataUpdateGameProgress,
  getDataChallengeById,
  setDataResetChallengeToUpcoming,
  getDataChallenges,
  setDataDeleteChallengeById,
  getDataLiveChallengeDetails,
  getDataUpcomingChallenge,
  setDataLogGameTry,
  setDataAddOverallNote,
  setDataEditOverallNote,
  setDataDeleteOverallNote,
  setDataCreateNewChallenge,
} from '@/lib/data';
import type { Challenge, Game } from '@/types';
import { ensureViewerFirebaseSession, getFirebaseAuthClient, getFirebaseDb, isAdminEmail, isFirebaseConfigured } from '@/lib/firebase-client';

interface ChallengeFormValues {
  title: string;
  scheduledDateTime: Date;
  image?: string | undefined | '';
  games: Array<{
    name: string;
    iconName: string;
    objective: string;
    targetProgress?: number | null | undefined;
    enableTryCounter?: boolean;
    enableManualLog?: boolean;
  }>;
}

interface ChallengeEditorGameValues {
  id?: string;
  name: string;
  iconName: string;
  objective: string;
  targetProgress?: number | null;
  enableTryCounter?: boolean;
  enableManualLog?: boolean;
  result?: string | null;
  status?: Game['status'];
}

interface ChallengeEditorValues {
  title: string;
  scheduledDateTime: string;
  image?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  totalDuration?: string | null;
  overallNotes?: string[];
  games: ChallengeEditorGameValues[];
}

const STORAGE_KEY = 'bruchchallenge:challenges:v1';
const SHARED_STATE_COLLECTION_ID = 'bruchchallenge';
const SHARED_STATE_DOC_ID = 'shared-state';
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? '';

const cloneData = <T,>(value: T): T => {
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }
  } catch {
    // Ignore and fall back to JSON clone.
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

const normalizeOptionalText = (value: string | null | undefined): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const decodeFirestoreValue = (value: any): unknown => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  if ('nullValue' in value) {
    return null;
  }

  if ('stringValue' in value) {
    return value.stringValue;
  }

  if ('booleanValue' in value) {
    return value.booleanValue;
  }

  if ('integerValue' in value) {
    return Number(value.integerValue);
  }

  if ('doubleValue' in value) {
    return Number(value.doubleValue);
  }

  if ('timestampValue' in value) {
    return value.timestampValue;
  }

  if ('arrayValue' in value) {
    const values = Array.isArray(value.arrayValue?.values) ? value.arrayValue.values : [];
    return values.map((entry: any) => decodeFirestoreValue(entry));
  }

  if ('mapValue' in value) {
    const fields = value.mapValue?.fields ?? {};
    return Object.entries(fields).reduce<Record<string, unknown>>((accumulator, [key, nestedValue]) => {
      accumulator[key] = decodeFirestoreValue(nestedValue);
      return accumulator;
    }, {});
  }

  return undefined;
};

const extractRemoteChallengesFromRestPayload = (payload: any): Challenge[] | null => {
  const decoded = decodeFirestoreValue({ mapValue: { fields: payload?.fields ?? {} } }) as Record<string, unknown> | undefined;
  const remoteChallenges = decoded?.challenges;

  return Array.isArray(remoteChallenges) && remoteChallenges.length > 0
    ? cloneData(remoteChallenges as Challenge[])
    : null;
};

const writeChallengesToBrowserStorage = (snapshot: Challenge[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  window.dispatchEvent(new CustomEvent('bruchchallenge:data-updated'));
};

const replaceInMemoryChallenges = (snapshot: Challenge[]) => {
  const nextSnapshot = cloneData(snapshot);
  challenges.splice(0, challenges.length, ...nextSnapshot);
};

const readRemoteChallengesSnapshotViaRest = async (): Promise<Challenge[] | null> => {
  if (!FIREBASE_PROJECT_ID) {
    return null;
  }

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${SHARED_STATE_COLLECTION_ID}/${SHARED_STATE_DOC_ID}`,
    {
      method: 'GET',
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return extractRemoteChallengesFromRestPayload(payload);
};

const readRemoteChallengesSnapshot = async (): Promise<Challenge[] | null> => {
  const db = getFirebaseDb();
  if (db) {
    try {
      await ensureViewerFirebaseSession();
      const { doc, getDoc } = await import('firebase/firestore');
      const challengeDocRef = doc(db, SHARED_STATE_COLLECTION_ID, SHARED_STATE_DOC_ID);
      const snapshot = await getDoc(challengeDocRef);

      if (snapshot.exists()) {
        const remoteChallenges = snapshot.data()?.challenges as Challenge[] | undefined;
        if (Array.isArray(remoteChallenges) && remoteChallenges.length > 0) {
          return cloneData(remoteChallenges);
        }
      }
    } catch (error) {
      console.warn('Firestore SDK snapshot fetch failed, trying REST fallback.', error);
    }
  }

  try {
    return await readRemoteChallengesSnapshotViaRest();
  } catch (error) {
    console.warn('Firestore REST snapshot fetch failed.', error);
    return null;
  }
};

const hydrateChallengesSnapshotForFreshSession = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  const hasLocalSnapshot = Boolean(window.localStorage.getItem(STORAGE_KEY));
  if (hasLocalSnapshot) {
    return;
  }

  try {
    const remoteSnapshot = await readRemoteChallengesSnapshot();
    if (!remoteSnapshot) {
      return;
    }

    replaceInMemoryChallenges(remoteSnapshot);
    writeChallengesToBrowserStorage(remoteSnapshot);
  } catch (error) {
    console.warn('Fresh-session challenge hydration failed, using current in-memory snapshot.', error);
  }
};

const persistChallengesSnapshot = async () => {
  const snapshot = cloneData(challenges);

  writeChallengesToBrowserStorage(snapshot);

  const db = getFirebaseDb();
  if (db) {
    const { doc, setDoc } = await import('firebase/firestore');
    const challengeDocRef = doc(db, SHARED_STATE_COLLECTION_ID, SHARED_STATE_DOC_ID);
    await setDoc(challengeDocRef, { challenges: snapshot, updatedAt: Date.now() }, { merge: true });
  }
};

const revalidateAllRelevantPaths = (challengeId?: string) => {
  console.log('client revalidate marker:', `/`, `/challenges/live`, challengeId ? `/challenges/view?id=${challengeId}` : '', '/admin/create-challenge', challengeId ? `/admin/edit-challenge?id=${challengeId}` : '');
};

const requireAdminSession = () => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase Auth ist nicht konfiguriert. Lege zuerst ein Admin-Login an.');
  }

  const auth = getFirebaseAuthClient();
  const currentUser = auth?.currentUser ?? null;

  if (!currentUser || !isAdminEmail(currentUser.email)) {
    throw new Error('Admin privileges required. Bitte mit einem freigeschalteten Admin-Konto anmelden.');
  }
};

export async function createNewChallengeAction(data: ChallengeFormValues): Promise<Challenge | null> {
  requireAdminSession();

  const transformedData = {
    ...data,
    scheduledDateTime: data.scheduledDateTime.toISOString(),
    image: data.image || undefined,
    games: data.games.map((game) => ({
      ...game,
      targetProgress: game.targetProgress === null ? undefined : game.targetProgress,
    })),
  };

  const newChallenge = setDataCreateNewChallenge(transformedData);
  if (newChallenge) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths(newChallenge.id);
    return newChallenge;
  }
  return null;
}

export async function updateChallengeAction(challengeId: string, data: ChallengeEditorValues): Promise<Challenge | null> {
  requireAdminSession();
  getDataChallenges();

  const challengeIndex = challenges.findIndex((challenge) => challenge.id === challengeId);
  if (challengeIndex === -1) {
    return null;
  }

  const existingChallenge = challenges[challengeIndex];
  const existingGamesById = new Map(existingChallenge.games.map((game) => [game.id, game]));
  const nextScheduledDateTime = new Date(data.scheduledDateTime).toISOString();

  const nextGames: Game[] = data.games.map((game, index) => {
    const existingGame = (game.id && existingGamesById.get(game.id)) ?? existingChallenge.games[index];

    const baseGame: Game = existingGame
      ? { ...existingGame }
      : {
          ...(defaultGameFlags as Partial<Game>),
          id: `${existingChallenge.id}-g${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
          name: '',
          iconName: 'default',
          objective: '',
          status: 'pending',
          currentProgress: 0,
          accumulatedDuration: 0,
          isTimerActive: false,
          timerStartedAt: undefined,
          attempts: [],
          tryCount: 0,
          result: undefined,
        };

    return {
      ...baseGame,
      name: game.name.trim(),
      iconName: game.iconName.trim().toLowerCase(),
      objective: game.objective.trim(),
      targetProgress: game.targetProgress ?? undefined,
      enableTryCounter: Boolean(game.enableTryCounter),
      enableManualLog: Boolean(game.enableManualLog),
      result: normalizeOptionalText(game.result),
      status: game.status ?? baseGame.status ?? 'pending',
    };
  });

  const nextChallenge: Challenge = {
    ...existingChallenge,
    title: data.title.trim(),
    scheduledDateTime: nextScheduledDateTime,
    date: nextScheduledDateTime.split('T')[0],
    image: normalizeOptionalText(data.image),
    startTime: normalizeOptionalText(data.startTime),
    endTime: normalizeOptionalText(data.endTime),
    totalDuration: normalizeOptionalText(data.totalDuration),
    overallNotes: (data.overallNotes ?? []).map((note) => note.trim()).filter(Boolean),
    games: nextGames,
  };

  challenges[challengeIndex] = nextChallenge;
  await persistChallengesSnapshot();
  revalidateAllRelevantPaths(challengeId);
  return cloneData(nextChallenge);
}

export async function startChallengeAction(challengeId: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataChallengeStatus(challengeId, 'live');
  if (updatedChallenge) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function toggleChallengeTimerAction(challengeId: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataToggleOverallChallengeTimer(challengeId);
  if (updatedChallenge) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function toggleGameTimerAction(challengeId: string, gameId: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataActiveGameAndToggleTimer(challengeId, gameId);
  if (updatedChallenge) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function updateGameProgressAction(challengeId: string, gameId: string, change: number, note?: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataUpdateGameProgress(challengeId, gameId, change, note);
  if (updatedChallenge) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function logGameTryAction(challengeId: string, gameId: string, note?: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataLogGameTry(challengeId, gameId, note);
  if (updatedChallenge) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function addOverallNoteAction(challengeId: string, note: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataAddOverallNote(challengeId, note);
  if (updatedChallenge) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function editOverallNoteAction(challengeId: string, noteIndex: number, newNoteText: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataEditOverallNote(challengeId, noteIndex, newNoteText);
  if (updatedChallenge) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function deleteOverallNoteAction(challengeId: string, noteIndex: number): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataDeleteOverallNote(challengeId, noteIndex);
  if (updatedChallenge) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function endChallengeAction(challengeId: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataChallengeStatus(challengeId, 'past');
  if (updatedChallenge) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function resetChallengeAction(challengeId: string): Promise<Challenge | null> {
  requireAdminSession();
  const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const updatedChallenge = setDataResetChallengeToUpcoming(challengeId, futureDate);
  if (updatedChallenge) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function restorePastChallengeAction(challengeId: string): Promise<Challenge | null> {
  requireAdminSession();
  const futureDate = new Date(Date.now() + 60 * 60 * 1000);
  const updatedChallenge = setDataResetChallengeToUpcoming(challengeId, futureDate);
  if (updatedChallenge) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function fetchChallengeDetailsAction(challengeId: string): Promise<Challenge | null> {
  await hydrateChallengesSnapshotForFreshSession();
  const challenge = getDataChallengeById(challengeId);
  return challenge || null;
}

export async function getChallengeCreationBlockers(): Promise<{ hasLiveChallenge: boolean; hasUpcomingChallenge: boolean }> {
  await hydrateChallengesSnapshotForFreshSession();
  const allChallengesData = getDataChallenges();
  const isLiveChallengePresent = allChallengesData.some((challenge) => challenge.status === 'live');
  const isUpcomingChallengePresent = allChallengesData.some((challenge) =>
    challenge.status === 'upcoming' &&
    challenge.scheduledDateTime &&
    new Date(challenge.scheduledDateTime) > new Date()
  );

  return {
    hasLiveChallenge: isLiveChallengePresent,
    hasUpcomingChallenge: isUpcomingChallengePresent,
  };
}

export async function deleteChallengeAction(challengeId: string): Promise<{ success: boolean }> {
  requireAdminSession();

  const existingChallenge = getDataChallengeById(challengeId);
  if (!existingChallenge) {
    return { success: false };
  }

  const success = setDataDeleteChallengeById(challengeId);
  if (success) {
    await persistChallengesSnapshot();
    revalidateAllRelevantPaths();
  }

  return { success };
}

export async function fetchLivePageDataAction(): Promise<Challenge | null> {
  await hydrateChallengesSnapshotForFreshSession();

  let challengeToLoad: Challenge | null = getDataLiveChallengeDetails();
  if (!challengeToLoad) {
    challengeToLoad = getDataUpcomingChallenge();
  }
  return challengeToLoad;
}
