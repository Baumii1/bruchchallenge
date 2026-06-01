"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Clock3, Gamepad2, RadioTower, WifiOff } from 'lucide-react';
import { fetchLivePageDataAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { HyperatePulseStrip } from '@/components/obs/HyperatePulseStrip';
import type { Challenge, Game } from '@/types';

const OBS_WIDTH = 360;
const OBS_HEIGHT = 640;
const REFRESH_INTERVAL_MS = 2000;
const PAGE_INTERVAL_MS = 7000;
const GAMES_PER_PAGE = 3;
const GAMES_PER_PAGE_WITH_ACTIVE_GAME = 2;
const CHALLENGE_STORAGE_KEY = 'bruchchallenge:challenges:v1';

const formatTime = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getChallengeSeconds = (challenge: Challenge | null, now: number): number => {
  if (!challenge) {
    return 0;
  }

  let seconds = challenge.challengeAccumulatedDuration ?? 0;

  if (challenge.status === 'live' && challenge.isChallengeTimerActive && challenge.challengeStartedAt) {
    seconds += (now - challenge.challengeStartedAt) / 1000;
  }

  return seconds;
};

const getGameSeconds = (challenge: Challenge, game: Game, now: number): number => {
  let seconds = game.accumulatedDuration ?? 0;

  if (challenge.status === 'live' && game.isTimerActive && game.timerStartedAt) {
    seconds += (now - game.timerStartedAt) / 1000;
  }

  return seconds;
};

const parseTargetProgressFromObjective = (objective?: string): number | undefined => {
  if (!objective) {
    return undefined;
  }

  const fractionMatch = objective.match(/\b\d+\s*\/\s*(\d+)\b/);
  if (fractionMatch?.[1]) {
    const parsedTarget = Number(fractionMatch[1]);
    return Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : undefined;
  }

  const simpleWinMatch = objective.match(/\b(\d+)\s*(?:win|wins|siege?|victor(?:y|ies))\b/i);
  if (simpleWinMatch?.[1]) {
    const parsedTarget = Number(simpleWinMatch[1]);
    return Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : undefined;
  }

  return undefined;
};

const formatWinCounter = (game: Game): string => {
  const parsedTarget = parseTargetProgressFromObjective(game.objective);
  const targetProgress = game.targetProgress && game.targetProgress > 0 ? game.targetProgress : parsedTarget;

  if (targetProgress) {
    const completedFallback = game.status === 'completed' ? targetProgress : 0;
    const currentProgress = game.currentProgress ?? completedFallback;
    return `${Math.max(0, Math.min(currentProgress, targetProgress))}/${targetProgress}`;
  }

  if (game.result) {
    return game.result;
  }

  if (typeof game.currentProgress === 'number') {
    return String(game.currentProgress);
  }

  if (game.enableTryCounter && typeof game.tryCount === 'number') {
    return `${game.tryCount}`;
  }

  return '0/1';
};

const chunkGames = (games: Game[], chunkSize: number): Game[][] => {
  if (games.length === 0) {
    return [[]];
  }

  const chunks: Game[][] = [];
  for (let index = 0; index < games.length; index += chunkSize) {
    chunks.push(games.slice(index, index + chunkSize));
  }

  return chunks;
};

const getActiveGame = (challenge: Challenge | null): Game | null => {
  if (!challenge) {
    return null;
  }

  return (
    challenge.games.find((game) => game.id === challenge.activeGameId) ??
    challenge.games.find((game) => game.isTimerActive) ??
    challenge.games.find((game) => game.status === 'active') ??
    null
  );
};

function ObsChallengeOverlayPage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pageIndex, setPageIndex] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadChallenge = useCallback(async () => {
    try {
      const nextChallenge = await fetchLivePageDataAction();
      setChallenge(nextChallenge);
      setLastUpdatedAt(Date.now());
      setLoadError(null);
    } catch (error) {
      console.error('Failed to load OBS challenge overlay data:', error);
      setLoadError('Sync fehlgeschlagen');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChallenge();

    const refreshInterval = window.setInterval(() => {
      void loadChallenge();
    }, REFRESH_INTERVAL_MS);

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key && event.key !== CHALLENGE_STORAGE_KEY) {
        return;
      }

      void loadChallenge();
    };

    const handleDataUpdate = () => {
      void loadChallenge();
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('bruchchallenge:data-updated', handleDataUpdate as EventListener);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('bruchchallenge:data-updated', handleDataUpdate as EventListener);
    };
  }, [loadChallenge]);

  useEffect(() => {
    const timerInterval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timerInterval);
  }, []);

  const activeGame = useMemo(() => getActiveGame(challenge), [challenge]);

  const pages = useMemo(() => {
    if (!challenge) {
      return [[]] as Game[][];
    }

    const gamesWithoutActiveGame = challenge.games.filter((game) => game.id !== activeGame?.id);
    const gamesPerPage = activeGame ? GAMES_PER_PAGE_WITH_ACTIVE_GAME : GAMES_PER_PAGE;
    return chunkGames(gamesWithoutActiveGame, gamesPerPage);
  }, [activeGame, challenge]);

  useEffect(() => {
    setPageIndex(0);
  }, [challenge?.id, activeGame?.id, pages.length]);

  useEffect(() => {
    if (pages.length <= 1) {
      return;
    }

    const pageInterval = window.setInterval(() => {
      setPageIndex((currentPage) => (currentPage + 1) % pages.length);
    }, PAGE_INTERVAL_MS);

    return () => window.clearInterval(pageInterval);
  }, [pages.length]);

  const currentPage = pages[pageIndex] ?? pages[0] ?? [];
  const totalSeconds = getChallengeSeconds(challenge, now);
  const liveBadgeText = challenge?.status === 'live' ? 'LIVE' : challenge?.status === 'upcoming' ? 'READY' : 'OFFLINE';
  const updatedSecondsAgo = lastUpdatedAt ? Math.max(0, Math.floor((now - lastUpdatedAt) / 1000)) : null;

  return (
    <div className="obs-page-root obs-browser-source fixed inset-0 z-50 flex items-start justify-start bg-transparent text-white">
      <section
        className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#050812] shadow-2xl"
        style={{ width: OBS_WIDTH, height: OBS_HEIGHT }}
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_5%,rgba(41,171,226,0.34),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(255,153,51,0.22),transparent_26%),linear-gradient(180deg,rgba(8,13,28,0.96),rgba(3,5,12,0.99))]" />
        <div className="absolute left-0 top-0 h-24 w-full bg-gradient-to-b from-white/10 to-transparent" />

        <div className="flex h-full flex-col px-4 py-4">
          <header className="mb-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.36em] text-primary/90">Bruch</p>
                <h1 className="text-[22px] font-black leading-none tracking-tight">Challenge</h1>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                <span className={cn('h-2.5 w-2.5 rounded-full', challenge?.status === 'live' ? 'animate-pulse bg-red-500' : 'bg-primary')} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">{liveBadgeText}</span>
              </div>
            </div>
          </header>

          <HyperatePulseStrip embedded className="mb-3" />

          {isInitialLoading ? (
            <EmptyState icon="loading" title="Lade Overlay" description="Live-Daten werden synchronisiert." />
          ) : !challenge ? (
            <EmptyState icon="offline" title="Keine Live-Challenge" description={loadError ?? 'Starte oder plane zuerst eine Challenge.'} />
          ) : (
            <>
              <div className="mb-3 min-h-[34px] rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Aktuelle Session</p>
                <p className="truncate text-[13px] font-bold leading-tight text-white/90">{challenge.title}</p>
              </div>

              {activeGame && (
                <div className="mb-3">
                  <div className="mb-1 flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
                    <RadioTower className="h-3.5 w-3.5" /> Jetzt aktiv
                  </div>
                  <GameRow challenge={challenge} game={activeGame} now={now} active />
                </div>
              )}

              <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                <span>Games</span>
                {pages.length > 1 && <span>Seite {pageIndex + 1}/{pages.length}</span>}
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                {currentPage.map((game) => (
                  <GameRow key={game.id} challenge={challenge} game={game} now={now} />
                ))}
              </div>

              <div className="mt-3 flex h-5 items-center justify-center gap-1.5">
                {pages.length > 1 &&
                  pages.map((_, index) => (
                    <span
                      key={index}
                      className={cn(
                        'h-2 rounded-full transition-all duration-500',
                        index === pageIndex ? 'w-6 bg-primary shadow-[0_0_14px_rgba(41,171,226,0.85)]' : 'w-2 bg-white/25'
                      )}
                    />
                  ))}
              </div>
            </>
          )}

          <footer className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3 shadow-inner">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
                  <Clock3 className="h-3.5 w-3.5" /> Gesamtzeit
                </p>
                <p className="mt-1 font-mono text-[27px] font-black leading-none tabular-nums text-white">{formatTime(totalSeconds)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Sync</p>
                <p className={cn('mt-1 text-[11px] font-bold', loadError ? 'text-red-300' : 'text-emerald-300')}>
                  {loadError ? loadError : updatedSecondsAgo === null ? '—' : `${updatedSecondsAgo}s`}
                </p>
              </div>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}

