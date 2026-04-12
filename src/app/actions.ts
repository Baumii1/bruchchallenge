// "use server"; directive removed to allow static export.
// These functions run client-side and persist via local storage / Firebase sync.

import {
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
import type { Challenge } from '@/types';
import { getFirebaseAuthClient, isAdminEmail, isFirebaseConfigured } from '@/lib/firebase-client';

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

const revalidateAllRelevantPaths = (challengeId?: string) => {
  console.log('client revalidate marker:', `/`, `/challenges/live`, challengeId ? `/challenges/${challengeId}` : '', '/admin/create-challenge');
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
    revalidateAllRelevantPaths(newChallenge.id);
    return newChallenge;
  }
  return null;
}

export async function startChallengeAction(challengeId: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataChallengeStatus(challengeId, 'live');
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function toggleChallengeTimerAction(challengeId: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataToggleOverallChallengeTimer(challengeId);
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function toggleGameTimerAction(challengeId: string, gameId: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataActiveGameAndToggleTimer(challengeId, gameId);
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function updateGameProgressAction(challengeId: string, gameId: string, change: number, note?: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataUpdateGameProgress(challengeId, gameId, change, note);
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function logGameTryAction(challengeId: string, gameId: string, note?: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataLogGameTry(challengeId, gameId, note);
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function addOverallNoteAction(challengeId: string, note: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataAddOverallNote(challengeId, note);
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function editOverallNoteAction(challengeId: string, noteIndex: number, newNoteText: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataEditOverallNote(challengeId, noteIndex, newNoteText);
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function deleteOverallNoteAction(challengeId: string, noteIndex: number): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataDeleteOverallNote(challengeId, noteIndex);
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function endChallengeAction(challengeId: string): Promise<Challenge | null> {
  requireAdminSession();
  const updatedChallenge = setDataChallengeStatus(challengeId, 'past');
  if (updatedChallenge) {
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
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function fetchChallengeDetailsAction(challengeId: string): Promise<Challenge | null> {
  const challenge = getDataChallengeById(challengeId);
  return challenge || null;
}

export async function getChallengeCreationBlockers(): Promise<{ hasLiveChallenge: boolean; hasUpcomingChallenge: boolean }> {
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
    revalidateAllRelevantPaths();
  }

  return { success };
}

export async function fetchLivePageDataAction(): Promise<Challenge | null> {
  let challengeToLoad: Challenge | null = getDataLiveChallengeDetails();
  if (!challengeToLoad) {
    challengeToLoad = getDataUpcomingChallenge();
  }
  return challengeToLoad;
}
