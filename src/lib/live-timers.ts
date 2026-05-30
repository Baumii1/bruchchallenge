import type { Challenge, Game } from '@/types';

export const formatSecondsAsClock = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const getLiveChallengeSeconds = (challenge: Challenge | null | undefined, now = Date.now()): number => {
  if (!challenge) {
    return 0;
  }

  let totalSeconds = challenge.challengeAccumulatedDuration ?? 0;

  if (challenge.status === 'live' && challenge.isChallengeTimerActive && challenge.challengeStartedAt) {
    totalSeconds += (now - challenge.challengeStartedAt) / 1000;
  }

  return totalSeconds;
};

export const getLiveGameSeconds = (challenge: Challenge | null | undefined, game: Game, now = Date.now()): number => {
  let totalSeconds = game.accumulatedDuration ?? 0;

  if (challenge?.status === 'live' && game.isTimerActive && game.timerStartedAt) {
    totalSeconds += (now - game.timerStartedAt) / 1000;
  }

  return totalSeconds;
};