interface GameRowProps {
  challenge: Challenge;
  game: Game;
  now: number;
  active?: boolean;
}

function GameRow({ challenge, game, now, active = false }: GameRowProps) {
  const gameSeconds = getGameSeconds(challenge, game, now);
  const progressLabel = formatWinCounter(game);

  return (
    <div
      className={cn(
        'grid grid-cols-[74px_minmax(0,1fr)_48px] items-center gap-2 rounded-2xl border px-3 shadow-lg transition-all',
        active
          ? 'min-h-[84px] border-primary/60 bg-primary/20 shadow-[0_0_26px_rgba(41,171,226,0.28)]'
          : 'min-h-[58px] border-white/10 bg-white/[0.055]'
      )}
    >
      <div className="font-mono text-[13px] font-black tabular-nums text-white/90">{formatTime(gameSeconds)}</div>
      <div className="min-w-0 py-2">
        <p
          className={cn('break-words text-[13px] font-black leading-tight text-white', active && 'text-[15px]')}
          style={{ display: '-webkit-box', WebkitLineClamp: active ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {game.name}
        </p>
        {active && <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/90">läuft gerade</p>}
      </div>
      <div className="justify-self-end rounded-xl border border-white/10 bg-black/25 px-2 py-1 font-mono text-[13px] font-black tabular-nums text-white">
        {progressLabel}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: 'loading' | 'offline';
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  const Icon = icon === 'loading' ? Activity : WifiOff;

  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.05] px-5 text-center">
      <div className="mb-4 rounded-full border border-white/10 bg-black/20 p-4">
        <Icon className={cn('h-8 w-8 text-primary', icon === 'loading' && 'animate-pulse')} />
      </div>
      <p className="text-lg font-black">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{description}</p>
      <div className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
        <Gamepad2 className="h-3.5 w-3.5" /> OBS Overlay
      </div>
    </div>
  );
}

export default ObsChallengeOverlayPage;