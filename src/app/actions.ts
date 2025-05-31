
// "use server"; directive removed to allow static export.
// These functions will now run client-side. For persistence,
// they would need to be modified to call an external backend API.

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
  setDataCreateNewChallenge
} from '@/lib/data';
import type { Challenge, Game } from '@/types';
import { revalidatePath } from 'next/cache';

// Type for the form data coming from CreateChallengePage
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
    // In a static export context, revalidatePath is a no-op.
    // Client-side state management or page refresh would be needed for UI updates.
    console.log("revalidatePath called (no-op in static export): /", `/challenges/live`, challengeId ? `/challenges/${challengeId}` : '', '/admin/create-challenge');
    // revalidatePath('/');
    // revalidatePath('/challenges/live');
    // if (challengeId) {
    //     revalidatePath(`/challenges/${challengeId}`);
    // }
    // revalidatePath('/admin/create-challenge'); 
}

export async function createNewChallengeAction(data: ChallengeFormValues): Promise<Challenge | null> {
  const transformedData = {
    ...data,
    image: data.image || undefined,
    games: data.games.map(g => ({
        ...g,
        targetProgress: g.targetProgress === null ? undefined : g.targetProgress,
    }))
  };

  const newChallenge = setDataCreateNewChallenge(transformedData);
  if (newChallenge) {
    revalidateAllRelevantPaths(newChallenge.id);
    return newChallenge;
  }
  return null;
}


export async function startChallengeAction(challengeId: string): Promise<Challenge | null> {
  const updatedChallenge = setDataChallengeStatus(challengeId, 'live');
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function toggleChallengeTimerAction(challengeId: string): Promise<Challenge | null> {
  const updatedChallenge = setDataToggleOverallChallengeTimer(challengeId);
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function toggleGameTimerAction(challengeId: string, gameId: string): Promise<Challenge | null> {
  const updatedChallenge = setDataActiveGameAndToggleTimer(challengeId, gameId);
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function updateGameProgressAction(challengeId: string, gameId: string, change: number, note?: string): Promise<Challenge | null> {
  const updatedChallenge = setDataUpdateGameProgress(challengeId, gameId, change, note);
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function logGameTryAction(challengeId: string, gameId: string, note?: string): Promise<Challenge | null> {
  const updatedChallenge = setDataLogGameTry(challengeId, gameId, note);
  if (updatedChallenge) {
    revalidateAllRelevantPaths(challengeId);
    return updatedChallenge;
  }
  return null;
}

export async function addOverallNoteAction(challengeId: string, note: string): Promise<Challenge | null> {
    const updatedChallenge = setDataAddOverallNote(challengeId, note);
    if (updatedChallenge) {
        revalidateAllRelevantPaths(challengeId);
        return updatedChallenge;
    }
    return null;
}

export async function editOverallNoteAction(challengeId: string, noteIndex: number, newNoteText: string): Promise<Challenge | null> {
    const updatedChallenge = setDataEditOverallNote(challengeId, noteIndex, newNoteText);
    if (updatedChallenge) {
        revalidateAllRelevantPaths(challengeId);
        return updatedChallenge;
    }
    return null;
}

export async function deleteOverallNoteAction(challengeId: string, noteIndex: number): Promise<Challenge | null> {
    const updatedChallenge = setDataDeleteOverallNote(challengeId, noteIndex);
    if (updatedChallenge) {
        revalidateAllRelevantPaths(challengeId);
        return updatedChallenge;
    }
    return null;
}


export async function endChallengeAction(challengeId: string): Promise<Challenge | null> {
    const updatedChallenge = setDataChallengeStatus(challengeId, 'past');
    if (updatedChallenge) {
        revalidateAllRelevantPaths(challengeId); 
        return updatedChallenge;
    }
    return null;
}

export async function resetChallengeAction(challengeId: string): Promise<Challenge | null> {
    const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); 
    const updatedChallenge = setDataResetChallengeToUpcoming(challengeId, futureDate);
     if (updatedChallenge) {
        revalidateAllRelevantPaths(challengeId); 
        return updatedChallenge;
    }
    return null;
}

export async function fetchChallengeDetailsAction(challengeId: string): Promise<Challenge | null> {
    // This function is called server-side during build for generateStaticParams,
    // and potentially client-side if re-fetching details.
    // It directly accesses lib/data.ts which is fine for build time and client-side in-memory.
    const challenge = getDataChallengeById(challengeId);
    return challenge || null;
}

export async function getChallengeCreationBlockers(): Promise<{ hasLiveChallenge: boolean; hasUpcomingChallenge: boolean }> {
  // This function will run client-side, checking the in-memory data.
  const allChallengesData = getDataChallenges(); 
  const isLiveChallengePresent = allChallengesData.some(c => c.status === 'live');
  const isUpcomingChallengePresent = allChallengesData.some(c => 
    c.status === 'upcoming' && 
    c.scheduledDateTime && 
    new Date(c.scheduledDateTime) > new Date()
  );

  return {
    hasLiveChallenge: isLiveChallengePresent,
    hasUpcomingChallenge: isUpcomingChallengePresent,
  };
}

export async function deleteChallengeAction(challengeId: string): Promise<{ success: boolean }> {
    // This function will run client-side.
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
    // This function will run client-side.
    let challengeToLoad: Challenge | null = getDataLiveChallengeDetails(); 
    if (!challengeToLoad) {
        challengeToLoad = getDataUpcomingChallenge(); 
    }
    return challengeToLoad;
}
